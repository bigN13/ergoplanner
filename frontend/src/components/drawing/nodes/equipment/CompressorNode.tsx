'use client';

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from '../base/BaseNode';
import { PIDNodeData, NodeVisualState } from '@/types/nodes';

interface CompressorProperties extends PIDNodeData {
  properties: {
    type: 'centrifugal' | 'reciprocating' | 'screw';
    capacity: number;
    capacityUnit: string;
    compressionRatio: number;
    suctionPressure: number;
    dischargePressure: number;
    pressureUnit: string;
    suctionTemperature: number;
    dischargeTemperature: number;
    temperatureUnit: string;
    powerRating: number;
    powerUnit: string;
    efficiency: number;
    speed: number;
    speedUnit: string;
    stages?: number;
    cooling?: 'air' | 'water' | 'none';
    lubrication?: 'oil' | 'oil-free';
    drive?: 'electric-motor' | 'gas-turbine' | 'steam-turbine';
    material: string;
    gasType: string;
    molecularWeight?: number;
    compressionType?: 'adiabatic' | 'isothermal' | 'polytropic';
    polytropicExponent?: number;
    intercooling?: boolean;
    aftercooling?: boolean;
    [key: string]: any;
  };
}

interface CompressorNodeProps extends NodeProps<CompressorProperties> {
  onPropertyChange?: (nodeId: string, properties: Record<string, any>) => void;
  onValidationChange?: (nodeId: string, isValid: boolean, errors: string[]) => void;
  onStateChange?: (nodeId: string, state: NodeVisualState) => void;
}

export const CompressorNode: React.FC<CompressorNodeProps> = memo((props) => {
  const { data, id } = props;

  // Compressor-specific validation
  const validateCompressorData = (compData: CompressorProperties): string[] => {
    const errors: string[] = [];

    // Capacity validation
    if (!compData.properties.capacity || compData.properties.capacity <= 0) {
      errors.push('Compressor capacity must be greater than 0');
    }

    // Pressure validation
    if (!compData.properties.suctionPressure || compData.properties.suctionPressure <= 0) {
      errors.push('Suction pressure must be greater than 0');
    }

    if (!compData.properties.dischargePressure || compData.properties.dischargePressure <= 0) {
      errors.push('Discharge pressure must be greater than 0');
    }

    if (compData.properties.dischargePressure <= compData.properties.suctionPressure) {
      errors.push('Discharge pressure must be greater than suction pressure');
    }

    // Compression ratio validation
    if (!compData.properties.compressionRatio || compData.properties.compressionRatio <= 1) {
      errors.push('Compression ratio must be greater than 1');
    }

    // Temperature validation
    if (!compData.properties.suctionTemperature && compData.properties.suctionTemperature !== 0) {
      errors.push('Suction temperature must be specified');
    }

    if (!compData.properties.dischargeTemperature && compData.properties.dischargeTemperature !== 0) {
      errors.push('Discharge temperature must be specified');
    }

    if (compData.properties.dischargeTemperature <= compData.properties.suctionTemperature) {
      errors.push('Discharge temperature should be greater than suction temperature for compression');
    }

    // Power rating validation
    if (!compData.properties.powerRating || compData.properties.powerRating <= 0) {
      errors.push('Power rating must be greater than 0');
    }

    // Efficiency validation
    if (!compData.properties.efficiency || compData.properties.efficiency <= 0 || compData.properties.efficiency > 100) {
      errors.push('Efficiency must be between 0 and 100%');
    }

    // Speed validation
    if (!compData.properties.speed || compData.properties.speed <= 0) {
      errors.push('Operating speed must be greater than 0');
    }

    // Material validation
    if (!compData.properties.material?.trim()) {
      errors.push('Compressor material must be specified');
    }

    // Gas type validation
    if (!compData.properties.gasType?.trim()) {
      errors.push('Gas type must be specified');
    }

    // Type-specific validations
    switch (compData.properties.type) {
      case 'centrifugal':
        if (compData.properties.speed < 3000) {
          errors.push('Centrifugal compressor speed typically should be at least 3000 RPM');
        }
        if (compData.properties.compressionRatio > 4) {
          errors.push('Single-stage centrifugal compressor ratio typically should not exceed 4:1');
        }
        break;

      case 'reciprocating':
        if (compData.properties.compressionRatio > 8) {
          errors.push('Single-stage reciprocating compressor ratio typically should not exceed 8:1');
        }
        if (compData.properties.speed > 1800) {
          errors.push('Reciprocating compressor speed typically should not exceed 1800 RPM');
        }
        break;

      case 'screw':
        if (compData.properties.compressionRatio > 10) {
          errors.push('Screw compressor ratio typically should not exceed 10:1');
        }
        break;
    }

    // Stages validation
    if (compData.properties.stages && compData.properties.stages < 1) {
      errors.push('Number of stages must be at least 1');
    }

    // Multi-stage validation
    if (compData.properties.stages && compData.properties.stages > 1) {
      const stageRatio = Math.pow(compData.properties.compressionRatio, 1 / compData.properties.stages);
      if (stageRatio > 4) {
        errors.push(`Stage compression ratio (${stageRatio.toFixed(2)}) should not exceed 4:1 for multi-stage compression`);
      }
    }

    // Molecular weight validation
    if (compData.properties.molecularWeight && (compData.properties.molecularWeight < 2 || compData.properties.molecularWeight > 200)) {
      errors.push('Molecular weight should be between 2 and 200 kg/kmol');
    }

    // Polytropic exponent validation
    if (compData.properties.polytropicExponent && (compData.properties.polytropicExponent < 1 || compData.properties.polytropicExponent > 2)) {
      errors.push('Polytropic exponent should be between 1 and 2');
    }

    return errors;
  };

  // Enhanced validation callback
  const handleValidationChange = (nodeId: string, isValid: boolean, errors: string[]) => {
    const compErrors = validateCompressorData(data);
    const allErrors = [...errors, ...compErrors];
    const finalIsValid = allErrors.length === 0;

    props.onValidationChange?.(nodeId, finalIsValid, allErrors);
  };

  // Enhanced property change callback
  const handlePropertyChange = (nodeId: string, properties: Record<string, any>) => {
    const updatedProperties = { ...properties };

    // Auto-calculate compression ratio
    if (properties.suctionPressure && properties.dischargePressure) {
      const ratio = properties.dischargePressure / properties.suctionPressure;
      updatedProperties.compressionRatio = Math.round(ratio * 100) / 100;
    }

    // Auto-calculate number of stages based on compression ratio and type
    if (properties.compressionRatio && !properties.stages) {
      let recommendedStages = 1;

      switch (properties.type) {
        case 'centrifugal':
          if (properties.compressionRatio > 4) {
            recommendedStages = Math.ceil(Math.log(properties.compressionRatio) / Math.log(4));
          }
          break;
        case 'reciprocating':
          if (properties.compressionRatio > 4) {
            recommendedStages = Math.ceil(Math.log(properties.compressionRatio) / Math.log(4));
          }
          break;
        case 'screw':
          if (properties.compressionRatio > 8) {
            recommendedStages = 2;
          }
          break;
      }

      updatedProperties.stages = recommendedStages;
    }

    // Set default cooling based on compression ratio
    if (!properties.cooling) {
      if (properties.compressionRatio > 3) {
        updatedProperties.cooling = 'water';
      } else if (properties.compressionRatio > 2) {
        updatedProperties.cooling = 'air';
      } else {
        updatedProperties.cooling = 'none';
      }
    }

    // Set intercooling and aftercooling for multi-stage
    if (properties.stages && properties.stages > 1) {
      if (properties.intercooling === undefined) {
        updatedProperties.intercooling = true;
      }
      if (properties.aftercooling === undefined) {
        updatedProperties.aftercooling = true;
      }
    }

    // Calculate theoretical discharge temperature (adiabatic)
    if (properties.suctionTemperature && properties.compressionRatio && properties.gasType) {
      let gamma = 1.4; // Default for air

      // Set gamma based on gas type
      switch (properties.gasType.toLowerCase()) {
        case 'air':
        case 'nitrogen':
        case 'oxygen':
          gamma = 1.4;
          break;
        case 'methane':
        case 'natural gas':
          gamma = 1.3;
          break;
        case 'hydrogen':
          gamma = 1.41;
          break;
        case 'carbon dioxide':
          gamma = 1.28;
          break;
        case 'ammonia':
          gamma = 1.31;
          break;
      }

      const suctionTempK = properties.suctionTemperature + 273.15;
      const dischargeTempK = suctionTempK * Math.pow(properties.compressionRatio, (gamma - 1) / gamma);
      const dischargeTemp = dischargeTempK - 273.15;

      if (!properties.dischargeTemperature) {
        updatedProperties.dischargeTemperature = Math.round(dischargeTemp);
      }

      updatedProperties.theoreticalDischargeTemperature = Math.round(dischargeTemp);
    }

    // Calculate power requirement (simplified)
    if (properties.capacity && properties.compressionRatio && properties.suctionPressure && properties.efficiency) {
      const k = 1.4; // Assuming air
      const n = k; // Adiabatic process

      const theoreticalPower = (n / (n - 1)) * (properties.suctionPressure * properties.capacity / 60) *
                              (Math.pow(properties.compressionRatio, (n - 1) / n) - 1) / 1000; // kW

      const actualPower = theoreticalPower / (properties.efficiency / 100);

      if (!properties.powerRating) {
        updatedProperties.powerRating = Math.round(actualPower * 1.1); // 10% safety factor
      }

      updatedProperties.theoreticalPower = Math.round(theoreticalPower * 100) / 100;
    }

    // Set default lubrication based on type
    if (!properties.lubrication) {
      switch (properties.type) {
        case 'centrifugal':
          updatedProperties.lubrication = 'oil';
          break;
        case 'reciprocating':
          updatedProperties.lubrication = 'oil';
          break;
        case 'screw':
          if (properties.capacity < 1000) {
            updatedProperties.lubrication = 'oil-free';
          } else {
            updatedProperties.lubrication = 'oil';
          }
          break;
      }
    }

    // Set default drive based on power rating
    if (!properties.drive) {
      if (properties.powerRating < 100) {
        updatedProperties.drive = 'electric-motor';
      } else if (properties.powerRating < 1000) {
        updatedProperties.drive = 'electric-motor';
      } else {
        updatedProperties.drive = 'gas-turbine';
      }
    }

    // Set default material based on operating conditions
    if (!properties.material) {
      const maxTemp = Math.max(properties.suctionTemperature || 0, properties.dischargeTemperature || 0);
      const maxPressure = Math.max(properties.suctionPressure || 0, properties.dischargePressure || 0);

      if (maxTemp < 200 && maxPressure < 50) {
        updatedProperties.material = 'Cast Iron';
      } else if (maxTemp < 400 && maxPressure < 100) {
        updatedProperties.material = 'Carbon Steel';
      } else {
        updatedProperties.material = 'Stainless Steel';
      }
    }

    // Set molecular weight based on gas type
    if (!properties.molecularWeight && properties.gasType) {
      const molecularWeights: Record<string, number> = {
        'air': 28.97,
        'nitrogen': 28.01,
        'oxygen': 32.00,
        'methane': 16.04,
        'natural gas': 19.00,
        'hydrogen': 2.02,
        'carbon dioxide': 44.01,
        'ammonia': 17.03,
        'propane': 44.10
      };

      const gasType = properties.gasType.toLowerCase();
      if (molecularWeights[gasType]) {
        updatedProperties.molecularWeight = molecularWeights[gasType];
      }
    }

    // Set polytropic exponent
    if (!properties.polytropicExponent) {
      if (properties.cooling === 'none') {
        updatedProperties.polytropicExponent = 1.4; // Adiabatic
      } else if (properties.cooling === 'water') {
        updatedProperties.polytropicExponent = 1.15; // Heavily cooled
      } else {
        updatedProperties.polytropicExponent = 1.25; // Air cooled
      }
    }

    props.onPropertyChange?.(nodeId, updatedProperties);
  };

  return (
    <BaseNode
      {...props}
      onValidationChange={handleValidationChange}
      onPropertyChange={handlePropertyChange}
    />
  );
});

CompressorNode.displayName = 'CompressorNode';

export default CompressorNode;