'use client';

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from '../base/BaseNode';
import { InstrumentProperties, NodeVisualState } from '@/types/nodes';

interface TransmitterNodeProps extends NodeProps<InstrumentProperties> {
  onPropertyChange?: (nodeId: string, properties: Record<string, any>) => void;
  onValidationChange?: (nodeId: string, isValid: boolean, errors: string[]) => void;
  onStateChange?: (nodeId: string, state: NodeVisualState) => void;
}

export const TransmitterNode: React.FC<TransmitterNodeProps> = memo((props) => {
  const { data, id } = props;

  // Transmitter-specific validation
  const validateTransmitterData = (transmitterData: InstrumentProperties): string[] => {
    const errors: string[] = [];

    // Type validation - transmitters must be transmitter type
    if (transmitterData.properties.type !== 'transmitter') {
      errors.push('Node type must be transmitter');
    }

    // Measurement type validation
    const validMeasurementTypes = ['pressure', 'temperature', 'flow', 'level', 'ph', 'conductivity'];
    if (!validMeasurementTypes.includes(transmitterData.properties.measurementType)) {
      errors.push('Invalid measurement type for transmitter');
    }

    // Range validation
    if (!transmitterData.properties.range ||
        typeof transmitterData.properties.range.min !== 'number' ||
        typeof transmitterData.properties.range.max !== 'number') {
      errors.push('Transmitter range must be specified with numeric min and max values');
    }

    if (transmitterData.properties.range &&
        transmitterData.properties.range.min >= transmitterData.properties.range.max) {
      errors.push('Range minimum must be less than maximum');
    }

    // Range unit validation
    if (!transmitterData.properties.rangeUnit?.trim()) {
      errors.push('Range unit must be specified');
    }

    // Accuracy validation
    if (!transmitterData.properties.accuracy ||
        transmitterData.properties.accuracy <= 0 ||
        transmitterData.properties.accuracy > 5) {
      errors.push('Transmitter accuracy must be between 0 and 5%');
    }

    // Precision validation
    if (!transmitterData.properties.precision || transmitterData.properties.precision <= 0) {
      errors.push('Precision must be greater than 0');
    }

    // Output signal validation
    const validOutputSignals = ['4-20mA', 'digital', 'wireless'];
    if (!validOutputSignals.includes(transmitterData.properties.outputSignal)) {
      errors.push('Invalid output signal type for transmitter');
    }

    // Power supply validation
    if (!transmitterData.properties.powerSupply?.trim()) {
      errors.push('Power supply specification is required');
    }

    // Process connection validation
    if (!transmitterData.properties.processConnection?.trim()) {
      errors.push('Process connection must be specified');
    }

    // Housing validation for transmitters
    const validHousing = ['field', 'panel'];
    if (!validHousing.includes(transmitterData.properties.housing)) {
      errors.push('Transmitter housing must be field or panel mounted');
    }

    // Digital transmitter specific validations
    if (transmitterData.properties.outputSignal === 'digital') {
      if (!transmitterData.properties.protocol) {
        errors.push('Digital protocol must be specified for digital transmitters');
      }

      const validProtocols = ['HART', 'Profibus', 'Foundation Fieldbus', 'Modbus', 'Ethernet/IP'];
      if (transmitterData.properties.protocol &&
          !validProtocols.includes(transmitterData.properties.protocol)) {
        errors.push('Invalid digital communication protocol');
      }
    }

    // Wireless transmitter specific validations
    if (transmitterData.properties.outputSignal === 'wireless') {
      if (!transmitterData.properties.wirelessStandard) {
        errors.push('Wireless standard must be specified for wireless transmitters');
      }

      if (!transmitterData.properties.batteryLife) {
        errors.push('Battery life must be specified for wireless transmitters');
      }

      const validWirelessStandards = ['WirelessHART', 'ISA100.11a', 'LoRaWAN', 'WiFi', 'Zigbee'];
      if (transmitterData.properties.wirelessStandard &&
          !validWirelessStandards.includes(transmitterData.properties.wirelessStandard)) {
        errors.push('Invalid wireless communication standard');
      }
    }

    // Temperature transmitter specific validations
    if (transmitterData.properties.measurementType === 'temperature') {
      if (!transmitterData.properties.sensorType) {
        errors.push('Sensor type must be specified for temperature transmitters');
      }

      const validSensorTypes = ['RTD', 'Thermocouple', 'Thermistor'];
      if (transmitterData.properties.sensorType &&
          !validSensorTypes.includes(transmitterData.properties.sensorType)) {
        errors.push('Invalid temperature sensor type');
      }

      if (transmitterData.properties.sensorType === 'RTD' && !transmitterData.properties.rtdType) {
        errors.push('RTD type must be specified (Pt100, Pt1000, etc.)');
      }

      if (transmitterData.properties.sensorType === 'Thermocouple' && !transmitterData.properties.thermocoupleType) {
        errors.push('Thermocouple type must be specified (K, J, T, etc.)');
      }
    }

    // Pressure transmitter specific validations
    if (transmitterData.properties.measurementType === 'pressure') {
      if (!transmitterData.properties.pressureType) {
        errors.push('Pressure type must be specified (gauge, absolute, differential)');
      }

      const validPressureTypes = ['gauge', 'absolute', 'differential'];
      if (transmitterData.properties.pressureType &&
          !validPressureTypes.includes(transmitterData.properties.pressureType)) {
        errors.push('Invalid pressure measurement type');
      }

      if (transmitterData.properties.pressureType === 'differential' &&
          transmitterData.properties.range.min !== 0) {
        errors.push('Differential pressure transmitters should have 0 as minimum range');
      }
    }

    // Flow transmitter specific validations
    if (transmitterData.properties.measurementType === 'flow') {
      if (!transmitterData.properties.flowType) {
        errors.push('Flow measurement type must be specified');
      }

      const validFlowTypes = ['electromagnetic', 'ultrasonic', 'vortex', 'coriolis', 'thermal', 'orifice'];
      if (transmitterData.properties.flowType &&
          !validFlowTypes.includes(transmitterData.properties.flowType)) {
        errors.push('Invalid flow measurement type');
      }

      if (transmitterData.properties.flowType === 'electromagnetic' &&
          !transmitterData.properties.fluidConductivity) {
        errors.push('Fluid conductivity must be specified for electromagnetic flow meters');
      }
    }

    return errors;
  };

  // Enhanced validation callback
  const handleValidationChange = (nodeId: string, isValid: boolean, errors: string[]) => {
    const transmitterErrors = validateTransmitterData(data);
    const allErrors = [...errors, ...transmitterErrors];
    const finalIsValid = allErrors.length === 0;

    props.onValidationChange?.(nodeId, finalIsValid, allErrors);
  };

  // Enhanced property change callback
  const handlePropertyChange = (nodeId: string, properties: Record<string, any>) => {
    const updatedProperties = { ...properties };

    // Auto-set transmitter type
    if (!properties.type) {
      updatedProperties.type = 'transmitter';
    }

    // Set default accuracy based on measurement type and output signal
    if (properties.measurementType && properties.outputSignal && !properties.accuracy) {
      const accuracyMap: Record<string, Record<string, number>> = {
        'pressure': { '4-20mA': 0.1, 'digital': 0.075, 'wireless': 0.15 },
        'temperature': { '4-20mA': 0.2, 'digital': 0.1, 'wireless': 0.25 },
        'flow': { '4-20mA': 0.5, 'digital': 0.3, 'wireless': 0.75 },
        'level': { '4-20mA': 0.3, 'digital': 0.2, 'wireless': 0.5 },
        'ph': { '4-20mA': 0.1, 'digital': 0.05, 'wireless': 0.15 },
        'conductivity': { '4-20mA': 1.0, 'digital': 0.5, 'wireless': 1.5 }
      };

      const accuracy = accuracyMap[properties.measurementType]?.[properties.outputSignal];
      if (accuracy) {
        updatedProperties.accuracy = accuracy;
      }
    }

    // Set default power supply based on output signal
    if (properties.outputSignal && !properties.powerSupply) {
      switch (properties.outputSignal) {
        case '4-20mA':
          updatedProperties.powerSupply = '24V DC (2-wire)';
          break;
        case 'digital':
          updatedProperties.powerSupply = '24V DC (4-wire)';
          break;
        case 'wireless':
          updatedProperties.powerSupply = 'Lithium Battery';
          break;
      }
    }

    // Set default protocol for digital transmitters
    if (properties.outputSignal === 'digital' && !properties.protocol) {
      // Choose protocol based on measurement type and application
      if (properties.measurementType === 'flow' || properties.measurementType === 'level') {
        updatedProperties.protocol = 'Foundation Fieldbus';
      } else {
        updatedProperties.protocol = 'HART';
      }
    }

    // Set default wireless standard for wireless transmitters
    if (properties.outputSignal === 'wireless' && !properties.wirelessStandard) {
      updatedProperties.wirelessStandard = 'WirelessHART';
      updatedProperties.batteryLife = '10 years';
      updatedProperties.updateRate = '1 minute';
    }

    // Set temperature sensor defaults
    if (properties.measurementType === 'temperature') {
      if (!properties.sensorType) {
        if (properties.range?.max > 600) {
          updatedProperties.sensorType = 'Thermocouple';
          updatedProperties.thermocoupleType = 'K';
        } else {
          updatedProperties.sensorType = 'RTD';
          updatedProperties.rtdType = 'Pt100';
        }
      }

      if (properties.sensorType === 'RTD' && !properties.rtdType) {
        updatedProperties.rtdType = 'Pt100';
      }

      if (properties.sensorType === 'Thermocouple' && !properties.thermocoupleType) {
        if (properties.range?.max > 1000) {
          updatedProperties.thermocoupleType = 'K';
        } else {
          updatedProperties.thermocoupleType = 'J';
        }
      }
    }

    // Set pressure measurement defaults
    if (properties.measurementType === 'pressure') {
      if (!properties.pressureType) {
        if (properties.range?.min < 0) {
          updatedProperties.pressureType = 'gauge';
        } else {
          updatedProperties.pressureType = 'gauge';
        }
      }

      if (!properties.processConnection) {
        if (properties.range?.max > 100) {
          updatedProperties.processConnection = '1/2" NPT with isolation valve';
        } else {
          updatedProperties.processConnection = '1/2" NPT';
        }
      }
    }

    // Set flow measurement defaults
    if (properties.measurementType === 'flow') {
      if (!properties.flowType) {
        if (properties.fluidType?.toLowerCase().includes('water') ||
            properties.fluidType?.toLowerCase().includes('conductive')) {
          updatedProperties.flowType = 'electromagnetic';
          updatedProperties.fluidConductivity = 'Conductive (>5 µS/cm)';
        } else if (properties.range?.max > 10000) {
          updatedProperties.flowType = 'ultrasonic';
        } else {
          updatedProperties.flowType = 'vortex';
        }
      }

      if (properties.flowType === 'electromagnetic' && !properties.fluidConductivity) {
        updatedProperties.fluidConductivity = 'Conductive (>5 µS/cm)';
      }

      if (!properties.pipeSize && properties.flowType) {
        // Estimate pipe size based on flow rate
        if (properties.range?.max < 100) {
          updatedProperties.pipeSize = '2"';
        } else if (properties.range?.max < 1000) {
          updatedProperties.pipeSize = '4"';
        } else {
          updatedProperties.pipeSize = '6"';
        }
      }
    }

    // Set level measurement defaults
    if (properties.measurementType === 'level') {
      if (!properties.levelType) {
        if (properties.range?.max > 20) {
          updatedProperties.levelType = 'radar';
        } else if (properties.range?.max > 5) {
          updatedProperties.levelType = 'ultrasonic';
        } else {
          updatedProperties.levelType = 'hydrostatic';
        }
      }
    }

    // Set pH measurement defaults
    if (properties.measurementType === 'ph') {
      if (!properties.electrodeType) {
        updatedProperties.electrodeType = 'glass';
      }

      if (!properties.referenceElectrode) {
        updatedProperties.referenceElectrode = 'Ag/AgCl';
      }

      if (!properties.automaticCleaning) {
        updatedProperties.automaticCleaning = false;
      }
    }

    // Set conductivity measurement defaults
    if (properties.measurementType === 'conductivity') {
      if (!properties.conductivityType) {
        if (properties.range?.max > 20000) {
          updatedProperties.conductivityType = 'contacting';
        } else {
          updatedProperties.conductivityType = 'inductive';
        }
      }

      if (!properties.cellConstant) {
        if (properties.range?.max < 2000) {
          updatedProperties.cellConstant = 0.1;
        } else if (properties.range?.max < 20000) {
          updatedProperties.cellConstant = 1.0;
        } else {
          updatedProperties.cellConstant = 10.0;
        }
      }
    }

    // Set default certifications
    if (!properties.certification) {
      updatedProperties.certification = ['CE', 'IP67'];

      if (properties.outputSignal === 'wireless') {
        updatedProperties.certification.push('FCC');
      }

      if (properties.measurementType === 'temperature' && properties.range?.max > 200) {
        updatedProperties.certification.push('ATEX');
      }
    }

    // Set explosion protection requirements
    if (properties.certification?.includes('ATEX') && properties.explosionProof === undefined) {
      updatedProperties.explosionProof = true;
      updatedProperties.intrinsicallySafe = true;
    }

    // Calculate next calibration date
    if (properties.calibrationDate && !properties.calibrationDue) {
      const calibrationDate = new Date(properties.calibrationDate);
      const nextCalibration = new Date(calibrationDate);

      // Calibration intervals based on measurement type and accuracy
      const getCalibrationInterval = (measurementType: string, accuracy: number): number => {
        if (accuracy <= 0.1) return 6; // High accuracy - 6 months
        if (measurementType === 'ph') return 3; // pH needs frequent calibration
        if (measurementType === 'conductivity') return 6;
        return 12; // Standard interval
      };

      const interval = getCalibrationInterval(properties.measurementType, properties.accuracy || 1);
      nextCalibration.setMonth(nextCalibration.getMonth() + interval);

      updatedProperties.calibrationDue = nextCalibration.toISOString().split('T')[0];
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

TransmitterNode.displayName = 'TransmitterNode';

export default TransmitterNode;