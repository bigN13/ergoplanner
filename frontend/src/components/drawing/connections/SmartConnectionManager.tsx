'use client';

import React, { useMemo, useCallback } from 'react';
import { Position } from 'reactflow';
import { PIDNodeType, HandleType, NodeHandle, HANDLE_COLORS } from '@/types/nodes';

/**
 * Smart Connection Manager
 * Manages intelligent connection handles based on node types and engineering logic
 */

// Connection compatibility matrix
const CONNECTION_COMPATIBILITY: Record<HandleType, HandleType[]> = {
  [HandleType.LIQUID_INLET]: [HandleType.LIQUID_OUTLET],
  [HandleType.LIQUID_OUTLET]: [HandleType.LIQUID_INLET],
  [HandleType.GAS_INLET]: [HandleType.GAS_OUTLET],
  [HandleType.GAS_OUTLET]: [HandleType.GAS_INLET],
  [HandleType.STEAM_INLET]: [HandleType.STEAM_OUTLET],
  [HandleType.STEAM_OUTLET]: [HandleType.STEAM_INLET],
  [HandleType.ELECTRICAL_INPUT]: [HandleType.ELECTRICAL_OUTPUT],
  [HandleType.ELECTRICAL_OUTPUT]: [HandleType.ELECTRICAL_INPUT],
  [HandleType.SIGNAL_INPUT]: [HandleType.SIGNAL_OUTPUT],
  [HandleType.SIGNAL_OUTPUT]: [HandleType.SIGNAL_INPUT],
  [HandleType.CONTROL_INPUT]: [HandleType.CONTROL_OUTPUT],
  [HandleType.CONTROL_OUTPUT]: [HandleType.CONTROL_INPUT],
  [HandleType.DRAIN]: [],
  [HandleType.VENT]: [],
  [HandleType.OVERFLOW]: [HandleType.LIQUID_INLET],
  [HandleType.BYPASS]: [HandleType.LIQUID_INLET, HandleType.LIQUID_OUTLET]
};

// Node type handle configurations
const NODE_HANDLE_CONFIGS: Record<PIDNodeType, NodeHandle[]> = {
  // Pump configurations
  'pump-centrifugal': [
    {
      id: 'suction',
      type: 'target',
      position: Position.Left,
      handleType: HandleType.LIQUID_INLET,
      label: 'Suction',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_OUTLET],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'discharge',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.LIQUID_OUTLET,
      label: 'Discharge',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_INLET],
        required: true
      }
    }
  ],

  'pump-positive-displacement': [
    {
      id: 'suction',
      type: 'target',
      position: Position.Left,
      handleType: HandleType.LIQUID_INLET,
      label: 'Suction',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_OUTLET],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'discharge',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.LIQUID_OUTLET,
      label: 'Discharge',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_INLET],
        required: true
      }
    }
  ],

  'pump-submersible': [
    {
      id: 'discharge',
      type: 'source',
      position: Position.Top,
      handleType: HandleType.LIQUID_OUTLET,
      label: 'Discharge',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_INLET],
        required: true
      }
    },
    {
      id: 'power',
      type: 'target',
      position: Position.Bottom,
      handleType: HandleType.ELECTRICAL_INPUT,
      label: 'Power',
      constraints: {
        compatibleTypes: [HandleType.ELECTRICAL_OUTPUT],
        maxConnections: 1
      }
    }
  ],

  // Valve configurations
  'valve-gate': [
    {
      id: 'inlet',
      type: 'target',
      position: Position.Left,
      handleType: HandleType.LIQUID_INLET,
      label: 'Inlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_OUTLET],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'outlet',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.LIQUID_OUTLET,
      label: 'Outlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_INLET],
        required: true
      }
    }
  ],

  'valve-ball': [
    {
      id: 'inlet',
      type: 'target',
      position: Position.Left,
      handleType: HandleType.LIQUID_INLET,
      label: 'Inlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_OUTLET],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'outlet',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.LIQUID_OUTLET,
      label: 'Outlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_INLET],
        required: true
      }
    }
  ],

  'valve-butterfly': [
    {
      id: 'inlet',
      type: 'target',
      position: Position.Left,
      handleType: HandleType.LIQUID_INLET,
      label: 'Inlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_OUTLET],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'outlet',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.LIQUID_OUTLET,
      label: 'Outlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_INLET],
        required: true
      }
    }
  ],

  'valve-check': [
    {
      id: 'inlet',
      type: 'target',
      position: Position.Left,
      handleType: HandleType.LIQUID_INLET,
      label: 'Inlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_OUTLET],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'outlet',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.LIQUID_OUTLET,
      label: 'Outlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_INLET],
        required: true
      }
    }
  ],

  'valve-relief': [
    {
      id: 'inlet',
      type: 'target',
      position: Position.Bottom,
      handleType: HandleType.LIQUID_INLET,
      label: 'Inlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_OUTLET],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'outlet',
      type: 'source',
      position: Position.Top,
      handleType: HandleType.LIQUID_OUTLET,
      label: 'Outlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_INLET, HandleType.VENT]
      }
    }
  ],

  'valve-control': [
    {
      id: 'inlet',
      type: 'target',
      position: Position.Left,
      handleType: HandleType.LIQUID_INLET,
      label: 'Inlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_OUTLET],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'outlet',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.LIQUID_OUTLET,
      label: 'Outlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_INLET],
        required: true
      }
    },
    {
      id: 'control',
      type: 'target',
      position: Position.Top,
      handleType: HandleType.CONTROL_INPUT,
      label: 'Control Signal',
      constraints: {
        compatibleTypes: [HandleType.CONTROL_OUTPUT],
        maxConnections: 1
      }
    }
  ],

  // Tank configurations
  'tank-storage': [
    {
      id: 'inlet',
      type: 'target',
      position: Position.Top,
      handleType: HandleType.LIQUID_INLET,
      label: 'Inlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_OUTLET]
      }
    },
    {
      id: 'outlet',
      type: 'source',
      position: Position.Bottom,
      handleType: HandleType.LIQUID_OUTLET,
      label: 'Outlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_INLET]
      }
    },
    {
      id: 'overflow',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.OVERFLOW,
      label: 'Overflow',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_INLET]
      }
    },
    {
      id: 'vent',
      type: 'source',
      position: Position.Top,
      handleType: HandleType.VENT,
      label: 'Vent'
    }
  ],

  'tank-process': [
    {
      id: 'inlet',
      type: 'target',
      position: Position.Left,
      handleType: HandleType.LIQUID_INLET,
      label: 'Feed',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_OUTLET],
        required: true
      }
    },
    {
      id: 'outlet',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.LIQUID_OUTLET,
      label: 'Product',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_INLET]
      }
    },
    {
      id: 'vapor',
      type: 'source',
      position: Position.Top,
      handleType: HandleType.GAS_OUTLET,
      label: 'Vapor',
      constraints: {
        compatibleTypes: [HandleType.GAS_INLET]
      }
    },
    {
      id: 'drain',
      type: 'source',
      position: Position.Bottom,
      handleType: HandleType.DRAIN,
      label: 'Drain'
    }
  ],

  'tank-pressure-vessel': [
    {
      id: 'inlet',
      type: 'target',
      position: Position.Left,
      handleType: HandleType.LIQUID_INLET,
      label: 'Inlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_OUTLET],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'outlet',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.LIQUID_OUTLET,
      label: 'Outlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_INLET]
      }
    },
    {
      id: 'relief',
      type: 'source',
      position: Position.Top,
      handleType: HandleType.VENT,
      label: 'Relief'
    }
  ],

  // Heat exchanger configurations
  'heat-exchanger-shell-tube': [
    {
      id: 'shell-inlet',
      type: 'target',
      position: Position.Left,
      handleType: HandleType.LIQUID_INLET,
      label: 'Shell Inlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_OUTLET],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'shell-outlet',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.LIQUID_OUTLET,
      label: 'Shell Outlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_INLET]
      }
    },
    {
      id: 'tube-inlet',
      type: 'target',
      position: Position.Top,
      handleType: HandleType.LIQUID_INLET,
      label: 'Tube Inlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_OUTLET],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'tube-outlet',
      type: 'source',
      position: Position.Bottom,
      handleType: HandleType.LIQUID_OUTLET,
      label: 'Tube Outlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_INLET]
      }
    }
  ],

  'heat-exchanger-plate': [
    {
      id: 'hot-inlet',
      type: 'target',
      position: Position.Left,
      handleType: HandleType.LIQUID_INLET,
      label: 'Hot Inlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_OUTLET],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'hot-outlet',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.LIQUID_OUTLET,
      label: 'Hot Outlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_INLET]
      }
    },
    {
      id: 'cold-inlet',
      type: 'target',
      position: Position.Bottom,
      handleType: HandleType.LIQUID_INLET,
      label: 'Cold Inlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_OUTLET],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'cold-outlet',
      type: 'source',
      position: Position.Top,
      handleType: HandleType.LIQUID_OUTLET,
      label: 'Cold Outlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_INLET]
      }
    }
  ],

  'heat-exchanger-air-cooler': [
    {
      id: 'inlet',
      type: 'target',
      position: Position.Left,
      handleType: HandleType.LIQUID_INLET,
      label: 'Inlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_OUTLET],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'outlet',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.LIQUID_OUTLET,
      label: 'Outlet',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_INLET]
      }
    },
    {
      id: 'fan-power',
      type: 'target',
      position: Position.Top,
      handleType: HandleType.ELECTRICAL_INPUT,
      label: 'Fan Power',
      constraints: {
        compatibleTypes: [HandleType.ELECTRICAL_OUTPUT],
        maxConnections: 1
      }
    }
  ],

  // Compressor configurations
  'compressor-centrifugal': [
    {
      id: 'suction',
      type: 'target',
      position: Position.Left,
      handleType: HandleType.GAS_INLET,
      label: 'Suction',
      constraints: {
        compatibleTypes: [HandleType.GAS_OUTLET],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'discharge',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.GAS_OUTLET,
      label: 'Discharge',
      constraints: {
        compatibleTypes: [HandleType.GAS_INLET],
        required: true
      }
    },
    {
      id: 'power',
      type: 'target',
      position: Position.Bottom,
      handleType: HandleType.ELECTRICAL_INPUT,
      label: 'Power',
      constraints: {
        compatibleTypes: [HandleType.ELECTRICAL_OUTPUT],
        maxConnections: 1
      }
    }
  ],

  'compressor-reciprocating': [
    {
      id: 'suction',
      type: 'target',
      position: Position.Left,
      handleType: HandleType.GAS_INLET,
      label: 'Suction',
      constraints: {
        compatibleTypes: [HandleType.GAS_OUTLET],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'discharge',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.GAS_OUTLET,
      label: 'Discharge',
      constraints: {
        compatibleTypes: [HandleType.GAS_INLET],
        required: true
      }
    },
    {
      id: 'power',
      type: 'target',
      position: Position.Bottom,
      handleType: HandleType.ELECTRICAL_INPUT,
      label: 'Power',
      constraints: {
        compatibleTypes: [HandleType.ELECTRICAL_OUTPUT],
        maxConnections: 1
      }
    }
  ],

  'compressor-screw': [
    {
      id: 'suction',
      type: 'target',
      position: Position.Left,
      handleType: HandleType.GAS_INLET,
      label: 'Suction',
      constraints: {
        compatibleTypes: [HandleType.GAS_OUTLET],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'discharge',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.GAS_OUTLET,
      label: 'Discharge',
      constraints: {
        compatibleTypes: [HandleType.GAS_INLET],
        required: true
      }
    },
    {
      id: 'power',
      type: 'target',
      position: Position.Bottom,
      handleType: HandleType.ELECTRICAL_INPUT,
      label: 'Power',
      constraints: {
        compatibleTypes: [HandleType.ELECTRICAL_OUTPUT],
        maxConnections: 1
      }
    }
  ],

  // Instrumentation configurations
  'sensor-pressure': [
    {
      id: 'process',
      type: 'target',
      position: Position.Bottom,
      handleType: HandleType.LIQUID_INLET,
      label: 'Process Connection',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_OUTLET],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'signal',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.SIGNAL_OUTPUT,
      label: 'Signal',
      constraints: {
        compatibleTypes: [HandleType.SIGNAL_INPUT]
      }
    }
  ],

  'sensor-temperature': [
    {
      id: 'process',
      type: 'target',
      position: Position.Bottom,
      handleType: HandleType.LIQUID_INLET,
      label: 'Process Connection',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_OUTLET],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'signal',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.SIGNAL_OUTPUT,
      label: 'Signal',
      constraints: {
        compatibleTypes: [HandleType.SIGNAL_INPUT]
      }
    }
  ],

  'sensor-flow': [
    {
      id: 'process',
      type: 'target',
      position: Position.Bottom,
      handleType: HandleType.LIQUID_INLET,
      label: 'Process Connection',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_OUTLET],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'signal',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.SIGNAL_OUTPUT,
      label: 'Signal',
      constraints: {
        compatibleTypes: [HandleType.SIGNAL_INPUT]
      }
    }
  ],

  'sensor-level': [
    {
      id: 'process',
      type: 'target',
      position: Position.Bottom,
      handleType: HandleType.LIQUID_INLET,
      label: 'Process Connection',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_OUTLET],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'signal',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.SIGNAL_OUTPUT,
      label: 'Signal',
      constraints: {
        compatibleTypes: [HandleType.SIGNAL_INPUT]
      }
    }
  ],

  'sensor-ph': [
    {
      id: 'process',
      type: 'target',
      position: Position.Bottom,
      handleType: HandleType.LIQUID_INLET,
      label: 'Process Connection',
      constraints: {
        compatibleTypes: [HandleType.LIQUID_OUTLET],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'signal',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.SIGNAL_OUTPUT,
      label: 'Signal',
      constraints: {
        compatibleTypes: [HandleType.SIGNAL_INPUT]
      }
    }
  ],

  // Add default configurations for remaining node types
  'transmitter-4-20ma': [...NODE_HANDLE_CONFIGS['sensor-pressure']],
  'transmitter-digital': [...NODE_HANDLE_CONFIGS['sensor-pressure']],
  'transmitter-wireless': [...NODE_HANDLE_CONFIGS['sensor-pressure']],
  'controller-pid': [
    {
      id: 'input',
      type: 'target',
      position: Position.Left,
      handleType: HandleType.SIGNAL_INPUT,
      label: 'Process Variable',
      constraints: {
        compatibleTypes: [HandleType.SIGNAL_OUTPUT],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'output',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.CONTROL_OUTPUT,
      label: 'Control Output',
      constraints: {
        compatibleTypes: [HandleType.CONTROL_INPUT]
      }
    },
    {
      id: 'setpoint',
      type: 'target',
      position: Position.Top,
      handleType: HandleType.SIGNAL_INPUT,
      label: 'Setpoint',
      constraints: {
        compatibleTypes: [HandleType.SIGNAL_OUTPUT],
        maxConnections: 1
      }
    }
  ],
  'controller-on-off': [...NODE_HANDLE_CONFIGS['controller-pid']],
  'controller-cascade': [...NODE_HANDLE_CONFIGS['controller-pid']],
  'indicator-local': [...NODE_HANDLE_CONFIGS['sensor-pressure']],
  'indicator-remote': [...NODE_HANDLE_CONFIGS['sensor-pressure']],
  'indicator-digital': [...NODE_HANDLE_CONFIGS['sensor-pressure']],
  'final-control-valve': [...NODE_HANDLE_CONFIGS['valve-control']],
  'final-control-vfd': [
    {
      id: 'control',
      type: 'target',
      position: Position.Left,
      handleType: HandleType.CONTROL_INPUT,
      label: 'Control Signal',
      constraints: {
        compatibleTypes: [HandleType.CONTROL_OUTPUT],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'power-in',
      type: 'target',
      position: Position.Top,
      handleType: HandleType.ELECTRICAL_INPUT,
      label: 'Power Input',
      constraints: {
        compatibleTypes: [HandleType.ELECTRICAL_OUTPUT],
        maxConnections: 1,
        required: true
      }
    },
    {
      id: 'motor',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.ELECTRICAL_OUTPUT,
      label: 'Motor Output',
      constraints: {
        compatibleTypes: [HandleType.ELECTRICAL_INPUT]
      }
    }
  ],

  // Piping and fittings - simplified for demonstration
  'fitting-elbow': [
    {
      id: 'inlet',
      type: 'target',
      position: Position.Left,
      handleType: HandleType.LIQUID_INLET,
      constraints: { compatibleTypes: [HandleType.LIQUID_OUTLET], maxConnections: 1, required: true }
    },
    {
      id: 'outlet',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.LIQUID_OUTLET,
      constraints: { compatibleTypes: [HandleType.LIQUID_INLET] }
    }
  ],
  'fitting-tee': [
    {
      id: 'inlet',
      type: 'target',
      position: Position.Left,
      handleType: HandleType.LIQUID_INLET,
      constraints: { compatibleTypes: [HandleType.LIQUID_OUTLET], maxConnections: 1, required: true }
    },
    {
      id: 'outlet',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.LIQUID_OUTLET,
      constraints: { compatibleTypes: [HandleType.LIQUID_INLET] }
    },
    {
      id: 'branch',
      type: 'source',
      position: Position.Top,
      handleType: HandleType.LIQUID_OUTLET,
      constraints: { compatibleTypes: [HandleType.LIQUID_INLET] }
    }
  ],
  'fitting-reducer': [...NODE_HANDLE_CONFIGS['fitting-elbow']],
  'fitting-coupling': [...NODE_HANDLE_CONFIGS['fitting-elbow']],
  'specialty-strainer': [...NODE_HANDLE_CONFIGS['fitting-elbow']],
  'specialty-orifice-plate': [...NODE_HANDLE_CONFIGS['fitting-elbow']],
  'specialty-rupture-disc': [...NODE_HANDLE_CONFIGS['fitting-elbow']],
  'pipe-segment': [...NODE_HANDLE_CONFIGS['fitting-elbow']],
  'connection-point': [
    {
      id: 'connection',
      type: 'target',
      position: Position.Left,
      handleType: HandleType.LIQUID_INLET,
      constraints: { compatibleTypes: [HandleType.LIQUID_OUTLET, HandleType.GAS_OUTLET] }
    }
  ],
  'connection-terminal': [...NODE_HANDLE_CONFIGS['connection-point']],
  'electrical-motor': [
    {
      id: 'power',
      type: 'target',
      position: Position.Top,
      handleType: HandleType.ELECTRICAL_INPUT,
      constraints: { compatibleTypes: [HandleType.ELECTRICAL_OUTPUT], maxConnections: 1, required: true }
    },
    {
      id: 'shaft',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.LIQUID_OUTLET,
      constraints: { compatibleTypes: [HandleType.LIQUID_INLET] }
    }
  ],
  'electrical-junction-box': [
    {
      id: 'input',
      type: 'target',
      position: Position.Left,
      handleType: HandleType.ELECTRICAL_INPUT,
      constraints: { compatibleTypes: [HandleType.ELECTRICAL_OUTPUT] }
    },
    {
      id: 'output',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.ELECTRICAL_OUTPUT,
      constraints: { compatibleTypes: [HandleType.ELECTRICAL_INPUT] }
    }
  ],
  'electrical-panel': [...NODE_HANDLE_CONFIGS['electrical-junction-box']],
  'safety-emergency-stop': [
    {
      id: 'signal',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.SIGNAL_OUTPUT,
      constraints: { compatibleTypes: [HandleType.SIGNAL_INPUT] }
    }
  ],
  'safety-alarm': [...NODE_HANDLE_CONFIGS['safety-emergency-stop']],
  'safety-interlock': [...NODE_HANDLE_CONFIGS['safety-emergency-stop']],
  'utility-steam': [
    {
      id: 'steam',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.STEAM_OUTLET,
      constraints: { compatibleTypes: [HandleType.STEAM_INLET] }
    }
  ],
  'utility-air': [
    {
      id: 'air',
      type: 'source',
      position: Position.Right,
      handleType: HandleType.GAS_OUTLET,
      constraints: { compatibleTypes: [HandleType.GAS_INLET] }
    }
  ],
  'utility-nitrogen': [...NODE_HANDLE_CONFIGS['utility-air']],
  'utility-drain': [
    {
      id: 'drain',
      type: 'target',
      position: Position.Top,
      handleType: HandleType.DRAIN,
      constraints: { compatibleTypes: [HandleType.LIQUID_OUTLET] }
    }
  ]
};

/**
 * Smart Connection Manager Class
 */
export class SmartConnectionManager {
  /**
   * Get handles for a specific node type
   */
  static getNodeHandles(nodeType: PIDNodeType): NodeHandle[] {
    return NODE_HANDLE_CONFIGS[nodeType] || [];
  }

  /**
   * Check if two handle types are compatible for connection
   */
  static areHandlesCompatible(sourceType: HandleType, targetType: HandleType): boolean {
    return CONNECTION_COMPATIBILITY[sourceType]?.includes(targetType) || false;
  }

  /**
   * Get compatible handle types for a given handle type
   */
  static getCompatibleHandles(handleType: HandleType): HandleType[] {
    return CONNECTION_COMPATIBILITY[handleType] || [];
  }

  /**
   * Validate a proposed connection
   */
  static validateConnection(
    sourceNodeType: PIDNodeType,
    sourceHandleId: string,
    targetNodeType: PIDNodeType,
    targetHandleId: string
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const sourceHandles = this.getNodeHandles(sourceNodeType);
    const targetHandles = this.getNodeHandles(targetNodeType);

    const sourceHandle = sourceHandles.find(h => h.id === sourceHandleId);
    const targetHandle = targetHandles.find(h => h.id === targetHandleId);

    if (!sourceHandle) {
      errors.push(`Source handle '${sourceHandleId}' not found on ${sourceNodeType}`);
    }

    if (!targetHandle) {
      errors.push(`Target handle '${targetHandleId}' not found on ${targetNodeType}`);
    }

    if (sourceHandle && targetHandle) {
      // Check type compatibility
      if (!this.areHandlesCompatible(sourceHandle.handleType, targetHandle.handleType)) {
        errors.push(`Incompatible connection: ${sourceHandle.handleType} cannot connect to ${targetHandle.handleType}`);
      }

      // Check engineering logic
      if (sourceHandle.type === targetHandle.type) {
        errors.push('Cannot connect source to source or target to target');
      }

      // Check for same node connection
      if (sourceNodeType === targetNodeType) {
        warnings.push('Connecting to same component type - verify this is intended');
      }

      // Specific engineering validations
      if (sourceHandle.handleType === HandleType.LIQUID_OUTLET &&
          targetHandle.handleType === HandleType.GAS_INLET) {
        warnings.push('Connecting liquid output to gas input - verify phase compatibility');
      }

      if (sourceHandle.handleType === HandleType.ELECTRICAL_OUTPUT &&
          targetHandle.handleType === HandleType.CONTROL_INPUT) {
        warnings.push('Direct electrical to control connection - consider using appropriate interface');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get suggested connections for a handle
   */
  static getSuggestedConnections(
    nodeType: PIDNodeType,
    handleId: string,
    availableNodes: Array<{ type: PIDNodeType; id: string }>
  ): Array<{ nodeId: string; handleId: string; compatibility: number }> {
    const handles = this.getNodeHandles(nodeType);
    const handle = handles.find(h => h.id === handleId);

    if (!handle) return [];

    const suggestions: Array<{ nodeId: string; handleId: string; compatibility: number }> = [];

    availableNodes.forEach(node => {
      const nodeHandles = this.getNodeHandles(node.type);

      nodeHandles.forEach(nodeHandle => {
        if (this.areHandlesCompatible(handle.handleType, nodeHandle.handleType)) {
          // Calculate compatibility score
          let compatibility = 100;

          // Exact type match gets highest score
          if (handle.handleType === nodeHandle.handleType) {
            compatibility = 100;
          }
          // Compatible types get lower score
          else if (this.areHandlesCompatible(handle.handleType, nodeHandle.handleType)) {
            compatibility = 80;
          }

          // Boost score for logical engineering connections
          if (this.isLogicalConnection(nodeType, node.type, handle.handleType)) {
            compatibility += 20;
          }

          suggestions.push({
            nodeId: node.id,
            handleId: nodeHandle.id,
            compatibility: Math.min(compatibility, 100)
          });
        }
      });
    });

    return suggestions.sort((a, b) => b.compatibility - a.compatibility);
  }

  /**
   * Check if a connection is logically sound from engineering perspective
   */
  private static isLogicalConnection(
    sourceType: PIDNodeType,
    targetType: PIDNodeType,
    handleType: HandleType
  ): boolean {
    // Pump to valve connections are common
    if (sourceType.includes('pump') && targetType.includes('valve')) {
      return true;
    }

    // Tank to pump connections are common
    if (sourceType.includes('tank') && targetType.includes('pump')) {
      return true;
    }

    // Sensor to controller connections
    if (sourceType.includes('sensor') && targetType.includes('controller')) {
      return handleType === HandleType.SIGNAL_OUTPUT;
    }

    // Controller to final control element
    if (sourceType.includes('controller') && targetType.includes('final-control')) {
      return handleType === HandleType.CONTROL_OUTPUT;
    }

    return false;
  }

  /**
   * Get handle style based on type and state
   */
  static getHandleStyle(
    handleType: HandleType,
    isConnected: boolean = false,
    isHovered: boolean = false
  ): React.CSSProperties {
    const baseColor = HANDLE_COLORS[handleType] || '#64748b';

    return {
      backgroundColor: isConnected ? baseColor : '#ffffff',
      borderColor: baseColor,
      borderWidth: '2px',
      borderStyle: 'solid',
      width: isHovered ? '12px' : '8px',
      height: isHovered ? '12px' : '8px',
      borderRadius: '50%',
      transition: 'all 0.2s ease-in-out',
      boxShadow: isHovered ? `0 2px 8px ${baseColor}40` : 'none',
      zIndex: 10
    };
  }
}

/**
 * React hook for using smart connections
 */
export function useSmartConnections(nodeType: PIDNodeType) {
  const handles = useMemo(() => {
    return SmartConnectionManager.getNodeHandles(nodeType);
  }, [nodeType]);

  const validateConnection = useCallback((
    sourceHandleId: string,
    targetNodeType: PIDNodeType,
    targetHandleId: string
  ) => {
    return SmartConnectionManager.validateConnection(
      nodeType,
      sourceHandleId,
      targetNodeType,
      targetHandleId
    );
  }, [nodeType]);

  const getSuggestions = useCallback((
    handleId: string,
    availableNodes: Array<{ type: PIDNodeType; id: string }>
  ) => {
    return SmartConnectionManager.getSuggestedConnections(nodeType, handleId, availableNodes);
  }, [nodeType]);

  return {
    handles,
    validateConnection,
    getSuggestions
  };
}

export default SmartConnectionManager;