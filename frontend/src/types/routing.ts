import { Position, XYPosition } from 'reactflow';

// Core routing types and enums
export enum EdgeType {
  PIPE = 'pipe',
  SIGNAL = 'signal',
  ANNOTATION = 'annotation',
  ELECTRICAL = 'electrical',
  PNEUMATIC = 'pneumatic',
  HYDRAULIC = 'hydraulic',
}

export enum PipeType {
  WATER = 'water',
  STEAM = 'steam',
  GAS = 'gas',
  CHEMICAL = 'chemical',
  PROCESS = 'process',
  UTILITY = 'utility',
  DRAINAGE = 'drainage',
  COMPRESSED_AIR = 'compressed_air',
  VACUUM = 'vacuum',
  FUEL = 'fuel',
}

export enum SignalType {
  ANALOG_4_20MA = 'analog_4_20ma',
  DIGITAL = 'digital',
  MODBUS = 'modbus',
  PROFIBUS = 'profibus',
  ETHERNET = 'ethernet',
  WIRELESS = 'wireless',
  FIELDBUS = 'fieldbus',
  HART = 'hart',
  FOUNDATION_FIELDBUS = 'foundation_fieldbus',
}

export enum RoutingAlgorithm {
  ORTHOGONAL = 'orthogonal',
  DIAGONAL = 'diagonal',
  BEZIER = 'bezier',
  STRAIGHT = 'straight',
  CUSTOM = 'custom',
}

export enum FlowDirection {
  FORWARD = 'forward',
  REVERSE = 'reverse',
  BIDIRECTIONAL = 'bidirectional',
  NONE = 'none',
}

export enum CrossingType {
  OVER = 'over',
  UNDER = 'under',
  JUNCTION = 'junction',
  BREAK = 'break',
}

// Edge data interfaces
export interface BaseEdgeData {
  edgeType: EdgeType;
  label?: string;
  locked?: boolean;
  layer?: string;
  metadata?: Record<string, any>;
  routingAlgorithm?: RoutingAlgorithm;
  waypoints?: XYPosition[];
  manuallyAdjusted?: boolean;
  crossings?: EdgeCrossing[];
  zIndex?: number;
  visible?: boolean;
  selectable?: boolean;
}

export interface PipeEdgeData extends BaseEdgeData {
  edgeType: EdgeType.PIPE;
  pipeType: PipeType;
  diameter: number;
  pressure?: number;
  flow?: number;
  temperature?: number;
  material?: string;
  schedule?: string;
  insulation?: boolean;
  tracing?: boolean;
  flowDirection: FlowDirection;
  specifications?: PipeSpecification;
  validationRules?: ValidationRule[];
}

export interface SignalEdgeData extends BaseEdgeData {
  edgeType: EdgeType.SIGNAL;
  signalType: SignalType;
  voltage?: number;
  current?: number;
  frequency?: number;
  protocol?: string;
  baudRate?: number;
  cableType?: string;
  shielded?: boolean;
  twisted?: boolean;
  powerRating?: number;
  signalRange?: { min: number; max: number };
  termination?: string;
}

export interface AnnotationEdgeData extends BaseEdgeData {
  edgeType: EdgeType.ANNOTATION;
  annotationType: 'dimension' | 'callout' | 'reference' | 'markup' | 'comment';
  text?: string;
  arrowType?: 'none' | 'start' | 'end' | 'both';
  style?: {
    strokeDasharray?: string;
    strokeWidth?: number;
    color?: string;
    fontSize?: number;
    fontFamily?: string;
  };
}

// Routing configuration
export interface RoutingConfig {
  algorithm: RoutingAlgorithm;
  minSegmentLength: number;
  maxBends: number;
  bendRadius: number;
  gridAlignment: boolean;
  avoidObstacles: boolean;
  preferredDirection?: 'horizontal' | 'vertical';
  spacing: {
    parallel: number;
    crossing: number;
    node: number;
  };
  optimization: {
    minimizeLength: boolean;
    minimizeBends: boolean;
    avoidCrossings: boolean;
    maintainFlow: boolean;
  };
}

// Waypoint system
export interface Waypoint {
  id: string;
  position: XYPosition;
  type: 'auto' | 'manual' | 'constraint';
  locked?: boolean;
  constraints?: {
    horizontal?: boolean;
    vertical?: boolean;
    grid?: boolean;
  };
}

// Edge crossing management
export interface EdgeCrossing {
  id: string;
  position: XYPosition;
  crossingEdgeId: string;
  type: CrossingType;
  symbol?: 'bridge' | 'break' | 'junction';
  clearance?: number;
}

// Pipe specifications
export interface PipeSpecification {
  nominalDiameter: number;
  outerDiameter: number;
  wallThickness: number;
  material: string;
  schedule: string;
  rating: string;
  standards: string[];
  color?: string;
  insulationThickness?: number;
  tracingType?: string;
  maxPressure: number;
  maxTemperature: number;
  minTemperature: number;
  allowableStress: number;
  roughness: number;
  weight: number;
  cost?: number;
}

// Connection validation
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  type: 'connection' | 'flow' | 'pressure' | 'temperature' | 'material';
  severity: 'error' | 'warning' | 'info';
  condition: (source: any, target: any, edge: any) => boolean;
  message: string;
}

export interface ConnectionValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions?: string[];
}

export interface ValidationError {
  id: string;
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  sourceId?: string;
  targetId?: string;
  edgeId?: string;
  position?: XYPosition;
}

// Routing constraints
export interface RoutingConstraint {
  id: string;
  type: 'avoid' | 'prefer' | 'require' | 'forbidden';
  area?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  path?: XYPosition[];
  priority: number;
  description?: string;
}

// Path calculation
export interface PathSegment {
  start: XYPosition;
  end: XYPosition;
  direction: 'horizontal' | 'vertical' | 'diagonal';
  length: number;
  obstacles?: Obstacle[];
}

export interface Obstacle {
  id: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  type: 'node' | 'edge' | 'area' | 'constraint';
  priority: number;
  avoidance: 'hard' | 'soft';
}

// Routing result
export interface RoutingResult {
  path: XYPosition[];
  waypoints: Waypoint[];
  crossings: EdgeCrossing[];
  totalLength: number;
  bendCount: number;
  conflicts: Conflict[];
  cost: number;
  isOptimal: boolean;
}

export interface Conflict {
  id: string;
  type: 'crossing' | 'overlap' | 'constraint' | 'validation';
  severity: 'error' | 'warning' | 'info';
  position: XYPosition;
  involvedIds: string[];
  description: string;
  suggestions?: string[];
}

// Performance optimization
export interface RoutingPerformance {
  nodesCount: number;
  edgesCount: number;
  calculationTime: number;
  memoryUsage: number;
  cacheHits: number;
  cacheMisses: number;
  optimizationLevel: 'low' | 'medium' | 'high';
}

// Edge animation
export interface EdgeAnimation {
  enabled: boolean;
  type: 'flow' | 'pulse' | 'dash' | 'glow';
  speed: number;
  direction: FlowDirection;
  color?: string;
  opacity?: number;
  size?: number;
}

// Edge label configuration
export interface EdgeLabel {
  id: string;
  text: string;
  position: 'start' | 'center' | 'end' | 'custom';
  offset?: XYPosition;
  rotation?: number;
  background?: {
    enabled: boolean;
    color?: string;
    padding?: number;
    borderRadius?: number;
  };
  style?: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
  };
  visible?: boolean;
  interactive?: boolean;
}

// Routing preferences
export interface RoutingPreferences {
  globalSettings: {
    algorithm: RoutingAlgorithm;
    optimization: boolean;
    realTimeRouting: boolean;
    showCrossings: boolean;
    showWaypoints: boolean;
    enableAnimations: boolean;
  };
  pipeDefaults: {
    algorithm: RoutingAlgorithm;
    bendRadius: number;
    spacing: number;
    showFlow: boolean;
    showLabels: boolean;
  };
  signalDefaults: {
    algorithm: RoutingAlgorithm;
    separation: number;
    bundling: boolean;
    showProtocol: boolean;
  };
  validationSettings: {
    enableRealTime: boolean;
    strictMode: boolean;
    autoCorrect: boolean;
    highlightIssues: boolean;
  };
}

// Export union types
export type EdgeData = PipeEdgeData | SignalEdgeData | AnnotationEdgeData;
export type RoutingEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type: EdgeType;
  data: EdgeData;
  style?: React.CSSProperties;
  animated?: boolean;
  hidden?: boolean;
  selected?: boolean;
  markerStart?: string;
  markerEnd?: string;
  zIndex?: number;
  interactionWidth?: number;
};

// Edge event types
export interface EdgeEvent {
  type: EdgeEventType;
  edgeId: string;
  data?: any;
  timestamp: number;
}

export enum EdgeEventType {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  SELECTED = 'selected',
  DESELECTED = 'deselected',
  WAYPOINT_ADDED = 'waypoint_added',
  WAYPOINT_MOVED = 'waypoint_moved',
  WAYPOINT_REMOVED = 'waypoint_removed',
  CROSSING_DETECTED = 'crossing_detected',
  VALIDATION_FAILED = 'validation_failed',
  OPTIMIZATION_COMPLETE = 'optimization_complete',
}

// Routing context
export interface RoutingContext {
  nodes: any[];
  edges: RoutingEdge[];
  constraints: RoutingConstraint[];
  config: RoutingConfig;
  preferences: RoutingPreferences;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
