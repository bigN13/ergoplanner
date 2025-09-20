'use client';

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from '../base/BaseNode';
import { ValveProperties, NodeVisualState } from '@/types/nodes';

interface ValveNodeProps extends NodeProps<ValveProperties> {
  onPropertyChange?: (nodeId: string, properties: Record<string, any>) => void;
  onValidationChange?: (nodeId: string, isValid: boolean, errors: string[]) => void;
  onStateChange?: (nodeId: string, state: NodeVisualState) => void;
}

export const ValveNode: React.FC<ValveNodeProps> = memo((props) => {
  const { data, id } = props;

  // Valve-specific validation
  const validateValveData = (valveData: ValveProperties): string[] => {
    const errors: string[] = [];

    // Size validation
    if (!valveData.properties.size || valveData.properties.size <= 0) {
      errors.push('Valve size must be greater than 0');
    }

    // Pressure rating validation
    if (!valveData.properties.pressureRating || valveData.properties.pressureRating <= 0) {
      errors.push('Pressure rating must be greater than 0');
    }

    // Material validation
    if (!valveData.properties.bodyMaterial?.trim()) {
      errors.push('Body material must be specified');
    }

    if (!valveData.properties.seatMaterial?.trim()) {
      errors.push('Seat material must be specified');
    }

    // Operation type validation
    const validOperations = ['manual', 'electric', 'pneumatic', 'hydraulic'];
    if (!validOperations.includes(valveData.properties.operation)) {
      errors.push('Invalid operation type');
    }

    // Position validation
    const validPositions = ['open', 'closed', 'partial'];
    if (!validPositions.includes(valveData.properties.position)) {
      errors.push('Invalid valve position');
    }

    // CV value validation for control valves
    if (valveData.properties.type === 'control' && (!valveData.properties.cvValue || valveData.properties.cvValue <= 0)) {
      errors.push('CV value must be greater than 0 for control valves');
    }

    // Fail-safe validation for automated valves
    if (['electric', 'pneumatic', 'hydraulic'].includes(valveData.properties.operation)) {
      const validFailSafe = ['open', 'closed', 'last-position'];
      if (!valveData.properties.failSafe || !validFailSafe.includes(valveData.properties.failSafe)) {
        errors.push('Fail-safe position must be specified for automated valves');
      }
    }

    // Actuator type validation for automated valves
    if (['electric', 'pneumatic', 'hydraulic'].includes(valveData.properties.operation) && !valveData.properties.actuatorType?.trim()) {
      errors.push('Actuator type must be specified for automated valves');
    }

    return errors;
  };

  // Enhanced validation callback
  const handleValidationChange = (nodeId: string, isValid: boolean, errors: string[]) => {
    const valveErrors = validateValveData(data);
    const allErrors = [...errors, ...valveErrors];
    const finalIsValid = allErrors.length === 0;

    props.onValidationChange?.(nodeId, finalIsValid, allErrors);
  };

  // Enhanced property change callback
  const handlePropertyChange = (nodeId: string, properties: Record<string, any>) => {
    const updatedProperties = { ...properties };

    // Auto-set default CV value based on valve size and type
    if (properties.size && properties.type === 'control' && !properties.cvValue) {
      // Approximate CV calculation based on size
      const size = properties.size;
      if (size <= 2) {
        updatedProperties.cvValue = size * size * 10;
      } else if (size <= 6) {
        updatedProperties.cvValue = size * size * 15;
      } else {
        updatedProperties.cvValue = size * size * 20;
      }
    }

    // Set default leakage class based on valve type
    if (properties.type && !properties.leakageClass) {
      switch (properties.type) {
        case 'ball':
          updatedProperties.leakageClass = 'Class IV';
          break;
        case 'gate':
          updatedProperties.leakageClass = 'Class II';
          break;
        case 'butterfly':
          updatedProperties.leakageClass = 'Class IV';
          break;
        case 'control':
          updatedProperties.leakageClass = 'Class V';
          break;
        default:
          updatedProperties.leakageClass = 'Class II';
      }
    }

    // Auto-suggest actuator type based on valve type and size
    if (properties.operation === 'pneumatic' && properties.size && !properties.actuatorType) {
      if (properties.size <= 4) {
        updatedProperties.actuatorType = 'Spring-Return Diaphragm';
      } else if (properties.size <= 8) {
        updatedProperties.actuatorType = 'Double-Acting Piston';
      } else {
        updatedProperties.actuatorType = 'Scotch-Yoke';
      }
    }

    // Set default fail-safe based on valve type
    if (['electric', 'pneumatic', 'hydraulic'].includes(properties.operation) && !properties.failSafe) {
      if (properties.type === 'control') {
        updatedProperties.failSafe = 'closed'; // Typically fail-closed for control valves
      } else {
        updatedProperties.failSafe = 'last-position';
      }
    }

    // Calculate flow coefficient for control valves
    if (properties.type === 'control' && properties.cvValue && properties.size) {
      const flowCoefficient = properties.cvValue / (properties.size * properties.size);
      updatedProperties.flowCoefficient = Math.round(flowCoefficient * 100) / 100;
    }

    props.onPropertyChange?.(nodeId, updatedProperties);
  };

  // Enhanced state change callback to reflect valve position
  const handleStateChange = (nodeId: string, state: NodeVisualState) => {
    // Update visual state based on valve position and operation
    let newState = state;

    if (data.properties.position === 'closed' && state === NodeVisualState.NORMAL) {
      newState = NodeVisualState.OFFLINE;
    }

    props.onStateChange?.(nodeId, newState);
  };

  return (
    <BaseNode
      {...props}
      onValidationChange={handleValidationChange}
      onPropertyChange={handlePropertyChange}
      onStateChange={handleStateChange}
    />
  );
});

ValveNode.displayName = 'ValveNode';

export default ValveNode;