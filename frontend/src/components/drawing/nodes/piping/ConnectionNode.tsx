'use client';

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from '../base/BaseNode';
import { PIDNodeData, NodeVisualState } from '@/types/nodes';

interface ConnectionProperties extends PIDNodeData {
  properties: {
    connectionType: 'point' | 'terminal' | 'junction' | 'branch' | 'continuation';
    size?: number;
    sizeUnit?: string;
    medium?: string;
    pressure?: number;
    pressureUnit?: string;
    temperature?: number;
    temperatureUnit?: string;
    flowDirection?: 'in' | 'out' | 'bidirectional';

    // Connection point specific
    connectionNumber?: string;
    toDrawing?: string;
    fromDrawing?: string;

    // Terminal specific
    terminalType?: 'boundary' | 'utility' | 'vent' | 'drain' | 'sample';
    elevation?: number;
    elevationUnit?: string;

    // Junction specific
    mainLine?: string;
    branchLines?: string[];

    [key: string]: any;
  };
}

interface ConnectionNodeProps extends NodeProps<ConnectionProperties> {
  onPropertyChange?: (nodeId: string, properties: Record<string, any>) => void;
  onValidationChange?: (nodeId: string, isValid: boolean, errors: string[]) => void;
  onStateChange?: (nodeId: string, state: NodeVisualState) => void;
}

export const ConnectionNode: React.FC<ConnectionNodeProps> = memo((props) => {
  const { data, id } = props;

  // Connection-specific validation
  const validateConnectionData = (connectionData: ConnectionProperties): string[] => {
    const errors: string[] = [];

    // Connection type validation
    const validConnectionTypes = ['point', 'terminal', 'junction', 'branch', 'continuation'];
    if (!validConnectionTypes.includes(connectionData.properties.connectionType)) {
      errors.push('Invalid connection type');
    }

    // Connection point specific validations
    if (connectionData.properties.connectionType === 'point') {
      if (!connectionData.properties.connectionNumber?.trim()) {
        errors.push('Connection number must be specified for connection points');
      }

      if (!connectionData.properties.toDrawing?.trim() && !connectionData.properties.fromDrawing?.trim()) {
        errors.push('Either destination or source drawing must be specified');
      }

      // Connection number format validation
      if (connectionData.properties.connectionNumber &&
          !/^[A-Z0-9]{1,3}-\d{2,3}$/.test(connectionData.properties.connectionNumber)) {
        errors.push('Connection number format should be XXX-123 (e.g., P-001, ST-015)');
      }
    }

    // Terminal specific validations
    if (connectionData.properties.connectionType === 'terminal') {
      const validTerminalTypes = ['boundary', 'utility', 'vent', 'drain', 'sample'];
      if (!connectionData.properties.terminalType ||
          !validTerminalTypes.includes(connectionData.properties.terminalType)) {
        errors.push('Invalid terminal type');
      }

      // Elevation validation for drain/vent terminals
      if (['vent', 'drain'].includes(connectionData.properties.terminalType) &&
          connectionData.properties.elevation === undefined) {
        errors.push('Elevation must be specified for vent and drain terminals');
      }
    }

    // Junction specific validations
    if (connectionData.properties.connectionType === 'junction') {
      if (!connectionData.properties.mainLine?.trim()) {
        errors.push('Main line must be specified for junctions');
      }

      if (!connectionData.properties.branchLines || connectionData.properties.branchLines.length === 0) {
        errors.push('At least one branch line must be specified for junctions');
      }

      if (connectionData.properties.branchLines && connectionData.properties.branchLines.length > 4) {
        errors.push('Maximum 4 branch lines allowed for practical junction design');
      }
    }

    // Size validation (if applicable)
    if (connectionData.properties.size !== undefined) {
      if (connectionData.properties.size <= 0) {
        errors.push('Size must be greater than 0');
      }

      if (!connectionData.properties.sizeUnit?.trim()) {
        errors.push('Size unit must be specified when size is provided');
      }
    }

    // Pressure validation
    if (connectionData.properties.pressure !== undefined) {
      if (connectionData.properties.pressure < 0) {
        errors.push('Pressure cannot be negative (use gauge pressure)');
      }

      if (!connectionData.properties.pressureUnit?.trim()) {
        errors.push('Pressure unit must be specified when pressure is provided');
      }
    }

    // Temperature validation
    if (connectionData.properties.temperature !== undefined) {
      if (connectionData.properties.temperature < -273) {
        errors.push('Temperature cannot be below absolute zero');
      }

      if (!connectionData.properties.temperatureUnit?.trim()) {
        errors.push('Temperature unit must be specified when temperature is provided');
      }
    }

    // Flow direction validation
    if (connectionData.properties.flowDirection) {
      const validFlowDirections = ['in', 'out', 'bidirectional'];
      if (!validFlowDirections.includes(connectionData.properties.flowDirection)) {
        errors.push('Invalid flow direction');
      }
    }

    // Utility terminal specific validations
    if (connectionData.properties.terminalType === 'utility') {
      if (!connectionData.properties.medium?.trim()) {
        errors.push('Medium must be specified for utility terminals');
      }

      const utilityMedia = ['steam', 'compressed air', 'nitrogen', 'cooling water', 'chilled water', 'electrical'];
      if (connectionData.properties.medium &&
          !utilityMedia.some(media => connectionData.properties.medium.toLowerCase().includes(media))) {
        errors.push('Unrecognized utility medium');
      }
    }

    // Elevation validation
    if (connectionData.properties.elevation !== undefined) {
      if (!connectionData.properties.elevationUnit?.trim()) {
        errors.push('Elevation unit must be specified when elevation is provided');
      }
    }

    return errors;
  };

  // Enhanced validation callback
  const handleValidationChange = (nodeId: string, isValid: boolean, errors: string[]) => {
    const connectionErrors = validateConnectionData(data);
    const allErrors = [...errors, ...connectionErrors];
    const finalIsValid = allErrors.length === 0;

    props.onValidationChange?.(nodeId, finalIsValid, allErrors);
  };

  // Enhanced property change callback
  const handlePropertyChange = (nodeId: string, properties: Record<string, any>) => {
    const updatedProperties = { ...properties };

    // Set type-specific defaults
    switch (properties.connectionType) {
      case 'point':
        setConnectionPointDefaults(updatedProperties, properties);
        break;
      case 'terminal':
        setTerminalDefaults(updatedProperties, properties);
        break;
      case 'junction':
        setJunctionDefaults(updatedProperties, properties);
        break;
      case 'branch':
        setBranchDefaults(updatedProperties, properties);
        break;
      case 'continuation':
        setContinuationDefaults(updatedProperties, properties);
        break;
    }

    // Set default units
    if (properties.size && !properties.sizeUnit) {
      updatedProperties.sizeUnit = 'inch';
    }

    if (properties.pressure && !properties.pressureUnit) {
      updatedProperties.pressureUnit = 'bar';
    }

    if (properties.temperature && !properties.temperatureUnit) {
      updatedProperties.temperatureUnit = '°C';
    }

    if (properties.elevation && !properties.elevationUnit) {
      updatedProperties.elevationUnit = 'm';
    }

    // Set default flow direction based on connection type
    if (!properties.flowDirection) {
      switch (properties.connectionType) {
        case 'point':
          updatedProperties.flowDirection = 'bidirectional';
          break;
        case 'terminal':
          if (properties.terminalType === 'vent' || properties.terminalType === 'drain') {
            updatedProperties.flowDirection = 'out';
          } else if (properties.terminalType === 'sample') {
            updatedProperties.flowDirection = 'out';
          } else {
            updatedProperties.flowDirection = 'bidirectional';
          }
          break;
        default:
          updatedProperties.flowDirection = 'bidirectional';
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

// Helper functions to set type-specific defaults
function setConnectionPointDefaults(updatedProperties: any, properties: any) {
  if (!properties.connectionNumber) {
    // Generate a default connection number
    const timestamp = Date.now().toString().slice(-3);
    updatedProperties.connectionNumber = `CP-${timestamp}`;
  }

  if (!properties.flowDirection) {
    updatedProperties.flowDirection = 'bidirectional';
  }
}

function setTerminalDefaults(updatedProperties: any, properties: any) {
  if (!properties.terminalType) {
    updatedProperties.terminalType = 'boundary';
  }

  // Set default elevation for vent terminals
  if (properties.terminalType === 'vent' && properties.elevation === undefined) {
    updatedProperties.elevation = 10; // 10m default height
    updatedProperties.elevationUnit = 'm';
  }

  // Set default elevation for drain terminals
  if (properties.terminalType === 'drain' && properties.elevation === undefined) {
    updatedProperties.elevation = 0; // Ground level
    updatedProperties.elevationUnit = 'm';
  }

  // Set default medium for utility terminals
  if (properties.terminalType === 'utility' && !properties.medium) {
    updatedProperties.medium = 'Specify utility type';
  }
}

function setJunctionDefaults(updatedProperties: any, properties: any) {
  if (!properties.mainLine) {
    updatedProperties.mainLine = 'Main Line';
  }

  if (!properties.branchLines) {
    updatedProperties.branchLines = ['Branch 1'];
  }

  if (!properties.flowDirection) {
    updatedProperties.flowDirection = 'bidirectional';
  }
}

function setBranchDefaults(updatedProperties: any, properties: any) {
  if (!properties.branchType) {
    updatedProperties.branchType = 'takeoff';
  }

  if (!properties.branchSize && properties.size) {
    // Default branch size is typically smaller than main
    updatedProperties.branchSize = properties.size * 0.75;
  }
}

function setContinuationDefaults(updatedProperties: any, properties: any) {
  if (!properties.continuationDirection) {
    updatedProperties.continuationDirection = 'horizontal';
  }

  if (!properties.lineNumber) {
    updatedProperties.lineNumber = 'Specify line number';
  }
}

ConnectionNode.displayName = 'ConnectionNode';

export default ConnectionNode;