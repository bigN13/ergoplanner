'use client';

import React, { useMemo } from 'react';
import { PIDNodeType, NodeProperty, NodeTemplate, PIDNodeData } from '@/types/nodes';

/**
 * Node Property Manager
 * Provides configurable property definitions for all P&ID node types
 */

// Base property definitions that apply to most nodes
const BASE_PROPERTIES: NodeProperty[] = [
  {
    key: 'label',
    label: 'Label',
    type: 'string',
    required: true,
    category: 'identification',
    description: 'Node display label'
  },
  {
    key: 'tagNumber',
    label: 'Tag Number',
    type: 'string',
    category: 'identification',
    description: 'Engineering tag number (e.g., P-001, FT-123)',
    validation: {
      pattern: '^[A-Z]{1,3}-\\d{3}[A-Z]?$'
    }
  },
  {
    key: 'description',
    label: 'Description',
    type: 'string',
    category: 'identification',
    description: 'Detailed description of the component'
  }
];

// Equipment-specific property definitions
const PUMP_PROPERTIES: NodeProperty[] = [
  ...BASE_PROPERTIES,
  {
    key: 'type',
    label: 'Pump Type',
    type: 'select',
    required: true,
    category: 'design',
    validation: {
      options: [
        { value: 'centrifugal', label: 'Centrifugal' },
        { value: 'positive-displacement', label: 'Positive Displacement' },
        { value: 'submersible', label: 'Submersible' }
      ]
    }
  },
  {
    key: 'capacity',
    label: 'Capacity',
    type: 'number',
    required: true,
    category: 'performance',
    unit: 'm³/h',
    validation: { min: 0 }
  },
  {
    key: 'head',
    label: 'Head',
    type: 'number',
    required: true,
    category: 'performance',
    unit: 'm',
    validation: { min: 0 }
  },
  {
    key: 'efficiency',
    label: 'Efficiency',
    type: 'number',
    category: 'performance',
    unit: '%',
    validation: { min: 0, max: 100 }
  },
  {
    key: 'powerRating',
    label: 'Power Rating',
    type: 'number',
    category: 'electrical',
    unit: 'kW',
    validation: { min: 0 }
  },
  {
    key: 'speed',
    label: 'Speed',
    type: 'number',
    category: 'performance',
    unit: 'rpm',
    validation: { min: 0 }
  },
  {
    key: 'material',
    label: 'Material',
    type: 'select',
    category: 'materials',
    validation: {
      options: [
        { value: 'Cast Iron', label: 'Cast Iron' },
        { value: 'Stainless Steel 304', label: 'Stainless Steel 304' },
        { value: 'Stainless Steel 316', label: 'Stainless Steel 316' },
        { value: 'Bronze', label: 'Bronze' },
        { value: 'Hastelloy', label: 'Hastelloy' }
      ]
    }
  }
];

const VALVE_PROPERTIES: NodeProperty[] = [
  ...BASE_PROPERTIES,
  {
    key: 'type',
    label: 'Valve Type',
    type: 'select',
    required: true,
    category: 'design',
    validation: {
      options: [
        { value: 'gate', label: 'Gate Valve' },
        { value: 'ball', label: 'Ball Valve' },
        { value: 'butterfly', label: 'Butterfly Valve' },
        { value: 'check', label: 'Check Valve' },
        { value: 'relief', label: 'Relief Valve' },
        { value: 'control', label: 'Control Valve' }
      ]
    }
  },
  {
    key: 'size',
    label: 'Size',
    type: 'number',
    required: true,
    category: 'design',
    unit: 'inch',
    validation: { min: 0 }
  },
  {
    key: 'pressureRating',
    label: 'Pressure Rating',
    type: 'number',
    required: true,
    category: 'design',
    unit: 'bar',
    validation: { min: 0 }
  },
  {
    key: 'bodyMaterial',
    label: 'Body Material',
    type: 'select',
    category: 'materials',
    validation: {
      options: [
        { value: 'Carbon Steel', label: 'Carbon Steel' },
        { value: 'Stainless Steel 304', label: 'Stainless Steel 304' },
        { value: 'Stainless Steel 316', label: 'Stainless Steel 316' },
        { value: 'Bronze', label: 'Bronze' },
        { value: 'PVC', label: 'PVC' }
      ]
    }
  },
  {
    key: 'operation',
    label: 'Operation',
    type: 'select',
    category: 'control',
    validation: {
      options: [
        { value: 'manual', label: 'Manual' },
        { value: 'electric', label: 'Electric' },
        { value: 'pneumatic', label: 'Pneumatic' },
        { value: 'hydraulic', label: 'Hydraulic' }
      ]
    }
  },
  {
    key: 'position',
    label: 'Position',
    type: 'select',
    category: 'status',
    validation: {
      options: [
        { value: 'open', label: 'Open' },
        { value: 'closed', label: 'Closed' },
        { value: 'partial', label: 'Partial' }
      ]
    }
  }
];

const TANK_PROPERTIES: NodeProperty[] = [
  ...BASE_PROPERTIES,
  {
    key: 'type',
    label: 'Tank Type',
    type: 'select',
    required: true,
    category: 'design',
    validation: {
      options: [
        { value: 'storage', label: 'Storage Tank' },
        { value: 'process', label: 'Process Tank' },
        { value: 'pressure-vessel', label: 'Pressure Vessel' }
      ]
    }
  },
  {
    key: 'volume',
    label: 'Volume',
    type: 'number',
    required: true,
    category: 'design',
    unit: 'm³',
    validation: { min: 0 }
  },
  {
    key: 'diameter',
    label: 'Diameter',
    type: 'number',
    required: true,
    category: 'dimensions',
    unit: 'm',
    validation: { min: 0 }
  },
  {
    key: 'height',
    label: 'Height',
    type: 'number',
    required: true,
    category: 'dimensions',
    unit: 'm',
    validation: { min: 0 }
  },
  {
    key: 'designPressure',
    label: 'Design Pressure',
    type: 'number',
    category: 'design',
    unit: 'bar',
    validation: { min: 0 }
  },
  {
    key: 'designTemperature',
    label: 'Design Temperature',
    type: 'number',
    category: 'design',
    unit: '°C'
  },
  {
    key: 'material',
    label: 'Material',
    type: 'select',
    category: 'materials',
    validation: {
      options: [
        { value: 'Carbon Steel', label: 'Carbon Steel' },
        { value: 'Stainless Steel 304', label: 'Stainless Steel 304' },
        { value: 'Stainless Steel 316', label: 'Stainless Steel 316' },
        { value: 'Aluminum', label: 'Aluminum' },
        { value: 'FRP', label: 'Fiberglass Reinforced Plastic' }
      ]
    }
  }
];

// Instrumentation property definitions
const SENSOR_PROPERTIES: NodeProperty[] = [
  ...BASE_PROPERTIES,
  {
    key: 'measurementType',
    label: 'Measurement Type',
    type: 'select',
    required: true,
    category: 'measurement',
    validation: {
      options: [
        { value: 'pressure', label: 'Pressure' },
        { value: 'temperature', label: 'Temperature' },
        { value: 'flow', label: 'Flow' },
        { value: 'level', label: 'Level' },
        { value: 'ph', label: 'pH' },
        { value: 'conductivity', label: 'Conductivity' }
      ]
    }
  },
  {
    key: 'rangeMin',
    label: 'Range Minimum',
    type: 'number',
    required: true,
    category: 'measurement'
  },
  {
    key: 'rangeMax',
    label: 'Range Maximum',
    type: 'number',
    required: true,
    category: 'measurement'
  },
  {
    key: 'rangeUnit',
    label: 'Range Unit',
    type: 'string',
    required: true,
    category: 'measurement'
  },
  {
    key: 'accuracy',
    label: 'Accuracy',
    type: 'number',
    category: 'performance',
    unit: '%',
    validation: { min: 0, max: 10 }
  },
  {
    key: 'outputSignal',
    label: 'Output Signal',
    type: 'select',
    category: 'signal',
    validation: {
      options: [
        { value: '4-20mA', label: '4-20mA' },
        { value: 'digital', label: 'Digital' },
        { value: 'wireless', label: 'Wireless' },
        { value: 'pneumatic', label: 'Pneumatic' }
      ]
    }
  },
  {
    key: 'housing',
    label: 'Housing',
    type: 'select',
    category: 'installation',
    validation: {
      options: [
        { value: 'field', label: 'Field Mounted' },
        { value: 'panel', label: 'Panel Mounted' },
        { value: 'remote', label: 'Remote Mounted' }
      ]
    }
  }
];

const CONTROLLER_PROPERTIES: NodeProperty[] = [
  ...SENSOR_PROPERTIES,
  {
    key: 'controllerType',
    label: 'Controller Type',
    type: 'select',
    required: true,
    category: 'control',
    validation: {
      options: [
        { value: 'pid', label: 'PID Controller' },
        { value: 'on-off', label: 'On/Off Controller' },
        { value: 'cascade', label: 'Cascade Controller' }
      ]
    }
  },
  {
    key: 'setpoint',
    label: 'Setpoint',
    type: 'number',
    required: true,
    category: 'control'
  },
  {
    key: 'controlAction',
    label: 'Control Action',
    type: 'select',
    category: 'control',
    validation: {
      options: [
        { value: 'direct', label: 'Direct Acting' },
        { value: 'reverse', label: 'Reverse Acting' }
      ]
    }
  }
];

// Property registry mapping node types to their property definitions
export const NODE_PROPERTY_REGISTRY: Record<PIDNodeType, NodeProperty[]> = {
  // Equipment nodes
  'pump-centrifugal': PUMP_PROPERTIES,
  'pump-positive-displacement': PUMP_PROPERTIES,
  'pump-submersible': PUMP_PROPERTIES,
  'valve-gate': VALVE_PROPERTIES,
  'valve-ball': VALVE_PROPERTIES,
  'valve-butterfly': VALVE_PROPERTIES,
  'valve-check': VALVE_PROPERTIES,
  'valve-relief': VALVE_PROPERTIES,
  'valve-control': VALVE_PROPERTIES,
  'tank-storage': TANK_PROPERTIES,
  'tank-process': TANK_PROPERTIES,
  'tank-pressure-vessel': TANK_PROPERTIES,
  'heat-exchanger-shell-tube': [...BASE_PROPERTIES],
  'heat-exchanger-plate': [...BASE_PROPERTIES],
  'heat-exchanger-air-cooler': [...BASE_PROPERTIES],
  'compressor-centrifugal': [...BASE_PROPERTIES],
  'compressor-reciprocating': [...BASE_PROPERTIES],
  'compressor-screw': [...BASE_PROPERTIES],

  // Instrumentation nodes
  'sensor-pressure': SENSOR_PROPERTIES,
  'sensor-temperature': SENSOR_PROPERTIES,
  'sensor-flow': SENSOR_PROPERTIES,
  'sensor-level': SENSOR_PROPERTIES,
  'sensor-ph': SENSOR_PROPERTIES,
  'transmitter-4-20ma': SENSOR_PROPERTIES,
  'transmitter-digital': SENSOR_PROPERTIES,
  'transmitter-wireless': SENSOR_PROPERTIES,
  'controller-pid': CONTROLLER_PROPERTIES,
  'controller-on-off': CONTROLLER_PROPERTIES,
  'controller-cascade': CONTROLLER_PROPERTIES,
  'indicator-local': SENSOR_PROPERTIES,
  'indicator-remote': SENSOR_PROPERTIES,
  'indicator-digital': SENSOR_PROPERTIES,
  'final-control-valve': VALVE_PROPERTIES,
  'final-control-vfd': [...BASE_PROPERTIES],

  // Piping components
  'fitting-elbow': [...BASE_PROPERTIES],
  'fitting-tee': [...BASE_PROPERTIES],
  'fitting-reducer': [...BASE_PROPERTIES],
  'fitting-coupling': [...BASE_PROPERTIES],
  'specialty-strainer': [...BASE_PROPERTIES],
  'specialty-orifice-plate': [...BASE_PROPERTIES],
  'specialty-rupture-disc': [...BASE_PROPERTIES],
  'pipe-segment': [...BASE_PROPERTIES],
  'connection-point': [...BASE_PROPERTIES],
  'connection-terminal': [...BASE_PROPERTIES],

  // Support elements
  'electrical-motor': [...BASE_PROPERTIES],
  'electrical-junction-box': [...BASE_PROPERTIES],
  'electrical-panel': [...BASE_PROPERTIES],
  'safety-emergency-stop': [...BASE_PROPERTIES],
  'safety-alarm': [...BASE_PROPERTIES],
  'safety-interlock': [...BASE_PROPERTIES],
  'utility-steam': [...BASE_PROPERTIES],
  'utility-air': [...BASE_PROPERTIES],
  'utility-nitrogen': [...BASE_PROPERTIES],
  'utility-drain': [...BASE_PROPERTIES]
};

// Property categories for organization
export const PROPERTY_CATEGORIES = {
  identification: { label: 'Identification', order: 1 },
  design: { label: 'Design Parameters', order: 2 },
  performance: { label: 'Performance', order: 3 },
  materials: { label: 'Materials', order: 4 },
  dimensions: { label: 'Dimensions', order: 5 },
  measurement: { label: 'Measurement', order: 6 },
  control: { label: 'Control', order: 7 },
  signal: { label: 'Signal & Communication', order: 8 },
  installation: { label: 'Installation', order: 9 },
  electrical: { label: 'Electrical', order: 10 },
  status: { label: 'Status', order: 11 }
};

/**
 * Hook to get properties for a specific node type
 */
export function useNodeProperties(nodeType: PIDNodeType): NodeProperty[] {
  return useMemo(() => {
    return NODE_PROPERTY_REGISTRY[nodeType] || BASE_PROPERTIES;
  }, [nodeType]);
}

/**
 * Hook to get properties organized by category
 */
export function useNodePropertiesByCategory(nodeType: PIDNodeType): Record<string, NodeProperty[]> {
  const properties = useNodeProperties(nodeType);

  return useMemo(() => {
    const categorized: Record<string, NodeProperty[]> = {};

    properties.forEach(property => {
      const category = property.category || 'general';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(property);
    });

    return categorized;
  }, [properties]);
}

/**
 * Get property definition by key
 */
export function getPropertyDefinition(nodeType: PIDNodeType, propertyKey: string): NodeProperty | undefined {
  const properties = NODE_PROPERTY_REGISTRY[nodeType] || BASE_PROPERTIES;
  return properties.find(prop => prop.key === propertyKey);
}

/**
 * Validate a property value against its definition
 */
export function validatePropertyValue(
  property: NodeProperty,
  value: any
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (property.required && (value === undefined || value === null || value === '')) {
    errors.push(`${property.label} is required`);
    return { isValid: false, errors };
  }

  // Skip validation if value is empty and not required
  if (value === undefined || value === null || value === '') {
    return { isValid: true, errors: [] };
  }

  // Type validation
  switch (property.type) {
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        errors.push(`${property.label} must be a valid number`);
      } else {
        // Range validation
        if (property.validation?.min !== undefined && value < property.validation.min) {
          errors.push(`${property.label} must be at least ${property.validation.min}`);
        }
        if (property.validation?.max !== undefined && value > property.validation.max) {
          errors.push(`${property.label} must not exceed ${property.validation.max}`);
        }
      }
      break;

    case 'string':
      if (typeof value !== 'string') {
        errors.push(`${property.label} must be a string`);
      } else {
        // Pattern validation
        if (property.validation?.pattern) {
          const regex = new RegExp(property.validation.pattern);
          if (!regex.test(value)) {
            errors.push(`${property.label} format is invalid`);
          }
        }
      }
      break;

    case 'select':
      if (property.validation?.options) {
        const validValues = property.validation.options.map(opt => opt.value);
        if (!validValues.includes(value)) {
          errors.push(`${property.label} must be one of: ${validValues.join(', ')}`);
        }
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        errors.push(`${property.label} must be true or false`);
      }
      break;
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate all properties of a node
 */
export function validateNodeProperties(
  nodeType: PIDNodeType,
  data: PIDNodeData
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const properties = useNodeProperties(nodeType);
  const allErrors: string[] = [];
  const warnings: string[] = [];

  properties.forEach(property => {
    const value = data.properties?.[property.key];
    const validation = validatePropertyValue(property, value);

    if (!validation.isValid) {
      allErrors.push(...validation.errors);
    }
  });

  // Add custom validation warnings
  if (nodeType.includes('pump') && data.properties?.efficiency && data.properties.efficiency < 50) {
    warnings.push('Low pump efficiency may indicate poor selection or wear');
  }

  if (nodeType.includes('valve') && data.properties?.pressureRating && data.properties.pressureRating < 10) {
    warnings.push('Low pressure rating - verify compatibility with system pressure');
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings
  };
}

export default NODE_PROPERTY_REGISTRY;