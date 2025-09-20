'use client';

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from '../base/BaseNode';
import { PIDNodeData, NodeVisualState } from '@/types/nodes';

interface FinalControlProperties extends PIDNodeData {
  properties: {
    type: string;
    elementType: 'control-valve' | 'vfd' | 'damper' | 'actuator';
    controlSignal: '4-20mA' | 'pneumatic' | 'digital' | 'relay';
    size?: number;
    sizeUnit?: string;
    cvValue?: number;
    rangeability?: number;
    bodyMaterial?: string;
    trimMaterial?: string;
    seatMaterial?: string;
    actuatorType?: 'pneumatic' | 'electric' | 'hydraulic';
    actuatorAction?: 'air-to-open' | 'air-to-close' | 'spring-return';
    failSafe?: 'open' | 'closed' | 'last-position';
    positioner?: boolean;
    positionerType?: 'pneumatic' | 'electro-pneumatic' | 'digital';
    strokeTime?: number;
    characterization?: 'linear' | 'equal-percentage' | 'quick-opening';
    leakageClass?: string;
    operatingPressure?: number;
    operatingTemperature?: number;
    pressureUnit?: string;
    temperatureUnit?: string;
    powerRating?: number; // For VFDs
    frequency?: number;    // For VFDs
    voltageRating?: string; // For VFDs
    motorProtection?: boolean;
    [key: string]: any;
  };
}

interface FinalControlNodeProps extends NodeProps<FinalControlProperties> {
  onPropertyChange?: (nodeId: string, properties: Record<string, any>) => void;
  onValidationChange?: (nodeId: string, isValid: boolean, errors: string[]) => void;
  onStateChange?: (nodeId: string, state: NodeVisualState) => void;
}

export const FinalControlNode: React.FC<FinalControlNodeProps> = memo((props) => {
  const { data, id } = props;

  // Final control element specific validation
  const validateFinalControlData = (controlData: FinalControlProperties): string[] => {
    const errors: string[] = [];

    // Element type validation
    const validElementTypes = ['control-valve', 'vfd', 'damper', 'actuator'];
    if (!validElementTypes.includes(controlData.properties.elementType)) {
      errors.push('Invalid final control element type');
    }

    // Control signal validation
    const validControlSignals = ['4-20mA', 'pneumatic', 'digital', 'relay'];
    if (!validControlSignals.includes(controlData.properties.controlSignal)) {
      errors.push('Invalid control signal type');
    }

    // Control valve specific validations
    if (controlData.properties.elementType === 'control-valve') {
      // Size validation
      if (!controlData.properties.size || controlData.properties.size <= 0) {
        errors.push('Control valve size must be greater than 0');
      }

      // CV value validation
      if (!controlData.properties.cvValue || controlData.properties.cvValue <= 0) {
        errors.push('CV value must be greater than 0 for control valves');
      }

      // Rangeability validation
      if (!controlData.properties.rangeability ||
          controlData.properties.rangeability < 10 ||
          controlData.properties.rangeability > 100) {
        errors.push('Control valve rangeability should be between 10:1 and 100:1');
      }

      // Material validation
      if (!controlData.properties.bodyMaterial?.trim()) {
        errors.push('Body material must be specified for control valves');
      }

      if (!controlData.properties.trimMaterial?.trim()) {
        errors.push('Trim material must be specified for control valves');
      }

      // Actuator validation
      const validActuatorTypes = ['pneumatic', 'electric', 'hydraulic'];
      if (!validActuatorTypes.includes(controlData.properties.actuatorType)) {
        errors.push('Invalid actuator type for control valve');
      }

      // Actuator action validation
      const validActuatorActions = ['air-to-open', 'air-to-close', 'spring-return'];
      if (controlData.properties.actuatorType === 'pneumatic' &&
          !validActuatorActions.includes(controlData.properties.actuatorAction)) {
        errors.push('Invalid actuator action for pneumatic actuator');
      }

      // Fail-safe validation
      const validFailSafe = ['open', 'closed', 'last-position'];
      if (!validFailSafe.includes(controlData.properties.failSafe)) {
        errors.push('Invalid fail-safe position');
      }

      // Stroke time validation
      if (controlData.properties.strokeTime &&
          (controlData.properties.strokeTime <= 0 || controlData.properties.strokeTime > 300)) {
        errors.push('Stroke time should be between 0 and 300 seconds');
      }

      // Characterization validation
      const validCharacterizations = ['linear', 'equal-percentage', 'quick-opening'];
      if (controlData.properties.characterization &&
          !validCharacterizations.includes(controlData.properties.characterization)) {
        errors.push('Invalid valve characterization');
      }

      // Operating conditions validation
      if (controlData.properties.operatingPressure && controlData.properties.operatingPressure < 0) {
        errors.push('Operating pressure cannot be negative');
      }

      if (controlData.properties.operatingTemperature === undefined) {
        errors.push('Operating temperature must be specified');
      }
    }

    // VFD specific validations
    if (controlData.properties.elementType === 'vfd') {
      // Power rating validation
      if (!controlData.properties.powerRating || controlData.properties.powerRating <= 0) {
        errors.push('Power rating must be greater than 0 for VFDs');
      }

      // Frequency validation
      if (!controlData.properties.frequency ||
          (controlData.properties.frequency !== 50 && controlData.properties.frequency !== 60)) {
        errors.push('Frequency must be 50 or 60 Hz');
      }

      // Voltage validation
      if (!controlData.properties.voltageRating?.trim()) {
        errors.push('Voltage rating must be specified for VFDs');
      }

      const validVoltages = ['230V', '400V', '480V', '690V'];
      if (controlData.properties.voltageRating &&
          !validVoltages.some(v => controlData.properties.voltageRating.includes(v))) {
        errors.push('Invalid voltage rating for VFD');
      }

      // Control signal validation for VFDs
      if (controlData.properties.controlSignal === 'pneumatic') {
        errors.push('VFDs cannot use pneumatic control signals');
      }
    }

    // Damper specific validations
    if (controlData.properties.elementType === 'damper') {
      if (!controlData.properties.size || controlData.properties.size <= 0) {
        errors.push('Damper size must be greater than 0');
      }

      if (controlData.properties.actuatorType === 'hydraulic') {
        errors.push('Hydraulic actuators are not typically used for dampers');
      }
    }

    // Positioner validations
    if (controlData.properties.positioner) {
      const validPositionerTypes = ['pneumatic', 'electro-pneumatic', 'digital'];
      if (!validPositionerTypes.includes(controlData.properties.positionerType)) {
        errors.push('Invalid positioner type');
      }

      // Digital positioners require digital or 4-20mA signals
      if (controlData.properties.positionerType === 'digital' &&
          controlData.properties.controlSignal === 'pneumatic') {
        errors.push('Digital positioners require electronic control signals');
      }
    }

    return errors;
  };

  // Enhanced validation callback
  const handleValidationChange = (nodeId: string, isValid: boolean, errors: string[]) => {
    const controlErrors = validateFinalControlData(data);
    const allErrors = [...errors, ...controlErrors];
    const finalIsValid = allErrors.length === 0;

    props.onValidationChange?.(nodeId, finalIsValid, allErrors);
  };

  // Enhanced property change callback
  const handlePropertyChange = (nodeId: string, properties: Record<string, any>) => {
    const updatedProperties = { ...properties };

    // Set default control signal based on element type
    if (properties.elementType && !properties.controlSignal) {
      switch (properties.elementType) {
        case 'control-valve':
          updatedProperties.controlSignal = 'pneumatic';
          break;
        case 'vfd':
          updatedProperties.controlSignal = '4-20mA';
          break;
        case 'damper':
          updatedProperties.controlSignal = 'pneumatic';
          break;
        case 'actuator':
          updatedProperties.controlSignal = '4-20mA';
          break;
      }
    }

    // Control valve specific defaults
    if (properties.elementType === 'control-valve') {
      // Set default rangeability
      if (!properties.rangeability) {
        updatedProperties.rangeability = 50; // 50:1 typical for modern control valves
      }

      // Set default CV value based on size
      if (properties.size && !properties.cvValue) {
        // Approximate CV calculation: CV ≈ Size² × K factor
        const kFactor = 25; // Typical for globe valves
        updatedProperties.cvValue = Math.round(properties.size * properties.size * kFactor);
      }

      // Set default materials
      if (!properties.bodyMaterial) {
        if (properties.operatingTemperature && properties.operatingTemperature > 200) {
          updatedProperties.bodyMaterial = 'Stainless Steel 316';
        } else {
          updatedProperties.bodyMaterial = 'Carbon Steel';
        }
      }

      if (!properties.trimMaterial) {
        if (properties.operatingPressure && properties.operatingPressure > 40) {
          updatedProperties.trimMaterial = 'Stellite';
        } else {
          updatedProperties.trimMaterial = 'Stainless Steel 316';
        }
      }

      if (!properties.seatMaterial) {
        updatedProperties.seatMaterial = 'PTFE';
      }

      // Set default actuator type based on size and signal
      if (!properties.actuatorType) {
        if (properties.size && properties.size > 8) {
          updatedProperties.actuatorType = 'pneumatic';
        } else if (properties.controlSignal === 'digital') {
          updatedProperties.actuatorType = 'electric';
        } else {
          updatedProperties.actuatorType = 'pneumatic';
        }
      }

      // Set default actuator action for pneumatic actuators
      if (properties.actuatorType === 'pneumatic' && !properties.actuatorAction) {
        updatedProperties.actuatorAction = 'air-to-open';
      }

      // Set default fail-safe position
      if (!properties.failSafe) {
        // Typically fail-closed for process control
        updatedProperties.failSafe = 'closed';
      }

      // Set default characterization
      if (!properties.characterization) {
        updatedProperties.characterization = 'equal-percentage';
      }

      // Set default leakage class
      if (!properties.leakageClass) {
        if (properties.seatMaterial === 'Metal') {
          updatedProperties.leakageClass = 'Class IV';
        } else {
          updatedProperties.leakageClass = 'Class V';
        }
      }

      // Set default stroke time based on size and actuator type
      if (!properties.strokeTime) {
        if (properties.actuatorType === 'electric') {
          updatedProperties.strokeTime = properties.size > 4 ? 60 : 30;
        } else {
          updatedProperties.strokeTime = properties.size > 4 ? 15 : 10;
        }
      }

      // Enable positioner for control valves > 2"
      if (properties.positioner === undefined) {
        updatedProperties.positioner = (properties.size || 0) > 2;
      }

      // Set positioner type based on control signal
      if (properties.positioner && !properties.positionerType) {
        if (properties.controlSignal === 'digital') {
          updatedProperties.positionerType = 'digital';
        } else if (properties.controlSignal === '4-20mA') {
          updatedProperties.positionerType = 'electro-pneumatic';
        } else {
          updatedProperties.positionerType = 'pneumatic';
        }
      }
    }

    // VFD specific defaults
    if (properties.elementType === 'vfd') {
      // Set default frequency
      if (!properties.frequency) {
        updatedProperties.frequency = 50; // Default to 50 Hz (can be region-specific)
      }

      // Set default voltage based on power rating
      if (properties.powerRating && !properties.voltageRating) {
        if (properties.powerRating < 5) {
          updatedProperties.voltageRating = '230V 3-phase';
        } else if (properties.powerRating < 100) {
          updatedProperties.voltageRating = '400V 3-phase';
        } else {
          updatedProperties.voltageRating = '690V 3-phase';
        }
      }

      // Enable motor protection by default
      if (properties.motorProtection === undefined) {
        updatedProperties.motorProtection = true;
      }

      // Set default communication protocol for digital control
      if (properties.controlSignal === 'digital' && !properties.communicationProtocol) {
        updatedProperties.communicationProtocol = 'Modbus RTU';
      }

      // Set default protection class
      if (!properties.protectionClass) {
        updatedProperties.protectionClass = 'IP54';
      }
    }

    // Damper specific defaults
    if (properties.elementType === 'damper') {
      // Set default materials for dampers
      if (!properties.bodyMaterial) {
        updatedProperties.bodyMaterial = 'Galvanized Steel';
      }

      if (!properties.bladeMaterial) {
        updatedProperties.bladeMaterial = 'Aluminum';
      }

      // Set default seal material
      if (!properties.sealMaterial) {
        updatedProperties.sealMaterial = 'EPDM';
      }

      // Set default actuator type for dampers
      if (!properties.actuatorType) {
        if (properties.size && properties.size > 1000) { // Large dampers
          updatedProperties.actuatorType = 'electric';
        } else {
          updatedProperties.actuatorType = 'pneumatic';
        }
      }

      // Set default stroke time for dampers
      if (!properties.strokeTime) {
        updatedProperties.strokeTime = properties.actuatorType === 'electric' ? 90 : 30;
      }

      // Set default fail-safe for dampers
      if (!properties.failSafe) {
        updatedProperties.failSafe = 'closed'; // Typically fail-closed for safety
      }
    }

    // Set default operating conditions if not specified
    if (!properties.operatingPressure) {
      switch (properties.elementType) {
        case 'control-valve':
          updatedProperties.operatingPressure = 16; // bar
          break;
        case 'damper':
          updatedProperties.operatingPressure = 0.1; // bar (low pressure air)
          break;
      }
    }

    if (properties.operatingTemperature === undefined) {
      updatedProperties.operatingTemperature = 50; // °C - typical process temperature
    }

    // Set default units
    if (!properties.pressureUnit) {
      updatedProperties.pressureUnit = 'bar';
    }

    if (!properties.temperatureUnit) {
      updatedProperties.temperatureUnit = '°C';
    }

    if (!properties.sizeUnit && properties.elementType !== 'vfd') {
      if (properties.elementType === 'damper') {
        updatedProperties.sizeUnit = 'mm';
      } else {
        updatedProperties.sizeUnit = 'inch';
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

FinalControlNode.displayName = 'FinalControlNode';

export default FinalControlNode;