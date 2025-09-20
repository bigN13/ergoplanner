'use client';

import React from 'react';
import { PIDNodeType, NodeCategory } from '@/types/nodes';

// Import all node components
import { PumpNode, ValveNode, TankNode, HeatExchangerNode, CompressorNode } from './equipment';
import { SensorNode, TransmitterNode, ControllerNode, IndicatorNode, FinalControlNode } from './instrumentation';
import { FittingNode, SpecialtyNode, ConnectionNode } from './piping';
import { BaseNode } from './base/BaseNode';

// Node component registry
export const NODE_COMPONENTS = {
  // Equipment nodes
  'pump-centrifugal': PumpNode,
  'pump-positive-displacement': PumpNode,
  'pump-submersible': PumpNode,
  'valve-gate': ValveNode,
  'valve-ball': ValveNode,
  'valve-butterfly': ValveNode,
  'valve-check': ValveNode,
  'valve-relief': ValveNode,
  'valve-control': ValveNode,
  'tank-storage': TankNode,
  'tank-process': TankNode,
  'tank-pressure-vessel': TankNode,
  'heat-exchanger-shell-tube': HeatExchangerNode,
  'heat-exchanger-plate': HeatExchangerNode,
  'heat-exchanger-air-cooler': HeatExchangerNode,
  'compressor-centrifugal': CompressorNode,
  'compressor-reciprocating': CompressorNode,
  'compressor-screw': CompressorNode,

  // Instrumentation nodes
  'sensor-pressure': SensorNode,
  'sensor-temperature': SensorNode,
  'sensor-flow': SensorNode,
  'sensor-level': SensorNode,
  'sensor-ph': SensorNode,
  'transmitter-4-20ma': TransmitterNode,
  'transmitter-digital': TransmitterNode,
  'transmitter-wireless': TransmitterNode,
  'controller-pid': ControllerNode,
  'controller-on-off': ControllerNode,
  'controller-cascade': ControllerNode,
  'indicator-local': IndicatorNode,
  'indicator-remote': IndicatorNode,
  'indicator-digital': IndicatorNode,
  'final-control-valve': FinalControlNode,
  'final-control-vfd': FinalControlNode,

  // Piping components
  'fitting-elbow': FittingNode,
  'fitting-tee': FittingNode,
  'fitting-reducer': FittingNode,
  'fitting-coupling': FittingNode,
  'specialty-strainer': SpecialtyNode,
  'specialty-orifice-plate': SpecialtyNode,
  'specialty-rupture-disc': SpecialtyNode,
  'pipe-segment': BaseNode,
  'connection-point': ConnectionNode,
  'connection-terminal': ConnectionNode,

  // Support elements
  'electrical-motor': BaseNode,
  'electrical-junction-box': BaseNode,
  'electrical-panel': BaseNode,
  'safety-emergency-stop': BaseNode,
  'safety-alarm': BaseNode,
  'safety-interlock': BaseNode,
  'utility-steam': BaseNode,
  'utility-air': BaseNode,
  'utility-nitrogen': BaseNode,
  'utility-drain': BaseNode
};

// Node categories for organization
export const NODE_CATEGORIES: Record<NodeCategory, {
  label: string;
  icon: string;
  nodeTypes: PIDNodeType[];
  color: string;
}> = {
  [NodeCategory.EQUIPMENT]: {
    label: 'Equipment',
    icon: '⚙️',
    color: '#3b82f6',
    nodeTypes: [
      'pump-centrifugal',
      'pump-positive-displacement',
      'pump-submersible',
      'valve-gate',
      'valve-ball',
      'valve-butterfly',
      'valve-check',
      'valve-relief',
      'valve-control',
      'tank-storage',
      'tank-process',
      'tank-pressure-vessel',
      'heat-exchanger-shell-tube',
      'heat-exchanger-plate',
      'heat-exchanger-air-cooler',
      'compressor-centrifugal',
      'compressor-reciprocating',
      'compressor-screw'
    ]
  },
  [NodeCategory.INSTRUMENTATION]: {
    label: 'Instrumentation',
    icon: '📊',
    color: '#8b5cf6',
    nodeTypes: [
      'sensor-pressure',
      'sensor-temperature',
      'sensor-flow',
      'sensor-level',
      'sensor-ph',
      'transmitter-4-20ma',
      'transmitter-digital',
      'transmitter-wireless',
      'controller-pid',
      'controller-on-off',
      'controller-cascade',
      'indicator-local',
      'indicator-remote',
      'indicator-digital',
      'final-control-valve',
      'final-control-vfd'
    ]
  },
  [NodeCategory.PIPING]: {
    label: 'Piping & Fittings',
    icon: '🔧',
    color: '#059669',
    nodeTypes: [
      'fitting-elbow',
      'fitting-tee',
      'fitting-reducer',
      'fitting-coupling',
      'specialty-strainer',
      'specialty-orifice-plate',
      'specialty-rupture-disc',
      'pipe-segment',
      'connection-point',
      'connection-terminal'
    ]
  },
  [NodeCategory.ELECTRICAL]: {
    label: 'Electrical',
    icon: '⚡',
    color: '#dc2626',
    nodeTypes: [
      'electrical-motor',
      'electrical-junction-box',
      'electrical-panel'
    ]
  },
  [NodeCategory.SAFETY]: {
    label: 'Safety',
    icon: '🛡️',
    color: '#ea580c',
    nodeTypes: [
      'safety-emergency-stop',
      'safety-alarm',
      'safety-interlock'
    ]
  },
  [NodeCategory.UTILITY]: {
    label: 'Utilities',
    icon: '🏭',
    color: '#6b7280',
    nodeTypes: [
      'utility-steam',
      'utility-air',
      'utility-nitrogen',
      'utility-drain'
    ]
  },
  [NodeCategory.ANNOTATION]: {
    label: 'Annotations',
    icon: '📝',
    color: '#4b5563',
    nodeTypes: []
  }
};

// Helper functions
export function getNodeComponent(nodeType: PIDNodeType) {
  return NODE_COMPONENTS[nodeType] || BaseNode;
}

export function getNodeCategory(nodeType: PIDNodeType): NodeCategory | undefined {
  for (const [category, config] of Object.entries(NODE_CATEGORIES)) {
    if (config.nodeTypes.includes(nodeType)) {
      return category as NodeCategory;
    }
  }
  return undefined;
}

export function getNodesByCategory(category: NodeCategory): PIDNodeType[] {
  return NODE_CATEGORIES[category]?.nodeTypes || [];
}

export function getAllNodeTypes(): PIDNodeType[] {
  return Object.keys(NODE_COMPONENTS) as PIDNodeType[];
}

// ReactFlow node types configuration
export const REACT_FLOW_NODE_TYPES = Object.entries(NODE_COMPONENTS).reduce(
  (acc, [type, Component]) => {
    acc[type] = Component;
    return acc;
  },
  {} as Record<string, React.ComponentType<any>>
);

export default NODE_COMPONENTS;