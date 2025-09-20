'use client';

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from '../base/BaseNode';
import { InstrumentProperties, NodeVisualState } from '@/types/nodes';

interface SensorNodeProps extends NodeProps<InstrumentProperties> {
  onPropertyChange?: (nodeId: string, properties: Record<string, any>) => void;
  onValidationChange?: (nodeId: string, isValid: boolean, errors: string[]) => void;
  onStateChange?: (nodeId: string, state: NodeVisualState) => void;
}

export const SensorNode: React.FC<SensorNodeProps> = memo((props) => {
  const { data, id } = props;

  // Sensor-specific validation
  const validateSensorData = (sensorData: InstrumentProperties): string[] => {
    const errors: string[] = [];

    // Measurement type validation
    const validMeasurementTypes = ['pressure', 'temperature', 'flow', 'level', 'ph', 'conductivity'];
    if (!validMeasurementTypes.includes(sensorData.properties.measurementType)) {
      errors.push('Invalid measurement type');
    }

    // Range validation
    if (!sensorData.properties.range || !sensorData.properties.range.min || !sensorData.properties.range.max) {
      errors.push('Measurement range must be specified');
    }

    if (sensorData.properties.range && sensorData.properties.range.min >= sensorData.properties.range.max) {
      errors.push('Range minimum must be less than maximum');
    }

    // Range unit validation
    if (!sensorData.properties.rangeUnit?.trim()) {
      errors.push('Range unit must be specified');
    }

    // Accuracy validation
    if (!sensorData.properties.accuracy || sensorData.properties.accuracy <= 0 || sensorData.properties.accuracy > 10) {
      errors.push('Accuracy must be between 0 and 10%');
    }

    // Precision validation
    if (!sensorData.properties.precision || sensorData.properties.precision <= 0) {
      errors.push('Precision must be greater than 0');
    }

    // Output signal validation
    const validOutputSignals = ['4-20mA', 'digital', 'wireless', 'pneumatic'];
    if (!validOutputSignals.includes(sensorData.properties.outputSignal)) {
      errors.push('Invalid output signal type');
    }

    // Power supply validation
    if (!sensorData.properties.powerSupply?.trim()) {
      errors.push('Power supply must be specified');
    }

    // Process connection validation
    if (!sensorData.properties.processConnection?.trim()) {
      errors.push('Process connection must be specified');
    }

    // Housing validation
    const validHousing = ['field', 'panel', 'remote'];
    if (!validHousing.includes(sensorData.properties.housing)) {
      errors.push('Invalid housing type');
    }

    // Measurement-specific validations
    switch (sensorData.properties.measurementType) {
      case 'pressure':
        if (sensorData.properties.range.min < 0 && !sensorData.properties.rangeUnit.includes('gauge')) {
          errors.push('Negative pressure should use gauge pressure units');
        }
        break;

      case 'temperature':
        if (sensorData.properties.range.max > 1000 && !sensorData.properties.processConnection.includes('thermowell')) {
          errors.push('High temperature measurement should use thermowell');
        }
        break;

      case 'flow':
        if (!sensorData.properties.processConnection.includes('flange') &&
            !sensorData.properties.processConnection.includes('clamp') &&
            !sensorData.properties.processConnection.includes('threaded')) {
          errors.push('Flow sensor requires proper process connection');
        }
        break;

      case 'level':
        if (sensorData.properties.range.max > 50 && sensorData.properties.outputSignal === 'pneumatic') {
          errors.push('High level ranges typically require electronic transmission');
        }
        break;

      case 'ph':
        if (sensorData.properties.range.min < 0 || sensorData.properties.range.max > 14) {
          errors.push('pH range must be between 0 and 14');
        }
        break;

      case 'conductivity':
        if (sensorData.properties.range.max > 200000 && !sensorData.properties.processConnection.includes('contacting')) {
          errors.push('High conductivity measurements may require contacting electrodes');
        }
        break;
    }

    // Calibration validation
    if (sensorData.properties.calibrationDate) {
      const calibrationDate = new Date(sensorData.properties.calibrationDate);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      if (calibrationDate < oneYearAgo) {
        errors.push('Calibration is overdue (>1 year old)');
      }
    }

    return errors;
  };

  // Enhanced validation callback
  const handleValidationChange = (nodeId: string, isValid: boolean, errors: string[]) => {
    const sensorErrors = validateSensorData(data);
    const allErrors = [...errors, ...sensorErrors];
    const finalIsValid = allErrors.length === 0;

    props.onValidationChange?.(nodeId, finalIsValid, allErrors);
  };

  // Enhanced property change callback
  const handlePropertyChange = (nodeId: string, properties: Record<string, any>) => {
    const updatedProperties = { ...properties };

    // Set default ranges based on measurement type
    if (properties.measurementType && !properties.range) {
      const defaultRanges: Record<string, {min: number, max: number, unit: string}> = {
        'pressure': { min: 0, max: 16, unit: 'bar' },
        'temperature': { min: 0, max: 200, unit: '°C' },
        'flow': { min: 0, max: 1000, unit: 'm³/h' },
        'level': { min: 0, max: 10, unit: 'm' },
        'ph': { min: 0, max: 14, unit: 'pH' },
        'conductivity': { min: 0, max: 20000, unit: 'µS/cm' }
      };

      const defaultRange = defaultRanges[properties.measurementType];
      if (defaultRange) {
        updatedProperties.range = { min: defaultRange.min, max: defaultRange.max };
        updatedProperties.rangeUnit = defaultRange.unit;
      }
    }

    // Set default accuracy based on measurement type
    if (properties.measurementType && !properties.accuracy) {
      const defaultAccuracies: Record<string, number> = {
        'pressure': 0.1,
        'temperature': 0.2,
        'flow': 0.5,
        'level': 0.3,
        'ph': 0.1,
        'conductivity': 1.0
      };

      updatedProperties.accuracy = defaultAccuracies[properties.measurementType] || 0.5;
    }

    // Set default precision based on measurement type
    if (properties.measurementType && !properties.precision) {
      const defaultPrecisions: Record<string, number> = {
        'pressure': 0.01,
        'temperature': 0.1,
        'flow': 1.0,
        'level': 0.01,
        'ph': 0.01,
        'conductivity': 1.0
      };

      updatedProperties.precision = defaultPrecisions[properties.measurementType] || 0.1;
    }

    // Set default output signal based on measurement type and range
    if (properties.measurementType && properties.range && !properties.outputSignal) {
      if (properties.housing === 'remote' || properties.range.max > 1000) {
        updatedProperties.outputSignal = 'digital';
      } else if (properties.measurementType === 'temperature' && properties.range.max < 100) {
        updatedProperties.outputSignal = 'pneumatic';
      } else {
        updatedProperties.outputSignal = '4-20mA';
      }
    }

    // Set default power supply based on output signal
    if (properties.outputSignal && !properties.powerSupply) {
      switch (properties.outputSignal) {
        case '4-20mA':
          updatedProperties.powerSupply = '24V DC';
          break;
        case 'digital':
          updatedProperties.powerSupply = '24V DC';
          break;
        case 'wireless':
          updatedProperties.powerSupply = 'Battery';
          break;
        case 'pneumatic':
          updatedProperties.powerSupply = 'Pneumatic (3-15 psi)';
          break;
      }
    }

    // Set default process connection based on measurement type
    if (properties.measurementType && !properties.processConnection) {
      const defaultConnections: Record<string, string> = {
        'pressure': '1/2" NPT',
        'temperature': '1/2" NPT with thermowell',
        'flow': '2" ANSI 150 flange',
        'level': '3/4" NPT',
        'ph': '3/4" NPT',
        'conductivity': '1" NPT'
      };

      updatedProperties.processConnection = defaultConnections[properties.measurementType] || '1/2" NPT';
    }

    // Set default housing based on measurement type and environment
    if (properties.measurementType && !properties.housing) {
      if (properties.measurementType === 'flow' || properties.measurementType === 'level') {
        updatedProperties.housing = 'field';
      } else if (properties.measurementType === 'ph' || properties.measurementType === 'conductivity') {
        updatedProperties.housing = 'field';
      } else {
        updatedProperties.housing = 'field';
      }
    }

    // Set certification based on environment and application
    if (!properties.certification) {
      updatedProperties.certification = ['IP67'];

      if (properties.measurementType === 'temperature' && properties.range?.max > 500) {
        updatedProperties.certification.push('ATEX');
      }

      if (properties.outputSignal === 'wireless') {
        updatedProperties.certification.push('FCC');
      }
    }

    // Calculate next calibration date
    if (properties.calibrationDate && !properties.calibrationDue) {
      const calibrationDate = new Date(properties.calibrationDate);
      const nextCalibration = new Date(calibrationDate);

      // Set calibration interval based on measurement type
      const calibrationIntervals: Record<string, number> = {
        'pressure': 12, // months
        'temperature': 12,
        'flow': 6,
        'level': 12,
        'ph': 3,
        'conductivity': 6
      };

      const interval = calibrationIntervals[properties.measurementType] || 12;
      nextCalibration.setMonth(nextCalibration.getMonth() + interval);

      updatedProperties.calibrationDue = nextCalibration.toISOString().split('T')[0];
    }

    // Set explosion-proof requirements based on environment
    if (properties.certification?.includes('ATEX') && properties.explosionProof === undefined) {
      updatedProperties.explosionProof = true;
    }

    // Set intrinsically safe requirements for hazardous areas
    if (properties.explosionProof && properties.intrinsicallySafe === undefined) {
      updatedProperties.intrinsicallySafe = true;
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

SensorNode.displayName = 'SensorNode';

export default SensorNode;