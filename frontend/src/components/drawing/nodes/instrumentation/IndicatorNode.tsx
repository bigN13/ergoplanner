'use client';

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from '../base/BaseNode';
import { InstrumentProperties, NodeVisualState } from '@/types/nodes';

interface IndicatorNodeProps extends NodeProps<InstrumentProperties> {
  onPropertyChange?: (nodeId: string, properties: Record<string, any>) => void;
  onValidationChange?: (nodeId: string, isValid: boolean, errors: string[]) => void;
  onStateChange?: (nodeId: string, state: NodeVisualState) => void;
}

export const IndicatorNode: React.FC<IndicatorNodeProps> = memo((props) => {
  const { data, id } = props;

  // Indicator-specific validation
  const validateIndicatorData = (indicatorData: InstrumentProperties): string[] => {
    const errors: string[] = [];

    // Type validation
    if (indicatorData.properties.type !== 'indicator') {
      errors.push('Node type must be indicator');
    }

    // Measurement type validation
    const validMeasurementTypes = ['pressure', 'temperature', 'flow', 'level', 'ph', 'conductivity'];
    if (!validMeasurementTypes.includes(indicatorData.properties.measurementType)) {
      errors.push('Invalid measurement type for indicator');
    }

    // Range validation
    if (!indicatorData.properties.range ||
        typeof indicatorData.properties.range.min !== 'number' ||
        typeof indicatorData.properties.range.max !== 'number') {
      errors.push('Indicator range must be specified with numeric min and max values');
    }

    if (indicatorData.properties.range &&
        indicatorData.properties.range.min >= indicatorData.properties.range.max) {
      errors.push('Range minimum must be less than maximum');
    }

    // Range unit validation
    if (!indicatorData.properties.rangeUnit?.trim()) {
      errors.push('Range unit must be specified');
    }

    // Housing validation
    const validHousing = ['field', 'panel', 'remote'];
    if (!validHousing.includes(indicatorData.properties.housing)) {
      errors.push('Invalid housing type for indicator');
    }

    // Input signal validation for remote indicators
    if (indicatorData.properties.housing === 'remote' || indicatorData.properties.housing === 'panel') {
      const validInputSignals = ['4-20mA', 'digital', 'pneumatic', 'voltage'];
      if (!indicatorData.properties.inputSignal || !validInputSignals.includes(indicatorData.properties.inputSignal)) {
        errors.push('Remote/Panel indicators must have valid input signal specification');
      }
    }

    // Display type validation
    if (indicatorData.properties.displayType) {
      const validDisplayTypes = ['analog', 'digital', 'lcd', 'led', 'mechanical'];
      if (!validDisplayTypes.includes(indicatorData.properties.displayType)) {
        errors.push('Invalid display type');
      }
    }

    // Scale validation
    if (indicatorData.properties.scale) {
      const scale = indicatorData.properties.scale;
      if (scale.min >= scale.max) {
        errors.push('Scale minimum must be less than maximum');
      }

      if (indicatorData.properties.range) {
        if (scale.min < indicatorData.properties.range.min || scale.max > indicatorData.properties.range.max) {
          errors.push('Scale range should be within or equal to measurement range');
        }
      }
    }

    // Accuracy validation for indicators
    if (indicatorData.properties.accuracy) {
      if (indicatorData.properties.accuracy <= 0 || indicatorData.properties.accuracy > 5) {
        errors.push('Indicator accuracy should be between 0 and 5%');
      }
    }

    // Local indicator specific validations
    if (indicatorData.properties.housing === 'field') {
      if (!indicatorData.properties.processConnection?.trim()) {
        errors.push('Field indicators must have process connection specified');
      }

      // Bourdon tube pressure gauge validations
      if (indicatorData.properties.measurementType === 'pressure' &&
          indicatorData.properties.displayType === 'analog') {
        if (indicatorData.properties.range.max > 400) {
          errors.push('Bourdon tube pressure gauges typically limited to 400 bar');
        }

        if (!indicatorData.properties.dialSize) {
          errors.push('Dial size must be specified for analog pressure gauges');
        }
      }

      // Bimetallic thermometer validations
      if (indicatorData.properties.measurementType === 'temperature' &&
          indicatorData.properties.displayType === 'analog') {
        if (indicatorData.properties.range.max > 500) {
          errors.push('Bimetallic thermometers typically limited to 500°C');
        }

        if (!indicatorData.properties.stemLength) {
          errors.push('Stem length must be specified for bimetallic thermometers');
        }
      }
    }

    // Digital indicator specific validations
    if (indicatorData.properties.displayType === 'digital' || indicatorData.properties.displayType === 'lcd') {
      if (!indicatorData.properties.displayResolution) {
        errors.push('Display resolution must be specified for digital indicators');
      }

      if (indicatorData.properties.displayResolution <= 0) {
        errors.push('Display resolution must be greater than 0');
      }
    }

    // Alarm capability validations
    if (indicatorData.properties.alarmCapability) {
      if (!indicatorData.properties.alarmSetpoints) {
        errors.push('Alarm setpoints must be specified when alarm capability is enabled');
      }

      if (indicatorData.properties.alarmSetpoints) {
        const alarms = indicatorData.properties.alarmSetpoints;
        const range = indicatorData.properties.range;

        if (alarms.highAlarm !== undefined && range &&
            (alarms.highAlarm < range.min || alarms.highAlarm > range.max)) {
          errors.push('High alarm setpoint must be within measurement range');
        }

        if (alarms.lowAlarm !== undefined && range &&
            (alarms.lowAlarm < range.min || alarms.lowAlarm > range.max)) {
          errors.push('Low alarm setpoint must be within measurement range');
        }

        if (alarms.highAlarm !== undefined && alarms.lowAlarm !== undefined &&
            alarms.lowAlarm >= alarms.highAlarm) {
          errors.push('Low alarm must be less than high alarm');
        }
      }
    }

    return errors;
  };

  // Enhanced validation callback
  const handleValidationChange = (nodeId: string, isValid: boolean, errors: string[]) => {
    const indicatorErrors = validateIndicatorData(data);
    const allErrors = [...errors, ...indicatorErrors];
    const finalIsValid = allErrors.length === 0;

    props.onValidationChange?.(nodeId, finalIsValid, allErrors);
  };

  // Enhanced property change callback
  const handlePropertyChange = (nodeId: string, properties: Record<string, any>) => {
    const updatedProperties = { ...properties };

    // Auto-set indicator type
    if (!properties.type) {
      updatedProperties.type = 'indicator';
    }

    // Set default display type based on housing and measurement type
    if (properties.housing && properties.measurementType && !properties.displayType) {
      if (properties.housing === 'field') {
        // Field indicators are typically analog for basic measurements
        if (['pressure', 'temperature'].includes(properties.measurementType)) {
          updatedProperties.displayType = 'analog';
        } else {
          updatedProperties.displayType = 'digital';
        }
      } else {
        // Panel and remote indicators are typically digital
        updatedProperties.displayType = 'digital';
      }
    }

    // Set default input signal for panel/remote indicators
    if ((properties.housing === 'panel' || properties.housing === 'remote') && !properties.inputSignal) {
      updatedProperties.inputSignal = '4-20mA';
    }

    // Set default scale same as range
    if (properties.range && !properties.scale) {
      updatedProperties.scale = {
        min: properties.range.min,
        max: properties.range.max
      };
    }

    // Set default accuracy based on display type and housing
    if (properties.displayType && properties.housing && !properties.accuracy) {
      const accuracyMap: Record<string, Record<string, number>> = {
        'analog': { 'field': 2.0, 'panel': 1.5, 'remote': 1.5 },
        'digital': { 'field': 0.5, 'panel': 0.2, 'remote': 0.3 },
        'lcd': { 'field': 0.3, 'panel': 0.1, 'remote': 0.2 },
        'led': { 'field': 0.5, 'panel': 0.3, 'remote': 0.3 },
        'mechanical': { 'field': 3.0, 'panel': 2.0, 'remote': 2.0 }
      };

      const accuracy = accuracyMap[properties.displayType]?.[properties.housing];
      if (accuracy) {
        updatedProperties.accuracy = accuracy;
      }
    }

    // Set default dial size for analog pressure gauges
    if (properties.measurementType === 'pressure' &&
        properties.displayType === 'analog' &&
        properties.housing === 'field' &&
        !properties.dialSize) {

      if (properties.range?.max <= 25) {
        updatedProperties.dialSize = '100mm';
      } else if (properties.range?.max <= 100) {
        updatedProperties.dialSize = '150mm';
      } else {
        updatedProperties.dialSize = '160mm';
      }
    }

    // Set default stem length for bimetallic thermometers
    if (properties.measurementType === 'temperature' &&
        properties.displayType === 'analog' &&
        properties.housing === 'field' &&
        !properties.stemLength) {

      updatedProperties.stemLength = '150mm';
    }

    // Set default process connection for field indicators
    if (properties.housing === 'field' && properties.measurementType && !properties.processConnection) {
      const connectionMap: Record<string, string> = {
        'pressure': '1/2" NPT bottom connection',
        'temperature': '1/2" NPT with thermowell',
        'flow': 'Not applicable (remote indication)',
        'level': '3/4" NPT side connection',
        'ph': '3/4" NPT',
        'conductivity': '1" NPT'
      };

      updatedProperties.processConnection = connectionMap[properties.measurementType];
    }

    // Set default display resolution for digital indicators
    if ((properties.displayType === 'digital' || properties.displayType === 'lcd') &&
        !properties.displayResolution) {

      const span = properties.range ? properties.range.max - properties.range.min : 100;

      if (span <= 10) {
        updatedProperties.displayResolution = 0.01;
      } else if (span <= 100) {
        updatedProperties.displayResolution = 0.1;
      } else if (span <= 1000) {
        updatedProperties.displayResolution = 1;
      } else {
        updatedProperties.displayResolution = 10;
      }
    }

    // Set default power supply based on housing and display type
    if (properties.housing && properties.displayType && !properties.powerSupply) {
      if (properties.housing === 'field' && properties.displayType === 'analog') {
        updatedProperties.powerSupply = 'Not required (mechanical)';
      } else if (properties.displayType === 'digital' || properties.displayType === 'lcd') {
        if (properties.housing === 'panel') {
          updatedProperties.powerSupply = '120V AC / 24V DC';
        } else {
          updatedProperties.powerSupply = '24V DC';
        }
      } else {
        updatedProperties.powerSupply = '24V DC';
      }
    }

    // Enable alarm capability for critical measurements in panel mounting
    if (properties.housing === 'panel' && properties.alarmCapability === undefined) {
      const criticalMeasurements = ['pressure', 'temperature', 'level'];
      updatedProperties.alarmCapability = criticalMeasurements.includes(properties.measurementType);
    }

    // Set default alarm setpoints if alarm capability is enabled
    if (properties.alarmCapability && properties.range && !properties.alarmSetpoints) {
      const range = properties.range;
      const span = range.max - range.min;

      updatedProperties.alarmSetpoints = {
        lowAlarm: range.min + span * 0.2,
        highAlarm: range.max - span * 0.2
      };

      // Round to display resolution
      if (properties.displayResolution) {
        const resolution = properties.displayResolution;
        updatedProperties.alarmSetpoints.lowAlarm = Math.round(updatedProperties.alarmSetpoints.lowAlarm / resolution) * resolution;
        updatedProperties.alarmSetpoints.highAlarm = Math.round(updatedProperties.alarmSetpoints.highAlarm / resolution) * resolution;
      }
    }

    // Set default material based on measurement type and environment
    if (!properties.material) {
      if (properties.measurementType === 'pressure' && properties.range?.max > 100) {
        updatedProperties.material = 'Stainless Steel 316';
      } else if (['ph', 'conductivity'].includes(properties.measurementType)) {
        updatedProperties.material = 'Hastelloy C-276';
      } else {
        updatedProperties.material = 'Stainless Steel 304';
      }
    }

    // Set default environmental rating based on housing
    if (properties.housing && !properties.environmentalRating) {
      if (properties.housing === 'field') {
        updatedProperties.environmentalRating = 'IP65';
      } else {
        updatedProperties.environmentalRating = 'IP54';
      }
    }

    // Set default certification
    if (!properties.certification) {
      updatedProperties.certification = ['CE'];

      if (properties.housing === 'field') {
        updatedProperties.certification.push('IP65');
      }

      if (properties.measurementType === 'pressure' && properties.range?.max > 16) {
        updatedProperties.certification.push('PED');
      }
    }

    // Set default units based on measurement type if not specified
    if (properties.measurementType && !properties.rangeUnit) {
      const unitMap: Record<string, string> = {
        'pressure': 'bar',
        'temperature': '°C',
        'flow': 'm³/h',
        'level': 'm',
        'ph': 'pH',
        'conductivity': 'µS/cm'
      };

      updatedProperties.rangeUnit = unitMap[properties.measurementType];
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

IndicatorNode.displayName = 'IndicatorNode';

export default IndicatorNode;