/**
 * Conflict Detection and Resolution Utilities
 * TASK-023: Auto-save Functionality
 *
 * Implements three-way merge algorithm and conflict detection
 * for concurrent editing scenarios.
 */

import { isEqual, cloneDeep, get, set, unset, has } from 'lodash-es';
import { nanoid } from '@reduxjs/toolkit';
import type {
  ConflictingChange,
  ConflictResolutionOption,
  MergeContext,
  MergeResult,
  SaveConflict,
} from '@/types/autosave';
import type { ReactFlowData } from '@/types';

// Types for change tracking
interface Change {
  path: string;
  type: 'add' | 'update' | 'delete' | 'move';
  oldValue?: any;
  newValue?: any;
  timestamp?: number;
}

interface ConflictContext {
  path: string;
  localChange: Change;
  serverChange: Change;
  baseValue?: any;
  confidence: number;
}

/**
 * Detect conflicts between local and server versions using a three-way merge
 */
export function detectConflicts(
  baseVersion: ReactFlowData,
  localVersion: ReactFlowData,
  serverVersion: ReactFlowData
): ConflictingChange[] {
  const conflicts: ConflictingChange[] = [];

  // Get changes from base to local and base to server
  const localChanges = getChanges(baseVersion, localVersion);
  const serverChanges = getChanges(baseVersion, serverVersion);

  // Find conflicting changes
  const conflictContexts = findConflictingChanges(localChanges, serverChanges, baseVersion);

  // Convert conflict contexts to conflicting changes
  for (const context of conflictContexts) {
    conflicts.push({
      path: context.path,
      localValue: context.localChange.newValue,
      serverValue: context.serverChange.newValue,
      baseValue: context.baseValue,
      changeType: context.localChange.type,
      confidence: context.confidence,
    });
  }

  return conflicts;
}

/**
 * Perform three-way merge of drawing data
 */
export function performThreeWayMerge(context: MergeContext): MergeResult {
  const { baseVersion, localVersion, serverVersion } = context;

  try {
    // Start with a copy of the local version
    const mergedData = cloneDeep(localVersion);

    // Get all changes
    const localChanges = getChanges(baseVersion, localVersion);
    const serverChanges = getChanges(baseVersion, serverVersion);

    // Find conflicts
    const conflictContexts = findConflictingChanges(localChanges, serverChanges, baseVersion);
    const conflicts: ConflictingChange[] = [];

    // Apply non-conflicting server changes
    for (const serverChange of serverChanges) {
      const hasConflict = conflictContexts.some(ctx => ctx.path === serverChange.path);

      if (!hasConflict) {
        // Apply server change to merged data
        applyChange(mergedData, serverChange);
      } else {
        // Add to conflicts list
        const conflictContext = conflictContexts.find(ctx => ctx.path === serverChange.path);
        if (conflictContext) {
          conflicts.push({
            path: conflictContext.path,
            localValue: conflictContext.localChange.newValue,
            serverValue: conflictContext.serverChange.newValue,
            baseValue: conflictContext.baseValue,
            changeType: conflictContext.localChange.type,
            confidence: conflictContext.confidence,
          });
        }
      }
    }

    return {
      success: conflicts.length === 0,
      mergedData: conflicts.length === 0 ? mergedData : undefined,
      conflicts,
      resolution: conflicts.length === 0 ? 'auto' : 'manual',
      strategy: 'merge',
      notes: conflicts.length === 0
        ? 'Successfully merged without conflicts'
        : `Found ${conflicts.length} conflicts requiring manual resolution`,
    };

  } catch (error) {
    return {
      success: false,
      conflicts: [],
      resolution: 'failed',
      strategy: 'merge',
      notes: `Merge failed: ${(error as Error).message}`,
    };
  }
}

/**
 * Auto-resolve conflicts based on confidence and rules
 */
export function autoResolveConflicts(
  conflicts: ConflictingChange[],
  strategy: 'local' | 'server' | 'smart' = 'smart'
): { resolved: ConflictingChange[]; remaining: ConflictingChange[] } {
  const resolved: ConflictingChange[] = [];
  const remaining: ConflictingChange[] = [];

  for (const conflict of conflicts) {
    const canAutoResolve = canAutoResolveConflict(conflict, strategy);

    if (canAutoResolve) {
      resolved.push(conflict);
    } else {
      remaining.push(conflict);
    }
  }

  return { resolved, remaining };
}

/**
 * Generate resolution options for conflicts
 */
export function generateResolutionOptions(
  localData: ReactFlowData,
  serverData: ReactFlowData,
  baseData?: ReactFlowData
): ConflictResolutionOption[] {
  const options: ConflictResolutionOption[] = [];

  // Option 1: Use local version
  options.push({
    id: 'use-local',
    type: 'local',
    description: 'Keep your changes and discard server changes',
    recommended: false,
  });

  // Option 2: Use server version
  options.push({
    id: 'use-server',
    type: 'server',
    description: 'Discard your changes and use server version',
    recommended: false,
  });

  // Option 3: Try automatic merge
  if (baseData) {
    const mergeResult = performThreeWayMerge({
      baseVersion: baseData,
      localVersion: localData,
      serverVersion: serverData,
      metadata: {
        baseTimestamp: 0,
        localTimestamp: Date.now(),
        serverTimestamp: Date.now(),
        userIds: [],
      },
    });

    if (mergeResult.success) {
      options.push({
        id: 'auto-merge',
        type: 'merge',
        description: 'Automatically merge non-conflicting changes',
        preview: mergeResult.mergedData,
        recommended: true,
      });
    }
  }

  // Option 4: Manual merge
  options.push({
    id: 'manual-merge',
    type: 'custom',
    description: 'Manually resolve each conflict',
    recommended: !options.some(opt => opt.recommended),
  });

  return options;
}

/**
 * Apply conflict resolution to data
 */
export function applyConflictResolution(
  baseData: ReactFlowData,
  conflicts: ConflictingChange[],
  resolutions: Record<string, 'local' | 'server' | 'custom'>,
  customValues?: Record<string, any>
): ReactFlowData {
  const resolvedData = cloneDeep(baseData);

  for (const conflict of conflicts) {
    const resolution = resolutions[conflict.path];

    switch (resolution) {
      case 'local':
        if (conflict.changeType === 'delete') {
          unset(resolvedData, conflict.path);
        } else {
          set(resolvedData, conflict.path, conflict.localValue);
        }
        break;

      case 'server':
        if (conflict.changeType === 'delete') {
          unset(resolvedData, conflict.path);
        } else {
          set(resolvedData, conflict.path, conflict.serverValue);
        }
        break;

      case 'custom':
        const customValue = customValues?.[conflict.path];
        if (customValue !== undefined) {
          set(resolvedData, conflict.path, customValue);
        }
        break;
    }
  }

  return resolvedData;
}

/**
 * Get changes between two versions
 */
function getChanges(oldData: ReactFlowData, newData: ReactFlowData): Change[] {
  const changes: Change[] = [];

  // Compare nodes
  const nodeChanges = compareArrays(oldData.nodes || [], newData.nodes || [], 'nodes', 'id');
  changes.push(...nodeChanges);

  // Compare edges
  const edgeChanges = compareArrays(oldData.edges || [], newData.edges || [], 'edges', 'id');
  changes.push(...edgeChanges);

  // Compare viewport
  if (!isEqual(oldData.viewport, newData.viewport)) {
    changes.push({
      path: 'viewport',
      type: 'update',
      oldValue: oldData.viewport,
      newValue: newData.viewport,
    });
  }

  return changes;
}

/**
 * Compare arrays and detect changes
 */
function compareArrays<T extends { id: string }>(
  oldArray: T[],
  newArray: T[],
  basePath: string,
  idField: keyof T
): Change[] {
  const changes: Change[] = [];
  const oldMap = new Map(oldArray.map(item => [item[idField], item]));
  const newMap = new Map(newArray.map(item => [item[idField], item]));

  // Find added and updated items
  for (const [id, newItem] of newMap) {
    const oldItem = oldMap.get(id);
    const path = `${basePath}.${id}`;

    if (!oldItem) {
      // Added item
      changes.push({
        path,
        type: 'add',
        newValue: newItem,
      });
    } else if (!isEqual(oldItem, newItem)) {
      // Updated item
      changes.push({
        path,
        type: 'update',
        oldValue: oldItem,
        newValue: newItem,
      });

      // Find specific property changes
      const propertyChanges = compareObjects(oldItem, newItem, path);
      changes.push(...propertyChanges);
    }
  }

  // Find deleted items
  for (const [id, oldItem] of oldMap) {
    if (!newMap.has(id)) {
      changes.push({
        path: `${basePath}.${id}`,
        type: 'delete',
        oldValue: oldItem,
      });
    }
  }

  return changes;
}

/**
 * Compare objects and detect property changes
 */
function compareObjects(oldObj: any, newObj: any, basePath: string): Change[] {
  const changes: Change[] = [];
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const path = `${basePath}.${key}`;
    const oldValue = oldObj[key];
    const newValue = newObj[key];

    if (!has(oldObj, key)) {
      // Added property
      changes.push({
        path,
        type: 'add',
        newValue,
      });
    } else if (!has(newObj, key)) {
      // Deleted property
      changes.push({
        path,
        type: 'delete',
        oldValue,
      });
    } else if (!isEqual(oldValue, newValue)) {
      // Updated property
      changes.push({
        path,
        type: 'update',
        oldValue,
        newValue,
      });
    }
  }

  return changes;
}

/**
 * Find conflicting changes between local and server
 */
function findConflictingChanges(
  localChanges: Change[],
  serverChanges: Change[],
  baseData: ReactFlowData
): ConflictContext[] {
  const conflicts: ConflictContext[] = [];
  const serverChangeMap = new Map(serverChanges.map(change => [change.path, change]));

  for (const localChange of localChanges) {
    const serverChange = serverChangeMap.get(localChange.path);

    if (serverChange && !isEqual(localChange.newValue, serverChange.newValue)) {
      // Found a conflict
      const baseValue = get(baseData, localChange.path);
      const confidence = calculateConflictConfidence(localChange, serverChange, baseValue);

      conflicts.push({
        path: localChange.path,
        localChange,
        serverChange,
        baseValue,
        confidence,
      });
    }
  }

  return conflicts;
}

/**
 * Calculate confidence for auto-resolving conflicts
 */
function calculateConflictConfidence(
  localChange: Change,
  serverChange: Change,
  baseValue: any
): number {
  let confidence = 0;

  // If one change is addition and the other is deletion, low confidence
  if ((localChange.type === 'add' && serverChange.type === 'delete') ||
      (localChange.type === 'delete' && serverChange.type === 'add')) {
    return 0.1;
  }

  // If both are additions with similar values, higher confidence
  if (localChange.type === 'add' && serverChange.type === 'add') {
    const similarity = calculateValueSimilarity(localChange.newValue, serverChange.newValue);
    confidence = similarity * 0.8;
  }

  // If both are updates, check how different they are from base
  if (localChange.type === 'update' && serverChange.type === 'update') {
    const localDistance = calculateValueDistance(baseValue, localChange.newValue);
    const serverDistance = calculateValueDistance(baseValue, serverChange.newValue);

    // If one change is closer to base, prefer it
    if (localDistance < serverDistance) {
      confidence = 0.7;
    } else if (serverDistance < localDistance) {
      confidence = 0.3;
    } else {
      confidence = 0.5;
    }
  }

  return confidence;
}

/**
 * Calculate similarity between two values
 */
function calculateValueSimilarity(value1: any, value2: any): number {
  if (isEqual(value1, value2)) {
    return 1.0;
  }

  if (typeof value1 !== typeof value2) {
    return 0.0;
  }

  if (typeof value1 === 'string') {
    // Simple string similarity based on length difference
    const maxLength = Math.max(value1.length, value2.length);
    const lengthDiff = Math.abs(value1.length - value2.length);
    return 1 - (lengthDiff / maxLength);
  }

  if (typeof value1 === 'number') {
    // Numerical similarity based on relative difference
    const maxValue = Math.max(Math.abs(value1), Math.abs(value2));
    if (maxValue === 0) return 1.0;
    const diff = Math.abs(value1 - value2);
    return 1 - (diff / maxValue);
  }

  if (typeof value1 === 'object' && value1 !== null && value2 !== null) {
    // Object similarity based on common properties
    const keys1 = Object.keys(value1);
    const keys2 = Object.keys(value2);
    const allKeys = new Set([...keys1, ...keys2]);
    const commonKeys = keys1.filter(key => keys2.includes(key));

    return commonKeys.length / allKeys.size;
  }

  return 0.5; // Default similarity for unknown types
}

/**
 * Calculate distance between two values
 */
function calculateValueDistance(value1: any, value2: any): number {
  return 1 - calculateValueSimilarity(value1, value2);
}

/**
 * Check if a conflict can be auto-resolved
 */
function canAutoResolveConflict(
  conflict: ConflictingChange,
  strategy: 'local' | 'server' | 'smart'
): boolean {
  if (strategy === 'local' || strategy === 'server') {
    return true; // Always can resolve with explicit strategy
  }

  // Smart resolution rules
  if (strategy === 'smart') {
    // High confidence changes can be auto-resolved
    if (conflict.confidence > 0.8) {
      return true;
    }

    // Viewport changes are usually safe to auto-resolve
    if (conflict.path.startsWith('viewport')) {
      return true;
    }

    // Style changes might be safe
    if (conflict.path.includes('style') && conflict.confidence > 0.6) {
      return true;
    }

    // Position changes with high confidence
    if ((conflict.path.includes('position') || conflict.path.includes('x') || conflict.path.includes('y')) &&
        conflict.confidence > 0.7) {
      return true;
    }
  }

  return false;
}

/**
 * Apply a change to data
 */
function applyChange(data: any, change: Change): void {
  switch (change.type) {
    case 'add':
    case 'update':
      set(data, change.path, change.newValue);
      break;
    case 'delete':
      unset(data, change.path);
      break;
    case 'move':
      // Handle move operations if needed
      break;
  }
}