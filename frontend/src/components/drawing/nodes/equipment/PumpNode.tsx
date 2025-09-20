'use client';

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from '../base/BaseNode';
import { PumpProperties, NodeVisualState } from '@/types/nodes';

interface PumpNodeProps extends NodeProps<PumpProperties> {
  onPropertyChange?: (nodeId: string, properties: Record<string, any>) => void;
  onValidationChange?: (nodeId: string, isValid: boolean, errors: string[]) => void;
  onStateChange?: (nodeId: string, state: NodeVisualState) => void;
}

export const PumpNode: React.FC<PumpNodeProps> = memo((props) => {
  const { data, id } = props;

  // Pump-specific validation
  const validatePumpData = (pumpData: PumpProperties): string[] => {
    const errors: string[] = [];

    // Capacity validation
    if (!pumpData.properties.capacity || pumpData.properties.capacity <= 0) {
      errors.push('Pump capacity must be greater than 0');
    }

    // Head validation
    if (!pumpData.properties.head || pumpData.properties.head <= 0) {
      errors.push('Pump head must be greater than 0');
    }

    // Efficiency validation
    if (pumpData.properties.efficiency && (pumpData.properties.efficiency <= 0 || pumpData.properties.efficiency > 100)) {
      errors.push('Pump efficiency must be between 0 and 100%');
    }

    // Power rating validation
    if (!pumpData.properties.powerRating || pumpData.properties.powerRating <= 0) {
      errors.push('Power rating must be greater than 0');
    }

    // Speed validation for centrifugal pumps
    if (pumpData.properties.type === 'centrifugal' && (!pumpData.properties.speed || pumpData.properties.speed <= 0)) {
      errors.push('Pump speed must be greater than 0 for centrifugal pumps');
    }

    // Size validation
    if (!pumpData.properties.suctionSize || pumpData.properties.suctionSize <= 0) {
      errors.push('Suction size must be greater than 0');
    }

    if (!pumpData.properties.dischargeSize || pumpData.properties.dischargeSize <= 0) {
      errors.push('Discharge size must be greater than 0');
    }

    // Material validation
    if (!pumpData.properties.material?.trim()) {
      errors.push('Pump material must be specified');
    }

    return errors;
  };

  // Enhanced validation callback
  const handleValidationChange = (nodeId: string, isValid: boolean, errors: string[]) => {
    const pumpErrors = validatePumpData(data);
    const allErrors = [...errors, ...pumpErrors];
    const finalIsValid = allErrors.length === 0;

    props.onValidationChange?.(nodeId, finalIsValid, allErrors);
  };

  // Enhanced property change callback
  const handlePropertyChange = (nodeId: string, properties: Record<string, any>) => {
    // Automatic calculations for pump properties
    const updatedProperties = { ...properties };

    // Calculate hydraulic power if capacity and head are available
    if (properties.capacity && properties.head && properties.density) {
      const hydraulicPower = (properties.capacity * properties.head * properties.density * 9.81) / 1000; // kW
      updatedProperties.hydraulicPower = Math.round(hydraulicPower * 100) / 100;
    }

    // Calculate shaft power if hydraulic power and efficiency are available
    if (updatedProperties.hydraulicPower && properties.efficiency) {
      const shaftPower = updatedProperties.hydraulicPower / (properties.efficiency / 100);
      updatedProperties.shaftPower = Math.round(shaftPower * 100) / 100;
    }

    // Set recommended NPSH for centrifugal pumps
    if (properties.type === 'centrifugal' && properties.capacity) {
      if (properties.capacity < 100) {
        updatedProperties.requiredNPSH = 3; // meters
      } else if (properties.capacity < 500) {
        updatedProperties.requiredNPSH = 5;
      } else {
        updatedProperties.requiredNPSH = 8;
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

PumpNode.displayName = 'PumpNode';

export default PumpNode;