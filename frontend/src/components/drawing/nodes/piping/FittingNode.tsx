'use client';

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from '../base/BaseNode';
import { PIDNodeData, NodeVisualState } from '@/types/nodes';

interface FittingProperties extends PIDNodeData {
  properties: {
    fittingType: 'elbow' | 'tee' | 'reducer' | 'coupling' | 'union' | 'cap' | 'flange' | 'gasket';
    size1: number;
    size2?: number; // For reducers
    sizeUnit: string;
    angle?: number; // For elbows
    pressureRating: number;
    pressureUnit: string;
    temperatureRating: number;
    temperatureUnit: string;
    material: string;
    endConnections: string;
    standard: string;
    schedule?: string; // Pipe schedule
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
      thickness?: number;
    };
    weight?: number;
    weightUnit?: string;
    [key: string]: any;
  };
}

interface FittingNodeProps extends NodeProps<FittingProperties> {
  onPropertyChange?: (nodeId: string, properties: Record<string, any>) => void;
  onValidationChange?: (nodeId: string, isValid: boolean, errors: string[]) => void;
  onStateChange?: (nodeId: string, state: NodeVisualState) => void;
}

export const FittingNode: React.FC<FittingNodeProps> = memo((props) => {
  const { data, id } = props;

  // Fitting-specific validation
  const validateFittingData = (fittingData: FittingProperties): string[] => {
    const errors: string[] = [];

    // Fitting type validation
    const validFittingTypes = ['elbow', 'tee', 'reducer', 'coupling', 'union', 'cap', 'flange', 'gasket'];
    if (!validFittingTypes.includes(fittingData.properties.fittingType)) {
      errors.push('Invalid fitting type');
    }

    // Size validation
    if (!fittingData.properties.size1 || fittingData.properties.size1 <= 0) {
      errors.push('Primary size must be greater than 0');
    }

    // Size unit validation
    if (!fittingData.properties.sizeUnit?.trim()) {
      errors.push('Size unit must be specified');
    }

    // Reducer specific validations
    if (fittingData.properties.fittingType === 'reducer') {
      if (!fittingData.properties.size2 || fittingData.properties.size2 <= 0) {
        errors.push('Secondary size must be specified for reducers');
      }

      if (fittingData.properties.size2 && fittingData.properties.size1 <= fittingData.properties.size2) {
        errors.push('Primary size must be larger than secondary size for reducers');
      }
    }

    // Elbow specific validations
    if (fittingData.properties.fittingType === 'elbow') {
      if (!fittingData.properties.angle) {
        errors.push('Angle must be specified for elbows');
      }

      const validAngles = [15, 22.5, 30, 45, 60, 90];
      if (fittingData.properties.angle && !validAngles.includes(fittingData.properties.angle)) {
        errors.push('Invalid elbow angle (valid: 15°, 22.5°, 30°, 45°, 60°, 90°)');
      }
    }

    // Pressure rating validation
    if (!fittingData.properties.pressureRating || fittingData.properties.pressureRating <= 0) {
      errors.push('Pressure rating must be greater than 0');
    }

    if (!fittingData.properties.pressureUnit?.trim()) {
      errors.push('Pressure unit must be specified');
    }

    // Temperature rating validation
    if (fittingData.properties.temperatureRating === undefined) {
      errors.push('Temperature rating must be specified');
    }

    if (!fittingData.properties.temperatureUnit?.trim()) {
      errors.push('Temperature unit must be specified');
    }

    // Material validation
    if (!fittingData.properties.material?.trim()) {
      errors.push('Material must be specified');
    }

    // End connections validation
    if (!fittingData.properties.endConnections?.trim()) {
      errors.push('End connections must be specified');
    }

    // Standard validation
    if (!fittingData.properties.standard?.trim()) {
      errors.push('Standard must be specified');
    }

    // Validate standard compatibility
    const validStandards = ['ASME B16.9', 'ASME B16.11', 'DIN 2605', 'ISO 3419', 'BS 1560'];
    if (fittingData.properties.standard && !validStandards.includes(fittingData.properties.standard)) {
      errors.push('Invalid or unsupported standard');
    }

    // Schedule validation for threaded/socket weld fittings
    if (fittingData.properties.endConnections?.includes('threaded') ||
        fittingData.properties.endConnections?.includes('socket')) {
      if (!fittingData.properties.schedule?.trim()) {
        errors.push('Schedule must be specified for threaded or socket weld fittings');
      }
    }

    // Size compatibility validation with common pipe sizes
    const standardSizes = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24];
    if (!standardSizes.includes(fittingData.properties.size1)) {
      errors.push(`Non-standard primary size: ${fittingData.properties.size1}"`);
    }

    if (fittingData.properties.size2 && !standardSizes.includes(fittingData.properties.size2)) {
      errors.push(`Non-standard secondary size: ${fittingData.properties.size2}"`);
    }

    // Material-pressure-temperature compatibility
    if (fittingData.properties.material && fittingData.properties.pressureRating && fittingData.properties.temperatureRating) {
      const compatibility = validateMaterialCompatibility(
        fittingData.properties.material,
        fittingData.properties.pressureRating,
        fittingData.properties.temperatureRating
      );

      if (!compatibility.isValid) {
        errors.push(...compatibility.errors);
      }
    }

    return errors;
  };

  // Enhanced validation callback
  const handleValidationChange = (nodeId: string, isValid: boolean, errors: string[]) => {
    const fittingErrors = validateFittingData(data);
    const allErrors = [...errors, ...fittingErrors];
    const finalIsValid = allErrors.length === 0;

    props.onValidationChange?.(nodeId, finalIsValid, allErrors);
  };

  // Enhanced property change callback
  const handlePropertyChange = (nodeId: string, properties: Record<string, any>) => {
    const updatedProperties = { ...properties };

    // Set default angle for elbows
    if (properties.fittingType === 'elbow' && !properties.angle) {
      updatedProperties.angle = 90; // 90° is most common
    }

    // Set default size2 for tees (same as size1)
    if (properties.fittingType === 'tee' && properties.size1 && !properties.size2) {
      updatedProperties.size2 = properties.size1;
    }

    // Set default material based on size and pressure
    if (!properties.material) {
      if (properties.pressureRating > 40 || (properties.size1 && properties.size1 > 12)) {
        updatedProperties.material = 'Carbon Steel';
      } else if (properties.temperatureRating > 300) {
        updatedProperties.material = 'Stainless Steel 316';
      } else {
        updatedProperties.material = 'Carbon Steel';
      }
    }

    // Set default pressure rating based on material
    if (!properties.pressureRating) {
      switch (properties.material) {
        case 'PVC':
          updatedProperties.pressureRating = 16;
          break;
        case 'Carbon Steel':
          updatedProperties.pressureRating = 40;
          break;
        case 'Stainless Steel 304':
        case 'Stainless Steel 316':
          updatedProperties.pressureRating = 64;
          break;
        default:
          updatedProperties.pressureRating = 25;
      }
    }

    // Set default temperature rating based on material
    if (properties.temperatureRating === undefined) {
      switch (properties.material) {
        case 'PVC':
          updatedProperties.temperatureRating = 60;
          break;
        case 'Carbon Steel':
          updatedProperties.temperatureRating = 400;
          break;
        case 'Stainless Steel 304':
          updatedProperties.temperatureRating = 800;
          break;
        case 'Stainless Steel 316':
          updatedProperties.temperatureRating = 900;
          break;
        default:
          updatedProperties.temperatureRating = 200;
      }
    }

    // Set default end connections based on size and material
    if (!properties.endConnections) {
      if (properties.size1 <= 2) {
        if (properties.material === 'PVC') {
          updatedProperties.endConnections = 'Socket';
        } else {
          updatedProperties.endConnections = 'Threaded';
        }
      } else if (properties.size1 <= 4) {
        updatedProperties.endConnections = 'Socket Weld';
      } else {
        updatedProperties.endConnections = 'Butt Weld';
      }
    }

    // Set default standard based on material and region
    if (!properties.standard) {
      if (properties.material?.includes('Stainless Steel')) {
        updatedProperties.standard = 'ASME B16.9';
      } else if (properties.endConnections?.includes('threaded')) {
        updatedProperties.standard = 'ASME B16.11';
      } else {
        updatedProperties.standard = 'ASME B16.9';
      }
    }

    // Set default schedule for threaded/socket fittings
    if ((properties.endConnections?.includes('threaded') || properties.endConnections?.includes('Socket')) &&
        !properties.schedule) {
      if (properties.pressureRating > 25) {
        updatedProperties.schedule = 'SCH 80';
      } else {
        updatedProperties.schedule = 'SCH 40';
      }
    }

    // Set default units
    if (!properties.sizeUnit) {
      updatedProperties.sizeUnit = 'inch';
    }

    if (!properties.pressureUnit) {
      updatedProperties.pressureUnit = 'bar';
    }

    if (!properties.temperatureUnit) {
      updatedProperties.temperatureUnit = '°C';
    }

    // Calculate dimensions based on standard formulas
    if (properties.size1 && properties.standard && !properties.dimensions) {
      const dimensions = calculateFittingDimensions(
        properties.fittingType,
        properties.size1,
        properties.size2,
        properties.standard
      );
      updatedProperties.dimensions = dimensions;
    }

    // Calculate weight based on material and dimensions
    if (properties.material && properties.dimensions && !properties.weight) {
      const weight = calculateFittingWeight(
        properties.fittingType,
        properties.material,
        properties.dimensions,
        properties.size1
      );
      updatedProperties.weight = weight;
      updatedProperties.weightUnit = 'kg';
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

// Helper function to validate material compatibility
function validateMaterialCompatibility(
  material: string,
  pressure: number,
  temperature: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  const materialLimits: Record<string, { maxPressure: number; maxTemperature: number }> = {
    'PVC': { maxPressure: 16, maxTemperature: 60 },
    'Carbon Steel': { maxPressure: 100, maxTemperature: 400 },
    'Stainless Steel 304': { maxPressure: 150, maxTemperature: 800 },
    'Stainless Steel 316': { maxPressure: 150, maxTemperature: 900 },
    'Brass': { maxPressure: 25, maxTemperature: 200 },
    'Bronze': { maxPressure: 40, maxTemperature: 250 }
  };

  const limits = materialLimits[material];
  if (limits) {
    if (pressure > limits.maxPressure) {
      errors.push(`Pressure ${pressure} bar exceeds ${material} limit of ${limits.maxPressure} bar`);
    }

    if (temperature > limits.maxTemperature) {
      errors.push(`Temperature ${temperature}°C exceeds ${material} limit of ${limits.maxTemperature}°C`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

// Helper function to calculate fitting dimensions
function calculateFittingDimensions(
  fittingType: string,
  size1: number,
  size2?: number,
  standard?: string
): any {
  // Simplified dimension calculations based on ASME B16.9
  const nominalDiameter = size1;

  switch (fittingType) {
    case 'elbow':
      return {
        length: nominalDiameter * 25.4, // Convert to mm
        width: nominalDiameter * 25.4,
        height: nominalDiameter * 25.4
      };

    case 'tee':
      return {
        length: nominalDiameter * 25.4,
        width: nominalDiameter * 25.4,
        height: nominalDiameter * 25.4
      };

    case 'reducer':
      const length = Math.max(size1, size2 || 0) * 25.4;
      return {
        length: length,
        width: size1 * 25.4,
        height: (size2 || size1) * 25.4
      };

    default:
      return {
        length: nominalDiameter * 20,
        width: nominalDiameter * 20,
        height: nominalDiameter * 20
      };
  }
}

// Helper function to calculate fitting weight
function calculateFittingWeight(
  fittingType: string,
  material: string,
  dimensions: any,
  size: number
): number {
  // Material densities (kg/m³)
  const materialDensities: Record<string, number> = {
    'Carbon Steel': 7850,
    'Stainless Steel 304': 8000,
    'Stainless Steel 316': 8000,
    'PVC': 1400,
    'Brass': 8500,
    'Bronze': 8800
  };

  const density = materialDensities[material] || 7850;

  // Approximate volume calculation (very simplified)
  const volume = (dimensions.length || 50) * (dimensions.width || 50) * (dimensions.height || 50) / 1000000000; // m³

  // Apply fitting-specific factors
  let volumeFactor = 0.3; // Default hollow factor

  switch (fittingType) {
    case 'elbow':
      volumeFactor = 0.4;
      break;
    case 'tee':
      volumeFactor = 0.5;
      break;
    case 'reducer':
      volumeFactor = 0.3;
      break;
    case 'flange':
      volumeFactor = 0.6;
      break;
  }

  return Math.round(volume * density * volumeFactor * 100) / 100;
}

FittingNode.displayName = 'FittingNode';

export default FittingNode;