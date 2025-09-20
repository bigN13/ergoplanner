/**
 * Data Utilities for Auto-save System
 * TASK-023: Auto-save Functionality
 *
 * Utility functions for data manipulation, compression,
 * checksums, and data integrity verification.
 */

import { deflate, inflate } from 'pako';

/**
 * Calculate checksum for data integrity verification
 */
export function calculateChecksum(data: any): string {
  try {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);

    // Simple hash function (in production, use a proper crypto hash)
    let hash = 0;
    if (jsonString.length === 0) return hash.toString();

    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
  } catch (error) {
    console.error('Failed to calculate checksum:', error);
    return 'error';
  }
}

/**
 * Compress data using deflate algorithm
 */
export function compressData(data: any): string {
  try {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    const compressed = deflate(jsonString, { level: 6 });

    // Convert to base64 for storage
    return btoa(String.fromCharCode.apply(null, Array.from(compressed)));
  } catch (error) {
    console.error('Failed to compress data:', error);
    throw new Error('Data compression failed');
  }
}

/**
 * Decompress data
 */
export function decompressData(compressedData: string): any {
  try {
    // Convert from base64
    const binaryString = atob(compressedData);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const decompressed = inflate(bytes, { to: 'string' });
    return JSON.parse(decompressed);
  } catch (error) {
    console.error('Failed to decompress data:', error);
    throw new Error('Data decompression failed');
  }
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as any;
  }

  if (typeof obj === 'object') {
    const cloned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }

  return obj;
}

/**
 * Estimate object size in bytes
 */
export function getObjectSize(obj: any): number {
  try {
    const jsonString = JSON.stringify(obj);
    return new Blob([jsonString]).size;
  } catch (error) {
    console.error('Failed to calculate object size:', error);
    return 0;
  }
}

/**
 * Sanitize data for safe storage/transmission
 */
export function sanitizeData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Remove potentially harmful characters
    return data.replace(/[<>\"'&]/g, '');
  }

  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(item => sanitizeData(item));
    }

    const sanitized: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const sanitizedKey = typeof key === 'string' ? key.replace(/[<>\"'&]/g, '') : key;
        sanitized[sanitizedKey] = sanitizeData(data[key]);
      }
    }
    return sanitized;
  }

  return data;
}

/**
 * Validate data structure
 */
export function validateDataStructure(data: any, schema: any): boolean {
  try {
    // Basic structure validation
    if (typeof data !== typeof schema) {
      return false;
    }

    if (Array.isArray(schema)) {
      if (!Array.isArray(data)) return false;
      // Validate array elements if schema has elements
      if (schema.length > 0 && data.length > 0) {
        return data.every(item => validateDataStructure(item, schema[0]));
      }
      return true;
    }

    if (typeof schema === 'object' && schema !== null) {
      if (typeof data !== 'object' || data === null) return false;

      // Check required properties
      for (const key in schema) {
        if (schema.hasOwnProperty(key)) {
          if (!(key in data)) return false;
          if (!validateDataStructure(data[key], schema[key])) return false;
        }
      }
      return true;
    }

    return true;
  } catch (error) {
    console.error('Data structure validation failed:', error);
    return false;
  }
}

/**
 * Create a diff between two objects
 */
export function createDiff(oldObj: any, newObj: any): any[] {
  const changes: any[] = [];

  function findChanges(old: any, new_: any, path: string = '') {
    if (old === new_) return;

    if (typeof old !== typeof new_) {
      changes.push({
        path,
        type: 'replace',
        oldValue: old,
        newValue: new_,
      });
      return;
    }

    if (Array.isArray(old) && Array.isArray(new_)) {
      const maxLength = Math.max(old.length, new_.length);

      for (let i = 0; i < maxLength; i++) {
        const currentPath = path ? `${path}[${i}]` : `[${i}]`;

        if (i >= old.length) {
          changes.push({
            path: currentPath,
            type: 'add',
            newValue: new_[i],
          });
        } else if (i >= new_.length) {
          changes.push({
            path: currentPath,
            type: 'remove',
            oldValue: old[i],
          });
        } else {
          findChanges(old[i], new_[i], currentPath);
        }
      }
      return;
    }

    if (typeof old === 'object' && old !== null && typeof new_ === 'object' && new_ !== null) {
      const allKeys = new Set([...Object.keys(old), ...Object.keys(new_)]);

      for (const key of allKeys) {
        const currentPath = path ? `${path}.${key}` : key;

        if (!(key in old)) {
          changes.push({
            path: currentPath,
            type: 'add',
            newValue: new_[key],
          });
        } else if (!(key in new_)) {
          changes.push({
            path: currentPath,
            type: 'remove',
            oldValue: old[key],
          });
        } else {
          findChanges(old[key], new_[key], currentPath);
        }
      }
      return;
    }

    changes.push({
      path,
      type: 'replace',
      oldValue: old,
      newValue: new_,
    });
  }

  findChanges(oldObj, newObj);
  return changes;
}

/**
 * Apply a diff to an object
 */
export function applyDiff(obj: any, diff: any[]): any {
  let result = deepClone(obj);

  for (const change of diff) {
    const { path, type, newValue } = change;

    try {
      switch (type) {
        case 'add':
        case 'replace':
          setValueAtPath(result, path, newValue);
          break;
        case 'remove':
          deleteValueAtPath(result, path);
          break;
      }
    } catch (error) {
      console.error(`Failed to apply diff change at path ${path}:`, error);
    }
  }

  return result;
}

/**
 * Set value at a given path in an object
 */
function setValueAtPath(obj: any, path: string, value: any): void {
  const parts = path.split(/[.\[\]]/).filter(part => part !== '');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const nextPart = parts[i + 1];

    if (!(part in current)) {
      current[part] = /^\d+$/.test(nextPart) ? [] : {};
    }

    current = current[part];
  }

  const lastPart = parts[parts.length - 1];
  current[lastPart] = value;
}

/**
 * Delete value at a given path in an object
 */
function deleteValueAtPath(obj: any, path: string): void {
  const parts = path.split(/[.\[\]]/).filter(part => part !== '');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current)) return;
    current = current[part];
  }

  const lastPart = parts[parts.length - 1];
  if (Array.isArray(current)) {
    const index = parseInt(lastPart, 10);
    if (!isNaN(index)) {
      current.splice(index, 1);
    }
  } else {
    delete current[lastPart];
  }
}

/**
 * Merge two objects deeply
 */
export function deepMerge(target: any, source: any): any {
  if (!source || typeof source !== 'object') {
    return target;
  }

  if (!target || typeof target !== 'object') {
    return source;
  }

  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
        result[key] = deepMerge(result[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }

  return result;
}

/**
 * Check if two objects are deeply equal
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  if (!a || !b || (typeof a !== 'object' && typeof b !== 'object')) {
    return a === b;
  }

  if (a === null || a === undefined || b === null || b === undefined) {
    return false;
  }

  if (a.prototype !== b.prototype) return false;

  let keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) {
    return false;
  }

  return keys.every(k => deepEqual(a[k], b[k]));
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate a unique identifier
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}