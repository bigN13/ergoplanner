import { XYPosition, Position } from 'reactflow';
import {
  EdgeType,
  PipeType,
  SignalType,
  FlowDirection,
  ValidationRule,
  ConnectionValidation,
  ValidationError,
  PipeSpecification,
  RoutingEdge,
  EdgeData,
  PipeEdgeData,
  SignalEdgeData,
  AnnotationEdgeData,
  RoutingConstraint,
  EdgeCrossing,
  Waypoint,
} from '@/types/routing';

/**
 * Utility functions for edge routing and validation
 */

/**
 * Validate connection between two nodes
 */
export function validateConnection(
  sourceNode: any,
  targetNode: any,
  edgeType: EdgeType,
  validationRules: ValidationRule[]
): ConnectionValidation {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const suggestions: string[] = [];

  for (const rule of validationRules) {
    try {
      const isValid = rule.condition(sourceNode, targetNode, { type: edgeType });

      if (!isValid) {
        const error: ValidationError = {
          id: `validation_${rule.id}`,
          type: rule.type,
          severity: rule.severity,
          message: rule.message,
          sourceId: sourceNode.id,
          targetId: targetNode.id,
        };

        if (rule.severity === 'error') {
          errors.push(error);
        } else {
          warnings.push(error);
        }
      }
    } catch (error) {
      console.warn(`Validation rule ${rule.id} failed to execute:`, error);
    }
  }

  // Add contextual suggestions
  if (errors.length > 0) {
    suggestions.push('Review connection requirements and node compatibility');
  }
  if (warnings.length > 0) {
    suggestions.push('Consider reviewing connection for optimal performance');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}

/**
 * Get default validation rules for different edge types
 */
export function getDefaultValidationRules(): ValidationRule[] {
  return [
    // Pipe connection rules
    {
      id: 'pipe_diameter_compatibility',
      name: 'Pipe Diameter Compatibility',
      description: 'Check if pipe diameters are compatible',
      type: 'connection',
      severity: 'warning',
      condition: (source, target, edge) => {
        if (edge.type !== EdgeType.PIPE) return true;
        const sourceDiameter = source.data?.pipeSize || 50;
        const targetDiameter = target.data?.pipeSize || 50;
        return Math.abs(sourceDiameter - targetDiameter) <= sourceDiameter * 0.2;
      },
      message: 'Pipe diameter mismatch detected. Consider using a reducer.',
    },
    {
      id: 'pipe_pressure_rating',
      name: 'Pressure Rating Check',
      description: 'Verify pressure ratings are compatible',
      type: 'pressure',
      severity: 'error',
      condition: (source, target, edge) => {
        if (edge.type !== EdgeType.PIPE) return true;
        const sourcePressure = source.data?.maxPressure || 10;
        const targetPressure = target.data?.maxPressure || 10;
        const edgePressure = edge.data?.pressure || 5;
        return edgePressure <= Math.min(sourcePressure, targetPressure);
      },
      message: 'Operating pressure exceeds component ratings.',
    },
    {
      id: 'signal_voltage_compatibility',
      name: 'Signal Voltage Compatibility',
      description: 'Check signal voltage compatibility',
      type: 'connection',
      severity: 'error',
      condition: (source, target, edge) => {
        if (edge.type !== EdgeType.SIGNAL) return true;
        const sourceVoltage = source.data?.voltage || 24;
        const targetVoltage = target.data?.inputVoltage || 24;
        return Math.abs(sourceVoltage - targetVoltage) < 1;
      },
      message: 'Signal voltage mismatch between components.',
    },
    {
      id: 'flow_direction_check',
      name: 'Flow Direction Validation',
      description: 'Verify flow direction is logical',
      type: 'flow',
      severity: 'warning',
      condition: (source, target, edge) => {
        if (edge.type !== EdgeType.PIPE) return true;
        const sourceType = source.data?.componentType;
        const targetType = target.data?.componentType;

        // Pumps should typically flow to consumers
        if (sourceType === 'pump' && targetType === 'pump') {
          return false;
        }
        return true;
      },
      message: 'Unusual flow direction detected between components.',
    },
    {
      id: 'material_compatibility',
      name: 'Material Compatibility',
      description: 'Check material compatibility for chemical processes',
      type: 'material',
      severity: 'warning',
      condition: (source, target, edge) => {
        if (edge.type !== EdgeType.PIPE) return true;
        const sourceMaterial = source.data?.material || 'carbon_steel';
        const targetMaterial = target.data?.material || 'carbon_steel';
        const edgeMaterial = edge.data?.material || 'carbon_steel';

        // Simple compatibility check
        const incompatiblePairs = [
          ['stainless_steel', 'carbon_steel'],
          ['aluminum', 'copper'],
        ];

        for (const [mat1, mat2] of incompatiblePairs) {
          if ((sourceMaterial === mat1 && targetMaterial === mat2) ||
              (sourceMaterial === mat2 && targetMaterial === mat1)) {
            return false;
          }
        }
        return true;
      },
      message: 'Potential material compatibility issue detected.',
    },
  ];
}

/**
 * Calculate pipe specifications based on flow requirements
 */
export function calculatePipeSpecifications(
  flowRate: number, // L/min
  pressure: number, // bar
  fluidType: PipeType,
  material: string = 'carbon_steel'
): PipeSpecification {
  // Simplified pipe sizing calculation
  const velocity = 2.0; // m/s target velocity
  const area = (flowRate / 60000) / velocity; // m²
  const diameter = Math.sqrt(4 * area / Math.PI) * 1000; // mm

  // Round to standard pipe sizes
  const standardSizes = [15, 20, 25, 32, 40, 50, 65, 80, 100, 125, 150, 200, 250, 300];
  const nominalDiameter = standardSizes.find(size => size >= diameter) || standardSizes[standardSizes.length - 1];

  // Calculate wall thickness based on pressure
  const allowableStress = getMaterialStress(material);
  const safetyFactor = 4;
  const wallThickness = Math.max(
    2, // Minimum 2mm
    (pressure * nominalDiameter) / (2 * allowableStress / safetyFactor)
  );

  return {
    nominalDiameter,
    outerDiameter: nominalDiameter + 2 * wallThickness,
    wallThickness,
    material,
    schedule: getScheduleFromThickness(wallThickness, nominalDiameter),
    rating: getPressureRating(pressure),
    standards: getApplicableStandards(fluidType, material),
    color: getPipeColor(fluidType),
    maxPressure: pressure * 1.5, // Safety margin
    maxTemperature: getMaxTemperature(material, fluidType),
    minTemperature: getMinTemperature(material, fluidType),
    allowableStress,
    roughness: getMaterialRoughness(material),
    weight: calculatePipeWeight(nominalDiameter, wallThickness, material),
  };
}

/**
 * Get material stress value
 */
function getMaterialStress(material: string): number {
  const stressValues: Record<string, number> = {
    carbon_steel: 138, // MPa
    stainless_steel: 200,
    aluminum: 90,
    copper: 69,
    pvc: 25,
    hdpe: 11,
  };
  return stressValues[material] || 100;
}

/**
 * Get pipe schedule from thickness
 */
function getScheduleFromThickness(thickness: number, diameter: number): string {
  const ratio = thickness / diameter;
  if (ratio < 0.1) return 'SCH 10';
  if (ratio < 0.15) return 'SCH 40';
  if (ratio < 0.2) return 'SCH 80';
  return 'SCH 160';
}

/**
 * Get pressure rating class
 */
function getPressureRating(pressure: number): string {
  if (pressure <= 10) return 'PN 10';
  if (pressure <= 16) return 'PN 16';
  if (pressure <= 25) return 'PN 25';
  if (pressure <= 40) return 'PN 40';
  return 'PN 63';
}

/**
 * Get applicable standards for pipe
 */
function getApplicableStandards(fluidType: PipeType, material: string): string[] {
  const standards = ['ISO 14617', 'ISA-5.1'];

  if (fluidType === PipeType.WATER) {
    standards.push('BS EN 806');
  }
  if (material === 'stainless_steel') {
    standards.push('ASTM A312');
  }

  return standards;
}

/**
 * Get pipe color based on fluid type
 */
function getPipeColor(fluidType: PipeType): string {
  const colors: Record<PipeType, string> = {
    [PipeType.WATER]: '#3b82f6',
    [PipeType.STEAM]: '#ef4444',
    [PipeType.GAS]: '#f59e0b',
    [PipeType.CHEMICAL]: '#8b5cf6',
    [PipeType.PROCESS]: '#10b981',
    [PipeType.UTILITY]: '#6b7280',
    [PipeType.DRAINAGE]: '#374151',
    [PipeType.COMPRESSED_AIR]: '#06b6d4',
    [PipeType.VACUUM]: '#a855f7',
    [PipeType.FUEL]: '#dc2626',
  };
  return colors[fluidType] || '#6b7280';
}

/**
 * Get maximum operating temperature
 */
function getMaxTemperature(material: string, fluidType: PipeType): number {
  const materialLimits: Record<string, number> = {
    carbon_steel: 425,
    stainless_steel: 800,
    aluminum: 200,
    copper: 250,
    pvc: 60,
    hdpe: 80,
  };

  const fluidLimits: Record<PipeType, number> = {
    [PipeType.WATER]: 100,
    [PipeType.STEAM]: 250,
    [PipeType.GAS]: 200,
    [PipeType.CHEMICAL]: 150,
    [PipeType.PROCESS]: 200,
    [PipeType.UTILITY]: 80,
    [PipeType.DRAINAGE]: 60,
    [PipeType.COMPRESSED_AIR]: 80,
    [PipeType.VACUUM]: 150,
    [PipeType.FUEL]: 100,
  };

  return Math.min(materialLimits[material] || 100, fluidLimits[fluidType] || 100);
}

/**
 * Get minimum operating temperature
 */
function getMinTemperature(material: string, fluidType: PipeType): number {
  const materialLimits: Record<string, number> = {
    carbon_steel: -45,
    stainless_steel: -196,
    aluminum: -269,
    copper: -200,
    pvc: -10,
    hdpe: -40,
  };

  return materialLimits[material] || -20;
}

/**
 * Get material surface roughness
 */
function getMaterialRoughness(material: string): number {
  const roughnessValues: Record<string, number> = {
    carbon_steel: 0.045, // mm
    stainless_steel: 0.015,
    aluminum: 0.015,
    copper: 0.0015,
    pvc: 0.0015,
    hdpe: 0.007,
  };
  return roughnessValues[material] || 0.045;
}

/**
 * Calculate pipe weight per meter
 */
function calculatePipeWeight(diameter: number, thickness: number, material: string): number {
  const densities: Record<string, number> = {
    carbon_steel: 7850, // kg/m³
    stainless_steel: 8000,
    aluminum: 2700,
    copper: 8960,
    pvc: 1400,
    hdpe: 950,
  };

  const density = densities[material] || 7850;
  const outerRadius = diameter / 2000; // Convert mm to m
  const innerRadius = outerRadius - thickness / 1000;
  const area = Math.PI * (outerRadius * outerRadius - innerRadius * innerRadius);

  return area * density; // kg/m
}

/**
 * Create default edge data based on type
 */
export function createDefaultEdgeData(edgeType: EdgeType): EdgeData {
  const baseData = {
    edgeType,
    label: '',
    locked: false,
    layer: 'default',
    metadata: {},
    routingAlgorithm: 'orthogonal' as any,
    waypoints: [],
    manuallyAdjusted: false,
    crossings: [],
    zIndex: 1,
    visible: true,
    selectable: true,
  };

  switch (edgeType) {
    case EdgeType.PIPE:
      return {
        ...baseData,
        edgeType: EdgeType.PIPE,
        pipeType: PipeType.WATER,
        diameter: 50,
        pressure: 6,
        flow: 100,
        temperature: 20,
        material: 'carbon_steel',
        schedule: 'SCH 40',
        insulation: false,
        tracing: false,
        flowDirection: FlowDirection.FORWARD,
        specifications: calculatePipeSpecifications(100, 6, PipeType.WATER),
        validationRules: getDefaultValidationRules().filter(rule =>
          rule.type === 'connection' || rule.type === 'pressure' || rule.type === 'flow'
        ),
      } as PipeEdgeData;

    case EdgeType.SIGNAL:
      return {
        ...baseData,
        edgeType: EdgeType.SIGNAL,
        signalType: SignalType.ANALOG_4_20MA,
        voltage: 24,
        current: 20,
        frequency: 50,
        protocol: '4-20mA',
        baudRate: 9600,
        cableType: 'instrumentation',
        shielded: true,
        twisted: true,
        powerRating: 10,
        signalRange: { min: 4, max: 20 },
        termination: '120ohm',
      } as SignalEdgeData;

    case EdgeType.ANNOTATION:
      return {
        ...baseData,
        edgeType: EdgeType.ANNOTATION,
        annotationType: 'callout' as const,
        text: 'Annotation',
        arrowType: 'end' as const,
        style: {
          strokeDasharray: '5,5',
          strokeWidth: 1,
          color: '#6b7280',
          fontSize: 12,
          fontFamily: 'Arial',
        },
      } as AnnotationEdgeData;

    default:
      return baseData as EdgeData;
  }
}

/**
 * Generate unique edge ID
 */
export function generateEdgeId(prefix: string = 'edge'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate edge path string for SVG
 */
export function calculateEdgePath(waypoints: XYPosition[]): string {
  if (waypoints.length < 2) return '';

  let path = `M ${waypoints[0].x} ${waypoints[0].y}`;

  for (let i = 1; i < waypoints.length; i++) {
    path += ` L ${waypoints[i].x} ${waypoints[i].y}`;
  }

  return path;
}

/**
 * Get edge style based on type and properties
 */
export function getEdgeStyle(edgeData: EdgeData): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    strokeWidth: 2,
    stroke: '#6b7280',
  };

  switch (edgeData.edgeType) {
    case EdgeType.PIPE:
      const pipeData = edgeData as PipeEdgeData;
      return {
        ...baseStyle,
        strokeWidth: Math.max(2, Math.min(pipeData.diameter / 10, 8)),
        stroke: getPipeColor(pipeData.pipeType),
        strokeDasharray: getPipeDashArray(pipeData.pipeType),
      };

    case EdgeType.SIGNAL:
      const signalData = edgeData as SignalEdgeData;
      return {
        ...baseStyle,
        strokeWidth: signalData.shielded ? 3 : 2,
        stroke: getSignalColor(signalData.signalType),
        strokeDasharray: getSignalDashArray(signalData.signalType),
      };

    case EdgeType.ANNOTATION:
      const annotationData = edgeData as AnnotationEdgeData;
      return {
        ...baseStyle,
        ...annotationData.style,
        stroke: annotationData.style?.color || baseStyle.stroke,
      };

    default:
      return baseStyle;
  }
}

/**
 * Get pipe dash array pattern
 */
function getPipeDashArray(pipeType: PipeType): string | undefined {
  const patterns: Partial<Record<PipeType, string>> = {
    [PipeType.GAS]: '5,5',
    [PipeType.STEAM]: '2,2',
    [PipeType.CHEMICAL]: '8,3,2,3',
    [PipeType.VACUUM]: '10,5,2,5',
  };
  return patterns[pipeType];
}

/**
 * Get signal color based on type
 */
function getSignalColor(signalType: SignalType): string {
  const colors: Record<SignalType, string> = {
    [SignalType.ANALOG_4_20MA]: '#10b981',
    [SignalType.DIGITAL]: '#3b82f6',
    [SignalType.MODBUS]: '#8b5cf6',
    [SignalType.PROFIBUS]: '#f59e0b',
    [SignalType.ETHERNET]: '#06b6d4',
    [SignalType.WIRELESS]: '#ec4899',
    [SignalType.FIELDBUS]: '#84cc16',
    [SignalType.HART]: '#f97316',
    [SignalType.FOUNDATION_FIELDBUS]: '#6366f1',
  };
  return colors[signalType] || '#6b7280';
}

/**
 * Get signal dash array pattern
 */
function getSignalDashArray(signalType: SignalType): string | undefined {
  const patterns: Partial<Record<SignalType, string>> = {
    [SignalType.WIRELESS]: '3,3',
    [SignalType.DIGITAL]: '1,2',
  };
  return patterns[signalType];
}

/**
 * Check if two edges can be bundled together
 */
export function canBundleEdges(edge1: RoutingEdge, edge2: RoutingEdge): boolean {
  // Only bundle similar signal types
  if (edge1.type !== EdgeType.SIGNAL || edge2.type !== EdgeType.SIGNAL) {
    return false;
  }

  const data1 = edge1.data as SignalEdgeData;
  const data2 = edge2.data as SignalEdgeData;

  // Check if signal types are compatible for bundling
  const compatibleSignals = [
    [SignalType.ANALOG_4_20MA, SignalType.HART],
    [SignalType.DIGITAL, SignalType.MODBUS],
    [SignalType.PROFIBUS, SignalType.FOUNDATION_FIELDBUS],
  ];

  return compatibleSignals.some(group =>
    group.includes(data1.signalType) && group.includes(data2.signalType)
  );
}

/**
 * Calculate bundle spacing for multiple edges
 */
export function calculateBundleSpacing(edges: RoutingEdge[]): number {
  const totalWidth = edges.reduce((sum, edge) => {
    const data = edge.data as SignalEdgeData;
    return sum + (data.shielded ? 6 : 4); // Account for shielding
  }, 0);

  return Math.max(20, totalWidth + 10); // Minimum 20px spacing
}

/**
 * Optimize edge crossings by adjusting z-index
 */
export function optimizeEdgeCrossings(edges: RoutingEdge[]): RoutingEdge[] {
  const edgesWithCrossings = edges.map(edge => ({
    ...edge,
    crossingCount: edge.data.crossings?.length || 0,
  }));

  // Sort by crossing count and assign z-index
  edgesWithCrossings.sort((a, b) => a.crossingCount - b.crossingCount);

  return edgesWithCrossings.map((edge, index) => ({
    ...edge,
    zIndex: index + 1,
    data: {
      ...edge.data,
      zIndex: index + 1,
    },
  }));
}