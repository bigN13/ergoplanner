/**
 * Save Validation Service
 * TASK-023: Auto-save Functionality
 *
 * Comprehensive validation system for save operations with
 * drawing integrity checks, data validation, and constraint verification.
 */

import { nanoid } from '@reduxjs/toolkit';
import type {
  SavePayload,
  SaveValidationResult,
  ValidationError,
  ValidationWarning,
} from '@/types/autosave';
import type { ReactFlowData, Node, Edge } from '@/types';
import { calculateChecksum } from '@/utils/dataUtils';

// Validation rule types
export type ValidationRuleType =
  | 'structure'     // Basic data structure validation
  | 'integrity'     // Data integrity and consistency
  | 'business'      // Business logic validation
  | 'performance'   // Performance and size constraints
  | 'security'      // Security and permission checks
  | 'compatibility'; // Version and compatibility checks

// Validation rule severity
export type ValidationSeverity = 'error' | 'warning' | 'info';

// Validation rule interface
export interface ValidationRule {
  id: string;
  name: string;
  type: ValidationRuleType;
  severity: ValidationSeverity;
  enabled: boolean;
  validate: (payload: SavePayload, context: ValidationContext) => ValidationResult[];
  description: string;
  suggestion?: string;
}

// Validation context
export interface ValidationContext {
  drawingId: string;
  userId: string;
  sessionId: string;
  isAutoSave: boolean;
  previousVersion?: SavePayload;
  networkStatus: boolean;
  timestamp: number;
}

// Individual validation result
export interface ValidationResult {
  ruleId: string;
  severity: ValidationSeverity;
  message: string;
  path?: string;
  code: string;
  recoverable: boolean;
  suggestion?: string;
  details?: any;
}

// Validation configuration
export interface ValidationConfig {
  enabledRules: string[];
  strictMode: boolean;
  maxFileSize: number;
  maxNodes: number;
  maxEdges: number;
  allowedNodeTypes: string[];
  allowedEdgeTypes: string[];
  requireChecksum: boolean;
  validateReferences: boolean;
  performanceChecks: boolean;
}

const DEFAULT_CONFIG: ValidationConfig = {
  enabledRules: [], // Will be populated with all rule IDs
  strictMode: false,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxNodes: 10000,
  maxEdges: 20000,
  allowedNodeTypes: [
    'pump', 'valve', 'tank', 'pipe', 'instrument', 'equipment',
    'fitting', 'actuator', 'sensor', 'controller', 'junction',
    'source', 'destination', 'process', 'storage', 'treatment'
  ],
  allowedEdgeTypes: ['pipe', 'signal', 'control', 'data'],
  requireChecksum: true,
  validateReferences: true,
  performanceChecks: true,
};

/**
 * Save Validation Service
 *
 * Provides comprehensive validation for save operations:
 * - Data structure validation
 * - Business rule enforcement
 * - Performance constraint checking
 * - Security validation
 * - Integrity verification
 * - Compatibility checking
 */
export class ValidationService {
  private config: ValidationConfig;
  private rules = new Map<string, ValidationRule>();

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeRules();
  }

  /**
   * Validate a save payload
   */
  public async validateSavePayload(
    payload: SavePayload,
    context: ValidationContext
  ): Promise<SaveValidationResult> {
    const results: ValidationResult[] = [];
    const startTime = performance.now();

    // Run enabled validation rules
    for (const ruleId of this.config.enabledRules) {
      const rule = this.rules.get(ruleId);
      if (!rule || !rule.enabled) continue;

      try {
        const ruleResults = rule.validate(payload, context);
        results.push(...ruleResults);
      } catch (error) {
        console.error(`Validation rule ${ruleId} failed:`, error);
        results.push({
          ruleId,
          severity: 'error',
          message: `Validation rule error: ${(error as Error).message}`,
          code: 'VALIDATION_RULE_ERROR',
          recoverable: false,
        });
      }
    }

    // Separate errors and warnings
    const errors = results.filter(r => r.severity === 'error');
    const warnings = results.filter(r => r.severity === 'warning');

    // Calculate validation metrics
    const validationTime = performance.now() - startTime;
    const estimatedSize = JSON.stringify(payload).length;
    const checksum = this.config.requireChecksum ? calculateChecksum(payload) : undefined;

    return {
      valid: errors.length === 0,
      errors: errors.map(this.convertToValidationError),
      warnings: warnings.map(this.convertToValidationWarning),
      estimatedSize,
      checksum,
      validationTime,
      rulesExecuted: this.config.enabledRules.length,
    };
  }

  /**
   * Validate drawing data specifically
   */
  public validateDrawingData(drawingData: ReactFlowData): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Validate nodes
    if (drawingData.nodes) {
      results.push(...this.validateNodes(drawingData.nodes));
    }

    // Validate edges
    if (drawingData.edges) {
      results.push(...this.validateEdges(drawingData.edges, drawingData.nodes || []));
    }

    // Validate viewport
    if (drawingData.viewport) {
      results.push(...this.validateViewport(drawingData.viewport));
    }

    return results;
  }

  /**
   * Initialize validation rules
   */
  private initializeRules(): void {
    const rules: ValidationRule[] = [
      // Structure validation rules
      {
        id: 'payload-structure',
        name: 'Payload Structure',
        type: 'structure',
        severity: 'error',
        enabled: true,
        description: 'Validates basic payload structure',
        validate: this.validatePayloadStructure.bind(this),
      },
      {
        id: 'drawing-data-structure',
        name: 'Drawing Data Structure',
        type: 'structure',
        severity: 'error',
        enabled: true,
        description: 'Validates ReactFlow data structure',
        validate: this.validateDrawingDataStructure.bind(this),
      },

      // Integrity validation rules
      {
        id: 'node-integrity',
        name: 'Node Integrity',
        type: 'integrity',
        severity: 'error',
        enabled: true,
        description: 'Validates node data integrity',
        validate: this.validateNodeIntegrity.bind(this),
      },
      {
        id: 'edge-integrity',
        name: 'Edge Integrity',
        type: 'integrity',
        severity: 'error',
        enabled: true,
        description: 'Validates edge data integrity',
        validate: this.validateEdgeIntegrity.bind(this),
      },
      {
        id: 'reference-integrity',
        name: 'Reference Integrity',
        type: 'integrity',
        severity: 'error',
        enabled: this.config.validateReferences,
        description: 'Validates references between nodes and edges',
        validate: this.validateReferenceIntegrity.bind(this),
      },

      // Business logic validation rules
      {
        id: 'node-types',
        name: 'Node Types',
        type: 'business',
        severity: 'error',
        enabled: true,
        description: 'Validates allowed node types',
        validate: this.validateNodeTypes.bind(this),
      },
      {
        id: 'edge-types',
        name: 'Edge Types',
        type: 'business',
        severity: 'error',
        enabled: true,
        description: 'Validates allowed edge types',
        validate: this.validateEdgeTypes.bind(this),
      },
      {
        id: 'connection-rules',
        name: 'Connection Rules',
        type: 'business',
        severity: 'warning',
        enabled: true,
        description: 'Validates P&ID connection rules',
        validate: this.validateConnectionRules.bind(this),
      },

      // Performance validation rules
      {
        id: 'file-size',
        name: 'File Size',
        type: 'performance',
        severity: 'warning',
        enabled: this.config.performanceChecks,
        description: 'Validates file size limits',
        validate: this.validateFileSize.bind(this),
      },
      {
        id: 'element-count',
        name: 'Element Count',
        type: 'performance',
        severity: 'warning',
        enabled: this.config.performanceChecks,
        description: 'Validates node and edge count limits',
        validate: this.validateElementCount.bind(this),
      },
      {
        id: 'complexity',
        name: 'Drawing Complexity',
        type: 'performance',
        severity: 'info',
        enabled: this.config.performanceChecks,
        description: 'Assesses drawing complexity',
        validate: this.validateComplexity.bind(this),
      },

      // Security validation rules
      {
        id: 'metadata-security',
        name: 'Metadata Security',
        type: 'security',
        severity: 'error',
        enabled: true,
        description: 'Validates metadata for security issues',
        validate: this.validateMetadataSecurity.bind(this),
      },
      {
        id: 'data-sanitization',
        name: 'Data Sanitization',
        type: 'security',
        severity: 'warning',
        enabled: true,
        description: 'Checks for potentially harmful data',
        validate: this.validateDataSanitization.bind(this),
      },

      // Compatibility validation rules
      {
        id: 'version-compatibility',
        name: 'Version Compatibility',
        type: 'compatibility',
        severity: 'warning',
        enabled: true,
        description: 'Validates version compatibility',
        validate: this.validateVersionCompatibility.bind(this),
      },
    ];

    // Register rules
    for (const rule of rules) {
      this.rules.set(rule.id, rule);
    }

    // Update enabled rules in config
    this.config.enabledRules = rules.map(r => r.id);
  }

  // Validation rule implementations

  private validatePayloadStructure(payload: SavePayload, context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];

    if (!payload) {
      results.push({
        ruleId: 'payload-structure',
        severity: 'error',
        message: 'Payload is null or undefined',
        code: 'MISSING_PAYLOAD',
        recoverable: false,
      });
      return results;
    }

    if (!payload.drawingData) {
      results.push({
        ruleId: 'payload-structure',
        severity: 'error',
        message: 'Drawing data is missing',
        path: 'drawingData',
        code: 'MISSING_DRAWING_DATA',
        recoverable: false,
      });
    }

    if (!payload.metadata) {
      results.push({
        ruleId: 'payload-structure',
        severity: 'error',
        message: 'Metadata is missing',
        path: 'metadata',
        code: 'MISSING_METADATA',
        recoverable: false,
      });
    }

    return results;
  }

  private validateDrawingDataStructure(payload: SavePayload, context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const { drawingData } = payload;

    if (!drawingData) return results;

    if (!Array.isArray(drawingData.nodes)) {
      results.push({
        ruleId: 'drawing-data-structure',
        severity: 'error',
        message: 'Nodes must be an array',
        path: 'drawingData.nodes',
        code: 'INVALID_NODES_STRUCTURE',
        recoverable: false,
      });
    }

    if (!Array.isArray(drawingData.edges)) {
      results.push({
        ruleId: 'drawing-data-structure',
        severity: 'error',
        message: 'Edges must be an array',
        path: 'drawingData.edges',
        code: 'INVALID_EDGES_STRUCTURE',
        recoverable: false,
      });
    }

    if (drawingData.viewport && typeof drawingData.viewport !== 'object') {
      results.push({
        ruleId: 'drawing-data-structure',
        severity: 'error',
        message: 'Viewport must be an object',
        path: 'drawingData.viewport',
        code: 'INVALID_VIEWPORT_STRUCTURE',
        recoverable: false,
      });
    }

    return results;
  }

  private validateNodeIntegrity(payload: SavePayload, context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const nodes = payload.drawingData?.nodes || [];

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const path = `drawingData.nodes[${i}]`;

      if (!node.id) {
        results.push({
          ruleId: 'node-integrity',
          severity: 'error',
          message: 'Node is missing required id',
          path: `${path}.id`,
          code: 'MISSING_NODE_ID',
          recoverable: false,
        });
      }

      if (!node.type) {
        results.push({
          ruleId: 'node-integrity',
          severity: 'error',
          message: 'Node is missing required type',
          path: `${path}.type`,
          code: 'MISSING_NODE_TYPE',
          recoverable: false,
        });
      }

      if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
        results.push({
          ruleId: 'node-integrity',
          severity: 'error',
          message: 'Node has invalid position',
          path: `${path}.position`,
          code: 'INVALID_NODE_POSITION',
          recoverable: true,
          suggestion: 'Set position to {x: 0, y: 0}',
        });
      }

      // Check for duplicate IDs
      const duplicates = nodes.filter(n => n.id === node.id);
      if (duplicates.length > 1) {
        results.push({
          ruleId: 'node-integrity',
          severity: 'error',
          message: `Duplicate node ID: ${node.id}`,
          path: `${path}.id`,
          code: 'DUPLICATE_NODE_ID',
          recoverable: false,
        });
      }
    }

    return results;
  }

  private validateEdgeIntegrity(payload: SavePayload, context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const edges = payload.drawingData?.edges || [];

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const path = `drawingData.edges[${i}]`;

      if (!edge.id) {
        results.push({
          ruleId: 'edge-integrity',
          severity: 'error',
          message: 'Edge is missing required id',
          path: `${path}.id`,
          code: 'MISSING_EDGE_ID',
          recoverable: false,
        });
      }

      if (!edge.source) {
        results.push({
          ruleId: 'edge-integrity',
          severity: 'error',
          message: 'Edge is missing source node',
          path: `${path}.source`,
          code: 'MISSING_EDGE_SOURCE',
          recoverable: false,
        });
      }

      if (!edge.target) {
        results.push({
          ruleId: 'edge-integrity',
          severity: 'error',
          message: 'Edge is missing target node',
          path: `${path}.target`,
          code: 'MISSING_EDGE_TARGET',
          recoverable: false,
        });
      }

      // Check for duplicate IDs
      const duplicates = edges.filter(e => e.id === edge.id);
      if (duplicates.length > 1) {
        results.push({
          ruleId: 'edge-integrity',
          severity: 'error',
          message: `Duplicate edge ID: ${edge.id}`,
          path: `${path}.id`,
          code: 'DUPLICATE_EDGE_ID',
          recoverable: false,
        });
      }
    }

    return results;
  }

  private validateReferenceIntegrity(payload: SavePayload, context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const nodes = payload.drawingData?.nodes || [];
    const edges = payload.drawingData?.edges || [];

    const nodeIds = new Set(nodes.map(n => n.id));

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const path = `drawingData.edges[${i}]`;

      if (!nodeIds.has(edge.source)) {
        results.push({
          ruleId: 'reference-integrity',
          severity: 'error',
          message: `Edge references non-existent source node: ${edge.source}`,
          path: `${path}.source`,
          code: 'INVALID_EDGE_SOURCE_REFERENCE',
          recoverable: false,
        });
      }

      if (!nodeIds.has(edge.target)) {
        results.push({
          ruleId: 'reference-integrity',
          severity: 'error',
          message: `Edge references non-existent target node: ${edge.target}`,
          path: `${path}.target`,
          code: 'INVALID_EDGE_TARGET_REFERENCE',
          recoverable: false,
        });
      }
    }

    return results;
  }

  private validateNodeTypes(payload: SavePayload, context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const nodes = payload.drawingData?.nodes || [];

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const path = `drawingData.nodes[${i}]`;

      if (node.type && !this.config.allowedNodeTypes.includes(node.type)) {
        results.push({
          ruleId: 'node-types',
          severity: this.config.strictMode ? 'error' : 'warning',
          message: `Invalid node type: ${node.type}`,
          path: `${path}.type`,
          code: 'INVALID_NODE_TYPE',
          recoverable: true,
          suggestion: `Use one of: ${this.config.allowedNodeTypes.join(', ')}`,
        });
      }
    }

    return results;
  }

  private validateEdgeTypes(payload: SavePayload, context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const edges = payload.drawingData?.edges || [];

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const path = `drawingData.edges[${i}]`;

      if (edge.type && !this.config.allowedEdgeTypes.includes(edge.type)) {
        results.push({
          ruleId: 'edge-types',
          severity: this.config.strictMode ? 'error' : 'warning',
          message: `Invalid edge type: ${edge.type}`,
          path: `${path}.type`,
          code: 'INVALID_EDGE_TYPE',
          recoverable: true,
          suggestion: `Use one of: ${this.config.allowedEdgeTypes.join(', ')}`,
        });
      }
    }

    return results;
  }

  private validateConnectionRules(payload: SavePayload, context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    // P&ID-specific connection validation would go here
    // For now, this is a placeholder
    return results;
  }

  private validateFileSize(payload: SavePayload, context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const size = JSON.stringify(payload).length;

    if (size > this.config.maxFileSize) {
      results.push({
        ruleId: 'file-size',
        severity: 'warning',
        message: `File size (${Math.round(size / 1024)}KB) exceeds recommended limit (${Math.round(this.config.maxFileSize / 1024)}KB)`,
        code: 'FILE_SIZE_EXCEEDED',
        recoverable: true,
        suggestion: 'Consider reducing drawing complexity or enabling compression',
      });
    }

    return results;
  }

  private validateElementCount(payload: SavePayload, context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const nodes = payload.drawingData?.nodes || [];
    const edges = payload.drawingData?.edges || [];

    if (nodes.length > this.config.maxNodes) {
      results.push({
        ruleId: 'element-count',
        severity: 'warning',
        message: `Node count (${nodes.length}) exceeds recommended limit (${this.config.maxNodes})`,
        code: 'NODE_COUNT_EXCEEDED',
        recoverable: true,
        suggestion: 'Consider splitting into multiple drawings',
      });
    }

    if (edges.length > this.config.maxEdges) {
      results.push({
        ruleId: 'element-count',
        severity: 'warning',
        message: `Edge count (${edges.length}) exceeds recommended limit (${this.config.maxEdges})`,
        code: 'EDGE_COUNT_EXCEEDED',
        recoverable: true,
        suggestion: 'Consider splitting into multiple drawings',
      });
    }

    return results;
  }

  private validateComplexity(payload: SavePayload, context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const nodes = payload.drawingData?.nodes || [];
    const edges = payload.drawingData?.edges || [];

    // Calculate complexity score
    const complexity = nodes.length + (edges.length * 0.5);

    if (complexity > 1000) {
      results.push({
        ruleId: 'complexity',
        severity: 'info',
        message: `Drawing complexity is high (${Math.round(complexity)})`,
        code: 'HIGH_COMPLEXITY',
        recoverable: true,
        suggestion: 'Consider performance optimizations',
      });
    }

    return results;
  }

  private validateMetadataSecurity(payload: SavePayload, context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    // Security validation would go here
    return results;
  }

  private validateDataSanitization(payload: SavePayload, context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    // Data sanitization checks would go here
    return results;
  }

  private validateVersionCompatibility(payload: SavePayload, context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    // Version compatibility checks would go here
    return results;
  }

  // Helper methods

  private validateNodes(nodes: Node[]): ValidationResult[] {
    // Additional node validation
    return [];
  }

  private validateEdges(edges: Edge[], nodes: Node[]): ValidationResult[] {
    // Additional edge validation
    return [];
  }

  private validateViewport(viewport: any): ValidationResult[] {
    const results: ValidationResult[] = [];

    if (typeof viewport.x !== 'number' || typeof viewport.y !== 'number' || typeof viewport.zoom !== 'number') {
      results.push({
        ruleId: 'drawing-data-structure',
        severity: 'error',
        message: 'Viewport must have numeric x, y, and zoom properties',
        path: 'drawingData.viewport',
        code: 'INVALID_VIEWPORT_VALUES',
        recoverable: true,
        suggestion: 'Reset viewport to default values',
      });
    }

    return results;
  }

  private convertToValidationError(result: ValidationResult): ValidationError {
    return {
      code: result.code,
      message: result.message,
      path: result.path,
      severity: result.severity,
      recoverable: result.recoverable,
    };
  }

  private convertToValidationWarning(result: ValidationResult): ValidationWarning {
    return {
      code: result.code,
      message: result.message,
      path: result.path,
      suggestion: result.suggestion,
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...config };

    // Update rule enabled states
    for (const [ruleId, rule] of this.rules) {
      if (config.enabledRules) {
        rule.enabled = config.enabledRules.includes(ruleId);
      }
    }
  }

  /**
   * Get validation statistics
   */
  public getValidationStatistics() {
    const rules = Array.from(this.rules.values());

    return {
      totalRules: rules.length,
      enabledRules: rules.filter(r => r.enabled).length,
      rulesByType: rules.reduce((acc, rule) => {
        acc[rule.type] = (acc[rule.type] || 0) + 1;
        return acc;
      }, {} as Record<ValidationRuleType, number>),
      rulesBySeverity: rules.reduce((acc, rule) => {
        acc[rule.severity] = (acc[rule.severity] || 0) + 1;
        return acc;
      }, {} as Record<ValidationSeverity, number>),
    };
  }
}

// Enhanced validation result with additional metadata
export interface EnhancedValidationResult extends SaveValidationResult {
  validationTime?: number;
  rulesExecuted?: number;
}

export default ValidationService;