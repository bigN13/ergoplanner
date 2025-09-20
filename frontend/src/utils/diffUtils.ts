/**
 * Diff Utilities for Auto-save System
 * TASK-023: Auto-save Functionality
 *
 * Advanced diff algorithms for detecting changes between
 * drawing states and supporting three-way merges.
 */

import { isEqual, cloneDeep } from 'lodash-es';

// Diff operation types
export type DiffOperationType = 'add' | 'remove' | 'replace' | 'move' | 'copy';

// Diff operation interface
export interface DiffOperation {
  op: DiffOperationType;
  path: string;
  value?: any;
  oldValue?: any;
  from?: string; // For move/copy operations
}

// Diff result interface
export interface DiffResult {
  operations: DiffOperation[];
  totalChanges: number;
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
}

/**
 * Create a detailed diff between two objects
 */
export function createDiff(source: any, target: any, basePath: string = ''): DiffResult {
  const operations: DiffOperation[] = [];
  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;

  function generateDiff(src: any, tgt: any, path: string) {
    // Handle null/undefined cases
    if (src === null || src === undefined) {
      if (tgt !== null && tgt !== undefined) {
        operations.push({
          op: 'add',
          path,
          value: tgt,
        });
        addedCount++;
      }
      return;
    }

    if (tgt === null || tgt === undefined) {
      operations.push({
        op: 'remove',
        path,
        oldValue: src,
      });
      removedCount++;
      return;
    }

    // Handle primitive types
    if (typeof src !== 'object' || typeof tgt !== 'object') {
      if (!isEqual(src, tgt)) {
        operations.push({
          op: 'replace',
          path,
          value: tgt,
          oldValue: src,
        });
        modifiedCount++;
      }
      return;
    }

    // Handle arrays
    if (Array.isArray(src) && Array.isArray(tgt)) {
      generateArrayDiff(src, tgt, path);
      return;
    }

    // Handle objects
    if (!Array.isArray(src) && !Array.isArray(tgt)) {
      generateObjectDiff(src, tgt, path);
      return;
    }

    // Type mismatch - replace entire value
    operations.push({
      op: 'replace',
      path,
      value: tgt,
      oldValue: src,
    });
    modifiedCount++;
  }

  function generateArrayDiff(srcArray: any[], tgtArray: any[], path: string) {
    // Use longest common subsequence algorithm for better array diffing
    const lcs = findLCS(srcArray, tgtArray);
    const srcIndexMap = new Map<any, number[]>();
    const tgtIndexMap = new Map<any, number[]>();

    // Build index maps for LCS items
    srcArray.forEach((item, index) => {
      if (!srcIndexMap.has(item)) srcIndexMap.set(item, []);
      srcIndexMap.get(item)!.push(index);
    });

    tgtArray.forEach((item, index) => {
      if (!tgtIndexMap.has(item)) tgtIndexMap.set(item, []);
      tgtIndexMap.get(item)!.push(index);
    });

    // Track processed indices
    const processedSrc = new Set<number>();
    const processedTgt = new Set<number>();

    // Process LCS items (unchanged items)
    for (const item of lcs) {
      const srcIndices = srcIndexMap.get(item) || [];
      const tgtIndices = tgtIndexMap.get(item) || [];

      const srcIndex = srcIndices.find(i => !processedSrc.has(i));
      const tgtIndex = tgtIndices.find(i => !processedTgt.has(i));

      if (srcIndex !== undefined && tgtIndex !== undefined) {
        processedSrc.add(srcIndex);
        processedTgt.add(tgtIndex);

        // Check if item was moved
        if (srcIndex !== tgtIndex) {
          operations.push({
            op: 'move',
            path: `${path}[${tgtIndex}]`,
            from: `${path}[${srcIndex}]`,
            value: item,
          });
          modifiedCount++;
        } else {
          // Item unchanged, but check for deep changes
          generateDiff(srcArray[srcIndex], tgtArray[tgtIndex], `${path}[${tgtIndex}]`);
        }
      }
    }

    // Process removed items
    srcArray.forEach((item, index) => {
      if (!processedSrc.has(index)) {
        operations.push({
          op: 'remove',
          path: `${path}[${index}]`,
          oldValue: item,
        });
        removedCount++;
      }
    });

    // Process added items
    tgtArray.forEach((item, index) => {
      if (!processedTgt.has(index)) {
        operations.push({
          op: 'add',
          path: `${path}[${index}]`,
          value: item,
        });
        addedCount++;
      }
    });
  }

  function generateObjectDiff(srcObj: any, tgtObj: any, path: string) {
    const srcKeys = new Set(Object.keys(srcObj));
    const tgtKeys = new Set(Object.keys(tgtObj));
    const allKeys = new Set([...srcKeys, ...tgtKeys]);

    for (const key of allKeys) {
      const keyPath = path ? `${path}.${key}` : key;

      if (!srcKeys.has(key)) {
        // Key added
        operations.push({
          op: 'add',
          path: keyPath,
          value: tgtObj[key],
        });
        addedCount++;
      } else if (!tgtKeys.has(key)) {
        // Key removed
        operations.push({
          op: 'remove',
          path: keyPath,
          oldValue: srcObj[key],
        });
        removedCount++;
      } else {
        // Key exists in both - check for changes
        generateDiff(srcObj[key], tgtObj[key], keyPath);
      }
    }
  }

  generateDiff(source, target, basePath);

  return {
    operations,
    totalChanges: operations.length,
    addedCount,
    removedCount,
    modifiedCount,
  };
}

/**
 * Apply a diff to an object
 */
export function applyDiff(source: any, diffResult: DiffResult): any {
  let result = cloneDeep(source);

  // Sort operations by type priority (remove -> add -> replace -> move)
  const sortedOps = [...diffResult.operations].sort((a, b) => {
    const priority = { remove: 0, add: 1, replace: 2, move: 3, copy: 4 };
    return priority[a.op] - priority[b.op];
  });

  for (const operation of sortedOps) {
    try {
      result = applyOperation(result, operation);
    } catch (error) {
      console.error(`Failed to apply operation ${operation.op} at ${operation.path}:`, error);
    }
  }

  return result;
}

/**
 * Apply a single diff operation
 */
function applyOperation(obj: any, operation: DiffOperation): any {
  const { op, path, value, from } = operation;

  switch (op) {
    case 'add':
    case 'replace':
      return setValueAtPath(obj, path, value);

    case 'remove':
      return removeValueAtPath(obj, path);

    case 'move':
      if (!from) throw new Error('Move operation requires "from" path');
      const valueToMove = getValueAtPath(obj, from);
      const withoutOld = removeValueAtPath(obj, from);
      return setValueAtPath(withoutOld, path, valueToMove);

    case 'copy':
      if (!from) throw new Error('Copy operation requires "from" path');
      const valueToCopy = getValueAtPath(obj, from);
      return setValueAtPath(obj, path, cloneDeep(valueToCopy));

    default:
      throw new Error(`Unknown operation type: ${op}`);
  }
}

/**
 * Merge multiple diffs
 */
export function mergeDiffs(...diffs: DiffResult[]): DiffResult {
  const allOperations: DiffOperation[] = [];
  let totalAdded = 0;
  let totalRemoved = 0;
  let totalModified = 0;

  for (const diff of diffs) {
    allOperations.push(...diff.operations);
    totalAdded += diff.addedCount;
    totalRemoved += diff.removedCount;
    totalModified += diff.modifiedCount;
  }

  // Remove duplicate operations (later operations override earlier ones)
  const operationMap = new Map<string, DiffOperation>();

  for (const operation of allOperations) {
    operationMap.set(operation.path, operation);
  }

  const uniqueOperations = Array.from(operationMap.values());

  return {
    operations: uniqueOperations,
    totalChanges: uniqueOperations.length,
    addedCount: totalAdded,
    removedCount: totalRemoved,
    modifiedCount: totalModified,
  };
}

/**
 * Invert a diff (create reverse diff)
 */
export function invertDiff(diffResult: DiffResult): DiffResult {
  const invertedOps: DiffOperation[] = [];

  for (const operation of diffResult.operations) {
    switch (operation.op) {
      case 'add':
        invertedOps.push({
          op: 'remove',
          path: operation.path,
          oldValue: operation.value,
        });
        break;

      case 'remove':
        invertedOps.push({
          op: 'add',
          path: operation.path,
          value: operation.oldValue,
        });
        break;

      case 'replace':
        invertedOps.push({
          op: 'replace',
          path: operation.path,
          value: operation.oldValue,
          oldValue: operation.value,
        });
        break;

      case 'move':
        invertedOps.push({
          op: 'move',
          path: operation.from!,
          from: operation.path,
          value: operation.value,
        });
        break;

      case 'copy':
        invertedOps.push({
          op: 'remove',
          path: operation.path,
          oldValue: operation.value,
        });
        break;
    }
  }

  return {
    operations: invertedOps.reverse(), // Reverse order for proper undo
    totalChanges: invertedOps.length,
    addedCount: diffResult.removedCount,
    removedCount: diffResult.addedCount,
    modifiedCount: diffResult.modifiedCount,
  };
}

/**
 * Find longest common subsequence for array diffing
 */
function findLCS(arr1: any[], arr2: any[]): any[] {
  const m = arr1.length;
  const n = arr2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  // Build LCS table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (isEqual(arr1[i - 1], arr2[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Reconstruct LCS
  const lcs: any[] = [];
  let i = m, j = n;

  while (i > 0 && j > 0) {
    if (isEqual(arr1[i - 1], arr2[j - 1])) {
      lcs.unshift(arr1[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

/**
 * Get value at path in object
 */
function getValueAtPath(obj: any, path: string): any {
  const parts = parsePath(path);
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

/**
 * Set value at path in object
 */
function setValueAtPath(obj: any, path: string, value: any): any {
  const result = cloneDeep(obj);
  const parts = parsePath(path);
  let current = result;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const nextPart = parts[i + 1];

    if (current[part] === null || current[part] === undefined) {
      current[part] = /^\d+$/.test(nextPart) ? [] : {};
    }

    current = current[part];
  }

  const lastPart = parts[parts.length - 1];
  current[lastPart] = value;

  return result;
}

/**
 * Remove value at path in object
 */
function removeValueAtPath(obj: any, path: string): any {
  const result = cloneDeep(obj);
  const parts = parsePath(path);
  let current = result;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === null || current[part] === undefined) {
      return result; // Path doesn't exist
    }
    current = current[part];
  }

  const lastPart = parts[parts.length - 1];

  if (Array.isArray(current)) {
    const index = parseInt(lastPart, 10);
    if (!isNaN(index) && index >= 0 && index < current.length) {
      current.splice(index, 1);
    }
  } else if (typeof current === 'object' && current !== null) {
    delete current[lastPart];
  }

  return result;
}

/**
 * Parse path string into parts
 */
function parsePath(path: string): string[] {
  if (!path) return [];

  return path
    .split(/[.\[\]]/)
    .filter(part => part !== '')
    .map(part => {
      // Convert numeric strings back to numbers for array indices
      if (/^\d+$/.test(part)) {
        return part;
      }
      return part;
    });
}

/**
 * Check if two diffs are conflicting
 */
export function areConflicting(diff1: DiffResult, diff2: DiffResult): boolean {
  const paths1 = new Set(diff1.operations.map(op => op.path));
  const paths2 = new Set(diff2.operations.map(op => op.path));

  // Check for direct path conflicts
  for (const path of paths1) {
    if (paths2.has(path)) {
      return true;
    }

    // Check for parent-child conflicts
    for (const otherPath of paths2) {
      if (isPathAncestor(path, otherPath) || isPathAncestor(otherPath, path)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if one path is an ancestor of another
 */
function isPathAncestor(ancestorPath: string, descendantPath: string): boolean {
  if (ancestorPath === descendantPath) return false;

  const ancestorParts = parsePath(ancestorPath);
  const descendantParts = parsePath(descendantPath);

  if (ancestorParts.length >= descendantParts.length) return false;

  for (let i = 0; i < ancestorParts.length; i++) {
    if (ancestorParts[i] !== descendantParts[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Get diff statistics
 */
export function getDiffStatistics(diffResult: DiffResult) {
  const operationTypes = diffResult.operations.reduce((acc, op) => {
    acc[op.op] = (acc[op.op] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pathDepths = diffResult.operations.map(op => parsePath(op.path).length);
  const avgDepth = pathDepths.length > 0
    ? pathDepths.reduce((sum, depth) => sum + depth, 0) / pathDepths.length
    : 0;

  return {
    totalOperations: diffResult.totalChanges,
    operationTypes,
    averagePathDepth: avgDepth,
    maxPathDepth: Math.max(...pathDepths, 0),
    affectedPaths: new Set(diffResult.operations.map(op => op.path)).size,
  };
}

export default {
  createDiff,
  applyDiff,
  mergeDiffs,
  invertDiff,
  areConflicting,
  getDiffStatistics,
};