/**
 * Comprehensive P&ID Node Type Definitions
 * Following ISA-5.1, ISO 14617, and UK water industry standards
 */

import { Node, Position } from 'reactflow';

// Base P&ID Node Interface
export interface PIDNode extends Node {
  type: PIDNodeType;
  data: PIDNodeData;
}

// Core P&ID Node Types
export type PIDNodeType =
  // Equipment Nodes
  | 'pump-centrifugal'
  | 'pump-positive-displacement'
  | 'pump-submersible'
  | 'valve-gate'
  | 'valve-ball'
  | 'valve-butterfly'
  | 'valve-check'
  | 'valve-relief'
  | 'valve-control'
  | 'tank-storage'
  | 'tank-process'
  | 'tank-pressure-vessel'
  | 'heat-exchanger-shell-tube'
  | 'heat-exchanger-plate'
  | 'heat-exchanger-air-cooler'
  | 'compressor-centrifugal'
  | 'compressor-reciprocating'
  | 'compressor-screw'

  // Instrumentation Nodes
  | 'sensor-pressure'
  | 'sensor-temperature'
  | 'sensor-flow'
  | 'sensor-level'
  | 'sensor-ph'
  | 'transmitter-4-20ma'
  | 'transmitter-digital'
  | 'transmitter-wireless'
  | 'controller-pid'
  | 'controller-on-off'
  | 'controller-cascade'
  | 'indicator-local'
  | 'indicator-remote'
  | 'indicator-digital'
  | 'final-control-valve'
  | 'final-control-vfd'

  // Piping Components
  | 'fitting-elbow'
  | 'fitting-tee'
  | 'fitting-reducer'
  | 'fitting-coupling'
  | 'specialty-strainer'
  | 'specialty-orifice-plate'
  | 'specialty-rupture-disc'
  | 'pipe-segment'
  | 'connection-point'
  | 'connection-terminal'

  // Support Elements
  | 'electrical-motor'
  | 'electrical-junction-box'
  | 'electrical-panel'
  | 'safety-emergency-stop'
  | 'safety-alarm'
  | 'safety-interlock'
  | 'utility-steam'
  | 'utility-air'
  | 'utility-nitrogen'
  | 'utility-drain';

// Node Visual States
export enum NodeVisualState {
  NORMAL = 'normal',
  ALARM = 'alarm',
  WARNING = 'warning',
  ERROR = 'error',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  SELECTED = 'selected',
  HIGHLIGHTED = 'highlighted'
}

// Node Rotation States
export enum NodeRotation {
  DEGREE_0 = 0,
  DEGREE_90 = 90,
  DEGREE_180 = 180,
  DEGREE_270 = 270
}

// Connection Handle Types
export enum HandleType {
  LIQUID_INLET = 'liquid-inlet',
  LIQUID_OUTLET = 'liquid-outlet',
  GAS_INLET = 'gas-inlet',
  GAS_OUTLET = 'gas-outlet',
  STEAM_INLET = 'steam-inlet',
  STEAM_OUTLET = 'steam-outlet',
  ELECTRICAL_INPUT = 'electrical-input',
  ELECTRICAL_OUTPUT = 'electrical-output',
  SIGNAL_INPUT = 'signal-input',
  SIGNAL_OUTPUT = 'signal-output',
  CONTROL_INPUT = 'control-input',
  CONTROL_OUTPUT = 'control-output',
  DRAIN = 'drain',
  VENT = 'vent',
  OVERFLOW = 'overflow',
  BYPASS = 'bypass'
}

// Connection Handle Definition
export interface NodeHandle {
  id: string;
  type: 'source' | 'target';
  position: Position;
  handleType: HandleType;
  label?: string;
  constraints?: {
    compatibleTypes: HandleType[];
    maxConnections?: number;
    required?: boolean;
  };
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    shape?: 'circle' | 'square' | 'triangle';
  };
}

// Node Property Definitions
export interface NodeProperty {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date' | 'color';
  defaultValue?: any;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: Array<{ value: any; label: string }>;
  };
  unit?: string;
  category?: string;
  description?: string;
  readonly?: boolean;
}

// Base Node Data Interface
export interface PIDNodeData {
  // Identification
  label: string;
  tagNumber?: string;
  description?: string;

  // Visual properties
  visualState: NodeVisualState;
  rotation: NodeRotation;
  mirrored?: boolean;
  scale?: number;
  opacity?: number;

  // Physical properties (vary by node type)
  properties: Record<string, any>;

  // Engineering properties
  specifications?: {
    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    installationDate?: string;
    lastMaintenance?: string;
    nextMaintenance?: string;
  };

  // Process properties
  process?: {
    medium?: string;
    pressure?: number;
    pressureUnit?: string;
    temperature?: number;
    temperatureUnit?: string;
    flow?: number;
    flowUnit?: string;
    density?: number;
    viscosity?: number;
  };

  // Control and instrumentation
  control?: {
    setpoint?: number;
    setpointUnit?: string;
    range?: { min: number; max: number };
    accuracy?: number;
    deadband?: number;
    responseTime?: number;
  };

  // Layer and organization
  layer?: string;
  locked?: boolean;
  visible?: boolean;

  // Collaboration and versioning
  createdBy?: string;
  createdAt?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  version?: number;

  // Custom metadata
  metadata?: Record<string, any>;

  // Validation and errors
  validation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };

  // Templates and variants
  templateId?: string;
  variantId?: string;

  // Connection constraints
  connectionConstraints?: {
    maxInlets?: number;
    maxOutlets?: number;
    requiredConnections?: string[];
    incompatibleNodes?: PIDNodeType[];
  };
}

// Node Category Definitions
export enum NodeCategory {
  EQUIPMENT = 'equipment',
  INSTRUMENTATION = 'instrumentation',
  PIPING = 'piping',
  ELECTRICAL = 'electrical',
  SAFETY = 'safety',
  UTILITY = 'utility',
  ANNOTATION = 'annotation'
}

// Node Template Definition
export interface NodeTemplate {
  id: string;
  name: string;
  description: string;
  category: NodeCategory;
  nodeType: PIDNodeType;
  defaultData: Partial<PIDNodeData>;
  properties: NodeProperty[];
  handles: NodeHandle[];
  icon: string;
  previewImage?: string;
  standards: ('ISA-5.1' | 'ISO-14617' | 'UK-Water')[];
  tags: string[];
  version: string;
  author: string;
  organization?: string;
}

// Node Variant Definition
export interface NodeVariant {
  id: string;
  templateId: string;
  name: string;
  description: string;
  modifications: {
    data?: Partial<PIDNodeData>;
    properties?: Partial<Record<string, any>>;
    handles?: NodeHandle[];
    visual?: {
      symbol?: string;
      color?: string;
      size?: { width: number; height: number };
    };
  };
  previewImage?: string;
  tags: string[];
}

// Level of Detail Configuration
export interface NodeLODConfig {
  minZoom: number;
  maxZoom: number;
  simplified: boolean;
  showLabel: boolean;
  showProperties: boolean;
  showHandles: boolean;
  showDetails: boolean;
  symbolComplexity: 'minimal' | 'basic' | 'detailed' | 'full';
}

// Node Validation Rules
export interface NodeValidationRule {
  id: string;
  name: string;
  description: string;
  nodeTypes: PIDNodeType[];
  category: 'required' | 'warning' | 'info';
  validator: (node: PIDNode, context: ValidationContext) => ValidationResult;
}

export interface ValidationContext {
  allNodes: PIDNode[];
  connectedNodes: PIDNode[];
  incomingEdges: any[];
  outgoingEdges: any[];
  project: any;
  standards: string[];
}

export interface ValidationResult {
  isValid: boolean;
  messages: {
    type: 'error' | 'warning' | 'info';
    message: string;
    property?: string;
  }[];
}

// Symbol Definition
export interface NodeSymbol {
  id: string;
  name: string;
  nodeType: PIDNodeType;
  standard: 'ISA-5.1' | 'ISO-14617' | 'UK-Water';
  svg: string;
  viewBox: string;
  defaultSize: { width: number; height: number };
  connectionPoints: Array<{
    id: string;
    x: number;
    y: number;
    type: HandleType;
  }>;
  rotatable: boolean;
  mirrorable: boolean;
  scalable: boolean;
  version: string;
}

// Node Factory Configuration
export interface NodeFactoryConfig {
  type: PIDNodeType;
  template: NodeTemplate;
  defaultData: PIDNodeData;
  symbol: NodeSymbol;
  validation: NodeValidationRule[];
  levelOfDetail: NodeLODConfig[];
}

// Export utility types
export type NodePropertyValue = string | number | boolean | Date | Array<any>;
export type NodePropertySet = Record<string, NodePropertyValue>;

// Node event types for collaboration
export interface NodeEvent {
  type: 'create' | 'update' | 'delete' | 'move' | 'rotate' | 'connect' | 'disconnect';
  nodeId: string;
  userId: string;
  timestamp: number;
  data: any;
}

// Node performance metrics
export interface NodePerformanceMetrics {
  renderTime: number;
  updateTime: number;
  connectionTime: number;
  validationTime: number;
  memoryUsage: number;
}

// Node accessibility features
export interface NodeAccessibility {
  ariaLabel: string;
  ariaDescription?: string;
  tabIndex?: number;
  role?: string;
  focusable: boolean;
  keyboardShortcuts?: Array<{
    key: string;
    action: string;
    description: string;
  }>;
}

// Equipment-specific property interfaces
export interface PumpProperties extends PIDNodeData {
  properties: {
    type: 'centrifugal' | 'positive-displacement' | 'submersible';
    capacity: number;
    capacityUnit: string;
    head: number;
    headUnit: string;
    efficiency: number;
    powerRating: number;
    powerUnit: string;
    speed: number;
    speedUnit: string;
    impellerDiameter: number;
    suctionSize: number;
    dischargeSize: number;
    connectionType: string;
    material: string;
    motorType?: string;
    driveCoupling?: string;
    baseplate?: boolean;
    [key: string]: any;
  };
}

export interface ValveProperties extends PIDNodeData {
  properties: {
    type: 'gate' | 'ball' | 'butterfly' | 'check' | 'relief' | 'control';
    size: number;
    sizeUnit: string;
    pressureRating: number;
    pressureUnit: string;
    endConnections: string;
    bodyMaterial: string;
    seatMaterial: string;
    stemMaterial: string;
    operation: 'manual' | 'electric' | 'pneumatic' | 'hydraulic';
    position: 'open' | 'closed' | 'partial';
    cvValue?: number;
    leakageClass?: string;
    failSafe?: 'open' | 'closed' | 'last-position';
    actuatorType?: string;
    [key: string]: any;
  };
}

export interface TankProperties extends PIDNodeData {
  properties: {
    type: 'storage' | 'process' | 'pressure-vessel';
    volume: number;
    volumeUnit: string;
    diameter: number;
    height: number;
    wallThickness: number;
    material: string;
    designPressure: number;
    designTemperature: number;
    corrosionAllowance: number;
    insulationType?: string;
    heatingSystem?: string;
    agitationType?: string;
    venting?: boolean;
    drainageSize?: number;
    manholes?: number;
    nozzles?: Array<{
      size: number;
      elevation: number;
      orientation: string;
      purpose: string;
    }>;
    [key: string]: any;
  };
}

export interface InstrumentProperties extends PIDNodeData {
  properties: {
    type: 'sensor' | 'transmitter' | 'controller' | 'indicator';
    measurementType: 'pressure' | 'temperature' | 'flow' | 'level' | 'ph' | 'conductivity';
    range: { min: number; max: number };
    rangeUnit: string;
    accuracy: number;
    precision: number;
    outputSignal: '4-20mA' | 'digital' | 'wireless' | 'pneumatic';
    powerSupply: string;
    processConnection: string;
    housing: 'field' | 'panel' | 'remote';
    explosionProof?: boolean;
    intrinsicallySafe?: boolean;
    certification?: string[];
    calibrationDate?: string;
    calibrationDue?: string;
    [key: string]: any;
  };
}

// Constants for default configurations
export const DEFAULT_NODE_SIZE = { width: 60, height: 40 };
export const DEFAULT_HANDLE_SIZE = { width: 8, height: 8 };
export const DEFAULT_ZOOM_THRESHOLDS = [0.1, 0.5, 1.0, 2.0, 5.0];

// Color schemes for different visual states
export const NODE_STATE_COLORS = {
  [NodeVisualState.NORMAL]: {
    background: '#f8fafc',
    border: '#64748b',
    text: '#1e293b'
  },
  [NodeVisualState.ALARM]: {
    background: '#fef2f2',
    border: '#dc2626',
    text: '#991b1b'
  },
  [NodeVisualState.WARNING]: {
    background: '#fffbeb',
    border: '#d97706',
    text: '#92400e'
  },
  [NodeVisualState.ERROR]: {
    background: '#fdf2f8',
    border: '#be185d',
    text: '#831843'
  },
  [NodeVisualState.OFFLINE]: {
    background: '#f1f5f9',
    border: '#94a3b8',
    text: '#475569'
  },
  [NodeVisualState.MAINTENANCE]: {
    background: '#eff6ff',
    border: '#2563eb',
    text: '#1d4ed8'
  }
};

// Handle color schemes by type
export const HANDLE_COLORS = {
  [HandleType.LIQUID_INLET]: '#3b82f6',
  [HandleType.LIQUID_OUTLET]: '#3b82f6',
  [HandleType.GAS_INLET]: '#10b981',
  [HandleType.GAS_OUTLET]: '#10b981',
  [HandleType.STEAM_INLET]: '#f59e0b',
  [HandleType.STEAM_OUTLET]: '#f59e0b',
  [HandleType.ELECTRICAL_INPUT]: '#8b5cf6',
  [HandleType.ELECTRICAL_OUTPUT]: '#8b5cf6',
  [HandleType.SIGNAL_INPUT]: '#ef4444',
  [HandleType.SIGNAL_OUTPUT]: '#ef4444',
  [HandleType.CONTROL_INPUT]: '#06b6d4',
  [HandleType.CONTROL_OUTPUT]: '#06b6d4'
};