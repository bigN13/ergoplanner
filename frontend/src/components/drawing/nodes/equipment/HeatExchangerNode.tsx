'use client';

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from '../base/BaseNode';
import { PIDNodeData, NodeVisualState } from '@/types/nodes';

interface HeatExchangerProperties extends PIDNodeData {
  properties: {
    type: 'shell-tube' | 'plate' | 'air-cooler';
    heatDuty: number;
    heatDutyUnit: string;
    shellSidePressure: number;
    tubeSidePressure: number;
    pressureUnit: string;
    shellSideTemperatureIn: number;
    shellSideTemperatureOut: number;
    tubeSideTemperatureIn: number;
    tubeSideTemperatureOut: number;
    temperatureUnit: string;
    shellSideMedium: string;
    tubeSideMedium: string;
    tubeCount?: number;
    tubeLength?: number;
    tubeDiameter?: number;
    shellDiameter?: number;
    passes?: number;
    material: string;
    tubeSheetMaterial?: string;
    efficiency: number;
    foulingFactor?: number;
    area?: number;
    areaUnit?: string;
    [key: string]: any;
  };
}

interface HeatExchangerNodeProps extends NodeProps<HeatExchangerProperties> {
  onPropertyChange?: (nodeId: string, properties: Record<string, any>) => void;
  onValidationChange?: (nodeId: string, isValid: boolean, errors: string[]) => void;
  onStateChange?: (nodeId: string, state: NodeVisualState) => void;
}

export const HeatExchangerNode: React.FC<HeatExchangerNodeProps> = memo((props) => {
  const { data, id } = props;

  // Heat exchanger-specific validation
  const validateHeatExchangerData = (hxData: HeatExchangerProperties): string[] => {
    const errors: string[] = [];

    // Heat duty validation
    if (!hxData.properties.heatDuty || hxData.properties.heatDuty <= 0) {
      errors.push('Heat duty must be greater than 0');
    }

    // Pressure validation
    if (!hxData.properties.shellSidePressure || hxData.properties.shellSidePressure < 0) {
      errors.push('Shell side pressure must be non-negative');
    }

    if (!hxData.properties.tubeSidePressure || hxData.properties.tubeSidePressure < 0) {
      errors.push('Tube side pressure must be non-negative');
    }

    // Temperature validation
    if (!hxData.properties.shellSideTemperatureIn && hxData.properties.shellSideTemperatureIn !== 0) {
      errors.push('Shell side inlet temperature must be specified');
    }

    if (!hxData.properties.shellSideTemperatureOut && hxData.properties.shellSideTemperatureOut !== 0) {
      errors.push('Shell side outlet temperature must be specified');
    }

    if (!hxData.properties.tubeSideTemperatureIn && hxData.properties.tubeSideTemperatureIn !== 0) {
      errors.push('Tube side inlet temperature must be specified');
    }

    if (!hxData.properties.tubeSideTemperatureOut && hxData.properties.tubeSideTemperatureOut !== 0) {
      errors.push('Tube side outlet temperature must be specified');
    }

    // Temperature logic validation
    const shellDeltaT = Math.abs(hxData.properties.shellSideTemperatureOut - hxData.properties.shellSideTemperatureIn);
    const tubeDeltaT = Math.abs(hxData.properties.tubeSideTemperatureOut - hxData.properties.tubeSideTemperatureIn);

    if (shellDeltaT === 0) {
      errors.push('Shell side temperature change cannot be zero');
    }

    if (tubeDeltaT === 0) {
      errors.push('Tube side temperature change cannot be zero');
    }

    // Medium validation
    if (!hxData.properties.shellSideMedium?.trim()) {
      errors.push('Shell side medium must be specified');
    }

    if (!hxData.properties.tubeSideMedium?.trim()) {
      errors.push('Tube side medium must be specified');
    }

    // Material validation
    if (!hxData.properties.material?.trim()) {
      errors.push('Heat exchanger material must be specified');
    }

    // Efficiency validation
    if (!hxData.properties.efficiency || hxData.properties.efficiency <= 0 || hxData.properties.efficiency > 100) {
      errors.push('Efficiency must be between 0 and 100%');
    }

    // Shell & tube specific validations
    if (hxData.properties.type === 'shell-tube') {
      if (!hxData.properties.tubeCount || hxData.properties.tubeCount <= 0) {
        errors.push('Tube count must be greater than 0 for shell & tube heat exchangers');
      }

      if (!hxData.properties.tubeLength || hxData.properties.tubeLength <= 0) {
        errors.push('Tube length must be greater than 0 for shell & tube heat exchangers');
      }

      if (!hxData.properties.tubeDiameter || hxData.properties.tubeDiameter <= 0) {
        errors.push('Tube diameter must be greater than 0 for shell & tube heat exchangers');
      }

      if (!hxData.properties.shellDiameter || hxData.properties.shellDiameter <= 0) {
        errors.push('Shell diameter must be greater than 0 for shell & tube heat exchangers');
      }

      if (!hxData.properties.passes || hxData.properties.passes <= 0) {
        errors.push('Number of passes must be greater than 0');
      }
    }

    // Area validation
    if (hxData.properties.area && hxData.properties.area <= 0) {
      errors.push('Heat transfer area must be greater than 0');
    }

    // Fouling factor validation
    if (hxData.properties.foulingFactor && (hxData.properties.foulingFactor < 0 || hxData.properties.foulingFactor > 0.01)) {
      errors.push('Fouling factor should be between 0 and 0.01 m²K/W');
    }

    return errors;
  };

  // Enhanced validation callback
  const handleValidationChange = (nodeId: string, isValid: boolean, errors: string[]) => {
    const hxErrors = validateHeatExchangerData(data);
    const allErrors = [...errors, ...hxErrors];
    const finalIsValid = allErrors.length === 0;

    props.onValidationChange?.(nodeId, finalIsValid, allErrors);
  };

  // Enhanced property change callback
  const handlePropertyChange = (nodeId: string, properties: Record<string, any>) => {
    const updatedProperties = { ...properties };

    // Calculate LMTD (Log Mean Temperature Difference)
    if (properties.shellSideTemperatureIn && properties.shellSideTemperatureOut &&
        properties.tubeSideTemperatureIn && properties.tubeSideTemperatureOut) {

      const dt1 = properties.shellSideTemperatureIn - properties.tubeSideTemperatureOut;
      const dt2 = properties.shellSideTemperatureOut - properties.tubeSideTemperatureIn;

      if (dt1 > 0 && dt2 > 0 && dt1 !== dt2) {
        const lmtd = (dt1 - dt2) / Math.log(dt1 / dt2);
        updatedProperties.lmtd = Math.round(lmtd * 100) / 100;
      }
    }

    // Calculate heat transfer area for shell & tube
    if (properties.type === 'shell-tube' && properties.tubeCount && properties.tubeLength && properties.tubeDiameter) {
      const area = properties.tubeCount * Math.PI * properties.tubeDiameter * properties.tubeLength;
      updatedProperties.area = Math.round(area * 100) / 100;
      updatedProperties.areaUnit = 'm²';
    }

    // Set default fouling factors based on medium
    if (!properties.foulingFactor) {
      const shellMedium = properties.shellSideMedium?.toLowerCase() || '';
      const tubeMedium = properties.tubeSideMedium?.toLowerCase() || '';

      let foulingFactor = 0.0001; // Default clean service

      if (shellMedium.includes('water') || tubeMedium.includes('water')) {
        if (shellMedium.includes('cooling') || tubeMedium.includes('cooling')) {
          foulingFactor = 0.0002; // Cooling water
        } else if (shellMedium.includes('process') || tubeMedium.includes('process')) {
          foulingFactor = 0.0003; // Process water
        }
      }

      if (shellMedium.includes('steam') || tubeMedium.includes('steam')) {
        foulingFactor = 0.0001; // Clean steam
      }

      if (shellMedium.includes('oil') || tubeMedium.includes('oil')) {
        foulingFactor = 0.0005; // Light oil
      }

      updatedProperties.foulingFactor = foulingFactor;
    }

    // Set default materials based on operating conditions
    if (!properties.material) {
      const maxPressure = Math.max(properties.shellSidePressure || 0, properties.tubeSidePressure || 0);
      const maxTemp = Math.max(
        properties.shellSideTemperatureIn || 0,
        properties.shellSideTemperatureOut || 0,
        properties.tubeSideTemperatureIn || 0,
        properties.tubeSideTemperatureOut || 0
      );

      if (maxTemp < 200 && maxPressure < 20) {
        updatedProperties.material = 'Carbon Steel';
      } else if (maxTemp < 400 && maxPressure < 40) {
        updatedProperties.material = 'Stainless Steel 304';
      } else {
        updatedProperties.material = 'Stainless Steel 316';
      }
    }

    // Set tube sheet material for shell & tube
    if (properties.type === 'shell-tube' && !properties.tubeSheetMaterial) {
      updatedProperties.tubeSheetMaterial = properties.material || 'Stainless Steel 304';
    }

    // Calculate effectiveness for plate heat exchangers
    if (properties.type === 'plate' && properties.heatDuty && properties.shellSideTemperatureIn && properties.tubeSideTemperatureIn) {
      const maxDeltaT = Math.abs(properties.shellSideTemperatureIn - properties.tubeSideTemperatureIn);
      const actualDeltaT = Math.abs((properties.shellSideTemperatureOut || 0) - properties.shellSideTemperatureIn);

      if (maxDeltaT > 0) {
        const effectiveness = (actualDeltaT / maxDeltaT) * 100;
        updatedProperties.effectiveness = Math.round(effectiveness * 100) / 100;
      }
    }

    // Set default passes for shell & tube based on size
    if (properties.type === 'shell-tube' && !properties.passes && properties.tubeCount) {
      if (properties.tubeCount < 100) {
        updatedProperties.passes = 1;
      } else if (properties.tubeCount < 500) {
        updatedProperties.passes = 2;
      } else {
        updatedProperties.passes = 4;
      }
    }

    // Calculate overall heat transfer coefficient
    if (properties.heatDuty && properties.area && updatedProperties.lmtd) {
      const U = properties.heatDuty / (properties.area * updatedProperties.lmtd);
      updatedProperties.overallHeatTransferCoefficient = Math.round(U * 100) / 100;
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

HeatExchangerNode.displayName = 'HeatExchangerNode';

export default HeatExchangerNode;