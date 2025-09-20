'use client';

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from '../base/BaseNode';
import { InstrumentProperties, NodeVisualState } from '@/types/nodes';

interface ControllerProperties extends InstrumentProperties {
  properties: InstrumentProperties['properties'] & {
    controllerType: 'pid' | 'on-off' | 'cascade' | 'feedforward' | 'ratio' | 'split-range';
    setpoint: number;
    setpointUnit: string;
    outputType: '4-20mA' | 'pneumatic' | 'digital' | 'relay';
    controlAction: 'direct' | 'reverse';
    tuningParameters?: {
      proportionalGain?: number;
      integralTime?: number;
      derivativeTime?: number;
      proportionalBand?: number;
    };
    alarmLimits?: {
      highAlarm?: number;
      lowAlarm?: number;
      highHighAlarm?: number;
      lowLowAlarm?: number;
    };
    autoManualStation?: boolean;
    cascadeConfiguration?: {
      primaryLoop?: string;
      secondaryLoop?: string;
      cascadeRatio?: number;
    };
    splitRangeConfiguration?: {
      valve1Range?: { min: number; max: number };
      valve2Range?: { min: number; max: number };
      overlap?: number;
    };
    [key: string]: any;
  };
}

interface ControllerNodeProps extends NodeProps<ControllerProperties> {
  onPropertyChange?: (nodeId: string, properties: Record<string, any>) => void;
  onValidationChange?: (nodeId: string, isValid: boolean, errors: string[]) => void;
  onStateChange?: (nodeId: string, state: NodeVisualState) => void;
}

export const ControllerNode: React.FC<ControllerNodeProps> = memo((props) => {
  const { data, id } = props;

  // Controller-specific validation
  const validateControllerData = (controllerData: ControllerProperties): string[] => {
    const errors: string[] = [];

    // Type validation
    if (controllerData.properties.type !== 'controller') {
      errors.push('Node type must be controller');
    }

    // Controller type validation
    const validControllerTypes = ['pid', 'on-off', 'cascade', 'feedforward', 'ratio', 'split-range'];
    if (!validControllerTypes.includes(controllerData.properties.controllerType)) {
      errors.push('Invalid controller type');
    }

    // Measurement type validation
    const validMeasurementTypes = ['pressure', 'temperature', 'flow', 'level', 'ph', 'conductivity'];
    if (!validMeasurementTypes.includes(controllerData.properties.measurementType)) {
      errors.push('Invalid measurement type for controller');
    }

    // Range validation
    if (!controllerData.properties.range ||
        typeof controllerData.properties.range.min !== 'number' ||
        typeof controllerData.properties.range.max !== 'number') {
      errors.push('Controller range must be specified with numeric min and max values');
    }

    if (controllerData.properties.range &&
        controllerData.properties.range.min >= controllerData.properties.range.max) {
      errors.push('Range minimum must be less than maximum');
    }

    // Setpoint validation
    if (typeof controllerData.properties.setpoint !== 'number') {
      errors.push('Setpoint must be specified');
    }

    if (controllerData.properties.setpoint && controllerData.properties.range) {
      if (controllerData.properties.setpoint < controllerData.properties.range.min ||
          controllerData.properties.setpoint > controllerData.properties.range.max) {
        errors.push('Setpoint must be within the controller range');
      }
    }

    if (!controllerData.properties.setpointUnit?.trim()) {
      errors.push('Setpoint unit must be specified');
    }

    // Output type validation
    const validOutputTypes = ['4-20mA', 'pneumatic', 'digital', 'relay'];
    if (!validOutputTypes.includes(controllerData.properties.outputType)) {
      errors.push('Invalid controller output type');
    }

    // Control action validation
    const validControlActions = ['direct', 'reverse'];
    if (!validControlActions.includes(controllerData.properties.controlAction)) {
      errors.push('Control action must be direct or reverse');
    }

    // PID controller specific validations
    if (controllerData.properties.controllerType === 'pid') {
      const tuning = controllerData.properties.tuningParameters;
      if (!tuning) {
        errors.push('PID tuning parameters must be specified');
      } else {
        if (typeof tuning.proportionalGain !== 'number' || tuning.proportionalGain <= 0) {
          errors.push('Proportional gain must be greater than 0');
        }

        if (typeof tuning.integralTime !== 'number' || tuning.integralTime <= 0) {
          errors.push('Integral time must be greater than 0');
        }

        if (tuning.derivativeTime !== undefined &&
            (typeof tuning.derivativeTime !== 'number' || tuning.derivativeTime < 0)) {
          errors.push('Derivative time must be non-negative');
        }

        if (tuning.proportionalBand !== undefined) {
          if (typeof tuning.proportionalBand !== 'number' ||
              tuning.proportionalBand <= 0 || tuning.proportionalBand > 1000) {
            errors.push('Proportional band must be between 0 and 1000%');
          }
        }
      }
    }

    // Cascade controller specific validations
    if (controllerData.properties.controllerType === 'cascade') {
      const cascade = controllerData.properties.cascadeConfiguration;
      if (!cascade) {
        errors.push('Cascade configuration must be specified');
      } else {
        if (!cascade.primaryLoop?.trim()) {
          errors.push('Primary loop must be specified for cascade controller');
        }

        if (!cascade.secondaryLoop?.trim()) {
          errors.push('Secondary loop must be specified for cascade controller');
        }

        if (cascade.cascadeRatio !== undefined &&
            (typeof cascade.cascadeRatio !== 'number' || cascade.cascadeRatio <= 0)) {
          errors.push('Cascade ratio must be greater than 0');
        }
      }
    }

    // Split-range controller specific validations
    if (controllerData.properties.controllerType === 'split-range') {
      const splitRange = controllerData.properties.splitRangeConfiguration;
      if (!splitRange) {
        errors.push('Split-range configuration must be specified');
      } else {
        if (!splitRange.valve1Range || !splitRange.valve2Range) {
          errors.push('Both valve ranges must be specified for split-range controller');
        }

        if (splitRange.valve1Range && splitRange.valve2Range) {
          if (splitRange.valve1Range.min >= splitRange.valve1Range.max ||
              splitRange.valve2Range.min >= splitRange.valve2Range.max) {
            errors.push('Valve ranges must have min < max');
          }

          if (splitRange.overlap !== undefined &&
              (splitRange.overlap < 0 || splitRange.overlap > 50)) {
            errors.push('Valve overlap should be between 0 and 50%');
          }
        }
      }
    }

    // Alarm limits validation
    if (controllerData.properties.alarmLimits) {
      const alarms = controllerData.properties.alarmLimits;
      const range = controllerData.properties.range;

      if (alarms.lowLowAlarm !== undefined && range) {
        if (alarms.lowLowAlarm < range.min || alarms.lowLowAlarm > range.max) {
          errors.push('Low-low alarm must be within controller range');
        }
      }

      if (alarms.lowAlarm !== undefined && range) {
        if (alarms.lowAlarm < range.min || alarms.lowAlarm > range.max) {
          errors.push('Low alarm must be within controller range');
        }
      }

      if (alarms.highAlarm !== undefined && range) {
        if (alarms.highAlarm < range.min || alarms.highAlarm > range.max) {
          errors.push('High alarm must be within controller range');
        }
      }

      if (alarms.highHighAlarm !== undefined && range) {
        if (alarms.highHighAlarm < range.min || alarms.highHighAlarm > range.max) {
          errors.push('High-high alarm must be within controller range');
        }
      }

      // Alarm sequence validation
      if (alarms.lowLowAlarm !== undefined && alarms.lowAlarm !== undefined &&
          alarms.lowLowAlarm >= alarms.lowAlarm) {
        errors.push('Low-low alarm must be less than low alarm');
      }

      if (alarms.lowAlarm !== undefined && alarms.highAlarm !== undefined &&
          alarms.lowAlarm >= alarms.highAlarm) {
        errors.push('Low alarm must be less than high alarm');
      }

      if (alarms.highAlarm !== undefined && alarms.highHighAlarm !== undefined &&
          alarms.highAlarm >= alarms.highHighAlarm) {
        errors.push('High alarm must be less than high-high alarm');
      }
    }

    // Power supply validation
    if (!controllerData.properties.powerSupply?.trim()) {
      errors.push('Power supply specification is required');
    }

    // Housing validation
    const validHousing = ['field', 'panel', 'remote'];
    if (!validHousing.includes(controllerData.properties.housing)) {
      errors.push('Invalid housing type');
    }

    return errors;
  };

  // Enhanced validation callback
  const handleValidationChange = (nodeId: string, isValid: boolean, errors: string[]) => {
    const controllerErrors = validateControllerData(data);
    const allErrors = [...errors, ...controllerErrors];
    const finalIsValid = allErrors.length === 0;

    props.onValidationChange?.(nodeId, finalIsValid, allErrors);
  };

  // Enhanced property change callback
  const handlePropertyChange = (nodeId: string, properties: Record<string, any>) => {
    const updatedProperties = { ...properties };

    // Auto-set controller type
    if (!properties.type) {
      updatedProperties.type = 'controller';
    }

    // Set default controller type based on measurement type
    if (properties.measurementType && !properties.controllerType) {
      const controllerTypeMap: Record<string, string> = {
        'temperature': 'pid',
        'pressure': 'pid',
        'flow': 'pid',
        'level': 'pid',
        'ph': 'on-off',
        'conductivity': 'on-off'
      };

      updatedProperties.controllerType = controllerTypeMap[properties.measurementType] || 'pid';
    }

    // Set default setpoint (middle of range)
    if (properties.range && typeof properties.setpoint !== 'number') {
      const midpoint = (properties.range.min + properties.range.max) / 2;
      updatedProperties.setpoint = Math.round(midpoint * 100) / 100;
    }

    // Set setpoint unit same as range unit
    if (properties.rangeUnit && !properties.setpointUnit) {
      updatedProperties.setpointUnit = properties.rangeUnit;
    }

    // Set default output type based on measurement type and application
    if (properties.measurementType && !properties.outputType) {
      if (properties.measurementType === 'pressure' && properties.range?.max > 20) {
        updatedProperties.outputType = 'pneumatic';
      } else if (properties.housing === 'panel') {
        updatedProperties.outputType = '4-20mA';
      } else {
        updatedProperties.outputType = '4-20mA';
      }
    }

    // Set default control action based on measurement type
    if (properties.measurementType && !properties.controlAction) {
      const controlActionMap: Record<string, string> = {
        'temperature': 'direct', // Increase output to increase temperature
        'pressure': 'reverse',   // Decrease output to increase pressure (vent valve)
        'flow': 'direct',        // Increase output to increase flow
        'level': 'reverse',      // Decrease output to increase level (close outlet)
        'ph': 'direct',          // Increase output to increase pH
        'conductivity': 'direct' // Increase output to increase conductivity
      };

      updatedProperties.controlAction = controlActionMap[properties.measurementType] || 'direct';
    }

    // Set default PID tuning parameters
    if (properties.controllerType === 'pid' && !properties.tuningParameters) {
      const defaultTuning = getDefaultPIDTuning(properties.measurementType, properties.range);
      updatedProperties.tuningParameters = defaultTuning;
    }

    // Set default alarm limits
    if (properties.range && !properties.alarmLimits) {
      const range = properties.range;
      const span = range.max - range.min;

      updatedProperties.alarmLimits = {
        lowLowAlarm: range.min + span * 0.05,
        lowAlarm: range.min + span * 0.15,
        highAlarm: range.max - span * 0.15,
        highHighAlarm: range.max - span * 0.05
      };

      // Round to reasonable precision
      Object.keys(updatedProperties.alarmLimits).forEach(key => {
        updatedProperties.alarmLimits[key] = Math.round(updatedProperties.alarmLimits[key] * 100) / 100;
      });
    }

    // Set default power supply based on output type and housing
    if (properties.outputType && properties.housing && !properties.powerSupply) {
      if (properties.housing === 'panel') {
        updatedProperties.powerSupply = '120V AC';
      } else if (properties.outputType === 'pneumatic') {
        updatedProperties.powerSupply = '24V DC + Instrument Air (20 psi)';
      } else {
        updatedProperties.powerSupply = '24V DC';
      }
    }

    // Enable auto/manual station for critical loops
    if (properties.autoManualStation === undefined) {
      const criticalMeasurements = ['temperature', 'pressure', 'level'];
      updatedProperties.autoManualStation = criticalMeasurements.includes(properties.measurementType);
    }

    // Set default accuracy based on controller type
    if (properties.controllerType && !properties.accuracy) {
      const accuracyMap: Record<string, number> = {
        'pid': 0.1,
        'on-off': 1.0,
        'cascade': 0.05,
        'feedforward': 0.2,
        'ratio': 0.2,
        'split-range': 0.15
      };

      updatedProperties.accuracy = accuracyMap[properties.controllerType] || 0.5;
    }

    // Set process connection based on measurement type
    if (properties.measurementType && !properties.processConnection) {
      const connectionMap: Record<string, string> = {
        'temperature': '1/2" NPT with thermowell',
        'pressure': '1/2" NPT',
        'flow': 'Flanged connection',
        'level': '3/4" NPT',
        'ph': '3/4" NPT',
        'conductivity': '1" NPT'
      };

      updatedProperties.processConnection = connectionMap[properties.measurementType] || '1/2" NPT';
    }

    // Set default certification
    if (!properties.certification) {
      updatedProperties.certification = ['CE', 'UL'];

      if (properties.housing === 'field') {
        updatedProperties.certification.push('IP65');
      }

      if (properties.measurementType === 'temperature' && properties.range?.max > 200) {
        updatedProperties.certification.push('ATEX');
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

// Helper function to get default PID tuning parameters
function getDefaultPIDTuning(measurementType: string, range?: { min: number; max: number }) {
  const span = range ? range.max - range.min : 100;

  const tuningMap: Record<string, any> = {
    'temperature': {
      proportionalGain: 2.0,
      integralTime: 300, // seconds
      derivativeTime: 60,
      proportionalBand: 50 // %
    },
    'pressure': {
      proportionalGain: 1.5,
      integralTime: 120,
      derivativeTime: 30,
      proportionalBand: 67
    },
    'flow': {
      proportionalGain: 0.8,
      integralTime: 60,
      derivativeTime: 0, // No derivative for flow
      proportionalBand: 125
    },
    'level': {
      proportionalGain: 1.0,
      integralTime: 180,
      derivativeTime: 45,
      proportionalBand: 100
    }
  };

  const defaultTuning = tuningMap[measurementType] || tuningMap['temperature'];

  // Adjust proportional band based on span
  if (span > 0) {
    defaultTuning.proportionalBand = Math.round((span / defaultTuning.proportionalGain) * 100) / 100;
  }

  return defaultTuning;
}

ControllerNode.displayName = 'ControllerNode';

export default ControllerNode;