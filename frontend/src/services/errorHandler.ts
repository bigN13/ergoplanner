/**
 * Error Handling and Retry Service
 * TASK-023: Auto-save Functionality
 *
 * Comprehensive error handling with retry mechanisms,
 * error classification, and recovery strategies.
 */

import { EventEmitter } from 'events';
import { nanoid } from '@reduxjs/toolkit';
import type {
  SaveError,
  SaveOperation,
  AutoSaveConfig,
} from '@/types/autosave';

// Error categories
export type ErrorCategory =
  | 'network'        // Network connectivity issues
  | 'server'         // Server-side errors
  | 'validation'     // Data validation errors
  | 'conflict'       // Version conflicts
  | 'quota'          // Storage quota exceeded
  | 'permission'     // Authorization/permission errors
  | 'timeout'        // Operation timeouts
  | 'corruption'     // Data corruption
  | 'unknown';       // Unclassified errors

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Retry strategy types
export type RetryStrategy = 'exponential' | 'linear' | 'fixed' | 'custom';

// Enhanced error information
export interface EnhancedError extends SaveError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  retryable: boolean;
  autoRetry: boolean;
  userAction: string;
  context: ErrorContext;
  occurrence: number;
  firstOccurred: number;
  lastOccurred: number;
}

// Error context information
export interface ErrorContext {
  operationId?: string;
  operationType?: string;
  drawingId?: string;
  userId?: string;
  sessionId?: string;
  networkStatus?: boolean;
  payload?: any;
  stackTrace?: string;
  userAgent?: string;
  timestamp: number;
}

// Retry configuration
export interface RetryConfig {
  strategy: RetryStrategy;
  maxAttempts: number;
  baseDelay: number;        // Base delay in milliseconds
  maxDelay: number;         // Maximum delay in milliseconds
  backoffMultiplier: number; // Multiplier for exponential backoff
  jitter: boolean;          // Add random jitter to delays
  timeoutMultiplier: number; // Increase timeout with each retry
}

// Error handling configuration
export interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableReporting: boolean;
  enableUserNotifications: boolean;
  maxErrorHistory: number;
  retryConfigs: Record<ErrorCategory, RetryConfig>;
  autoRetryCategories: ErrorCategory[];
  criticalErrorCategories: ErrorCategory[];
}

// Default retry configurations for different error categories
const DEFAULT_RETRY_CONFIGS: Record<ErrorCategory, RetryConfig> = {
  network: {
    strategy: 'exponential',
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
    timeoutMultiplier: 1.5,
  },
  server: {
    strategy: 'exponential',
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
    timeoutMultiplier: 1.2,
  },
  timeout: {
    strategy: 'linear',
    maxAttempts: 3,
    baseDelay: 5000,
    maxDelay: 15000,
    backoffMultiplier: 1,
    jitter: false,
    timeoutMultiplier: 2,
  },
  validation: {
    strategy: 'fixed',
    maxAttempts: 1,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
    jitter: false,
    timeoutMultiplier: 1,
  },
  conflict: {
    strategy: 'fixed',
    maxAttempts: 1,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
    jitter: false,
    timeoutMultiplier: 1,
  },
  quota: {
    strategy: 'fixed',
    maxAttempts: 1,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
    jitter: false,
    timeoutMultiplier: 1,
  },
  permission: {
    strategy: 'exponential',
    maxAttempts: 2,
    baseDelay: 5000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: false,
    timeoutMultiplier: 1,
  },
  corruption: {
    strategy: 'fixed',
    maxAttempts: 1,
    baseDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
    jitter: false,
    timeoutMultiplier: 1,
  },
  unknown: {
    strategy: 'exponential',
    maxAttempts: 2,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2,
    jitter: true,
    timeoutMultiplier: 1.2,
  },
};

const DEFAULT_CONFIG: ErrorHandlerConfig = {
  enableLogging: true,
  enableReporting: true,
  enableUserNotifications: true,
  maxErrorHistory: 100,
  retryConfigs: DEFAULT_RETRY_CONFIGS,
  autoRetryCategories: ['network', 'server', 'timeout'],
  criticalErrorCategories: ['corruption', 'permission'],
};

// Error handler events
export interface ErrorHandlerEvents {
  'error-occurred': (error: EnhancedError) => void;
  'error-recovered': (error: EnhancedError) => void;
  'retry-attempted': (error: EnhancedError, attempt: number) => void;
  'retry-exhausted': (error: EnhancedError) => void;
  'critical-error': (error: EnhancedError) => void;
}

/**
 * Error Handler Service
 *
 * Provides comprehensive error handling with:
 * - Error classification and categorization
 * - Intelligent retry mechanisms
 * - Error recovery strategies
 * - User-friendly error messages
 * - Error reporting and analytics
 * - Circuit breaker patterns
 */
export class ErrorHandler extends EventEmitter {
  private config: ErrorHandlerConfig;
  private errorHistory = new Map<string, EnhancedError>();
  private retryTimers = new Map<string, NodeJS.Timeout>();
  private circuitBreakers = new Map<string, CircuitBreaker>();

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Handle an error from a save operation
   */
  public async handleError(
    error: Error | SaveError,
    operation: SaveOperation,
    context: Partial<ErrorContext> = {}
  ): Promise<EnhancedError> {
    // Create enhanced error
    const enhancedError = this.createEnhancedError(error, operation, context);

    // Log the error
    if (this.config.enableLogging) {
      this.logError(enhancedError);
    }

    // Check circuit breaker
    const circuitBreaker = this.getCircuitBreaker(enhancedError.category);
    if (circuitBreaker.isOpen()) {
      enhancedError.retryable = false;
      enhancedError.userAction = 'Service temporarily unavailable. Please try again later.';
    }

    // Store in history
    this.storeError(enhancedError);

    // Emit event
    this.emit('error-occurred', enhancedError);

    // Handle critical errors
    if (this.config.criticalErrorCategories.includes(enhancedError.category)) {
      this.emit('critical-error', enhancedError);
    }

    // Attempt automatic retry if applicable
    if (enhancedError.autoRetry && enhancedError.retryable) {
      await this.scheduleRetry(enhancedError, operation);
    }

    // Report error if enabled
    if (this.config.enableReporting) {
      this.reportError(enhancedError);
    }

    return enhancedError;
  }

  /**
   * Manually retry an operation
   */
  public async retryOperation(
    errorId: string,
    operation: SaveOperation
  ): Promise<boolean> {
    const error = this.errorHistory.get(errorId);
    if (!error) {
      throw new Error('Error not found');
    }

    if (!error.retryable) {
      throw new Error('Error is not retryable');
    }

    return this.attemptRetry(error, operation);
  }

  /**
   * Get error statistics
   */
  public getErrorStatistics() {
    const errors = Array.from(this.errorHistory.values());
    const now = Date.now();
    const lastHour = now - (60 * 60 * 1000);
    const lastDay = now - (24 * 60 * 60 * 1000);

    return {
      total: errors.length,
      lastHour: errors.filter(e => e.lastOccurred > lastHour).length,
      lastDay: errors.filter(e => e.lastOccurred > lastDay).length,
      byCategory: this.groupErrorsByCategory(errors),
      bySeverity: this.groupErrorsBySeverity(errors),
      mostCommon: this.getMostCommonErrors(errors),
      circuitBreakers: this.getCircuitBreakerStatus(),
    };
  }

  /**
   * Clear error history
   */
  public clearErrorHistory(): void {
    this.errorHistory.clear();

    // Clear retry timers
    for (const timer of this.retryTimers.values()) {
      clearTimeout(timer);
    }
    this.retryTimers.clear();
  }

  /**
   * Create enhanced error from basic error
   */
  private createEnhancedError(
    error: Error | SaveError,
    operation: SaveOperation,
    context: Partial<ErrorContext>
  ): EnhancedError {
    const errorCode = 'code' in error ? error.code : error.name;
    const errorMessage = error.message;

    // Classify error
    const category = this.classifyError(error);
    const severity = this.determineSeverity(category, error);

    // Check if this error has occurred before
    const existingError = this.findExistingError(errorCode, operation.drawingId);

    const enhancedError: EnhancedError = {
      id: existingError?.id || nanoid(),
      code: errorCode,
      message: errorMessage,
      details: 'details' in error ? error.details : undefined,
      timestamp: Date.now(),
      recoverable: this.isRecoverable(category),
      suggested_action: this.getSuggestedAction(category, error),
      category,
      severity,
      retryable: this.isRetryable(category),
      autoRetry: this.shouldAutoRetry(category),
      userAction: this.getUserActionMessage(category, error),
      context: {
        operationId: operation.id,
        operationType: operation.type,
        drawingId: operation.drawingId,
        networkStatus: navigator.onLine,
        timestamp: Date.now(),
        ...context,
      },
      occurrence: existingError ? existingError.occurrence + 1 : 1,
      firstOccurred: existingError?.firstOccurred || Date.now(),
      lastOccurred: Date.now(),
    };

    return enhancedError;
  }

  /**
   * Classify error into category
   */
  private classifyError(error: Error | SaveError): ErrorCategory {
    const message = error.message.toLowerCase();
    const code = 'code' in error ? error.code : error.name;

    // Network errors
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      code.includes('NETWORK')
    ) {
      return 'network';
    }

    // Server errors
    if (
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504') ||
      message.includes('server error')
    ) {
      return 'server';
    }

    // Validation errors
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required') ||
      code.includes('VALIDATION')
    ) {
      return 'validation';
    }

    // Conflict errors
    if (
      message.includes('conflict') ||
      message.includes('409') ||
      code.includes('CONFLICT')
    ) {
      return 'conflict';
    }

    // Quota errors
    if (
      message.includes('quota') ||
      message.includes('limit') ||
      message.includes('storage') ||
      code.includes('QUOTA')
    ) {
      return 'quota';
    }

    // Permission errors
    if (
      message.includes('403') ||
      message.includes('401') ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      code.includes('AUTH')
    ) {
      return 'permission';
    }

    // Timeout errors
    if (
      message.includes('timeout') ||
      code.includes('TIMEOUT')
    ) {
      return 'timeout';
    }

    // Corruption errors
    if (
      message.includes('corruption') ||
      message.includes('checksum') ||
      message.includes('integrity') ||
      code.includes('CORRUPTION')
    ) {
      return 'corruption';
    }

    return 'unknown';
  }

  /**
   * Determine error severity
   */
  private determineSeverity(category: ErrorCategory, error: Error | SaveError): ErrorSeverity {
    // Critical errors
    if (category === 'corruption' || category === 'permission') {
      return 'critical';
    }

    // High severity errors
    if (category === 'conflict' || category === 'quota') {
      return 'high';
    }

    // Medium severity errors
    if (category === 'server' || category === 'timeout') {
      return 'medium';
    }

    // Low severity errors (network, validation, unknown)
    return 'low';
  }

  /**
   * Check if error is recoverable
   */
  private isRecoverable(category: ErrorCategory): boolean {
    switch (category) {
      case 'network':
      case 'server':
      case 'timeout':
        return true;
      case 'validation':
      case 'conflict':
      case 'quota':
      case 'permission':
      case 'corruption':
        return false;
      default:
        return false;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(category: ErrorCategory): boolean {
    const retryConfig = this.config.retryConfigs[category];
    return retryConfig.maxAttempts > 0;
  }

  /**
   * Check if error should be auto-retried
   */
  private shouldAutoRetry(category: ErrorCategory): boolean {
    return this.config.autoRetryCategories.includes(category);
  }

  /**
   * Get suggested action for error
   */
  private getSuggestedAction(category: ErrorCategory, error: Error | SaveError): string {
    switch (category) {
      case 'network':
        return 'Check your internet connection and try again';
      case 'server':
        return 'Server is temporarily unavailable. Will retry automatically';
      case 'validation':
        return 'Please check your data and correct any errors';
      case 'conflict':
        return 'Resolve conflicts and try saving again';
      case 'quota':
        return 'Storage quota exceeded. Please free up space';
      case 'permission':
        return 'You do not have permission to perform this action';
      case 'timeout':
        return 'Operation timed out. Will retry with longer timeout';
      case 'corruption':
        return 'Data corruption detected. Please refresh and try again';
      default:
        return 'An unexpected error occurred. Please try again';
    }
  }

  /**
   * Get user-friendly action message
   */
  private getUserActionMessage(category: ErrorCategory, error: Error | SaveError): string {
    switch (category) {
      case 'network':
        return 'Check your connection and we\'ll retry automatically';
      case 'server':
        return 'Server issue detected. Retrying automatically...';
      case 'validation':
        return 'Please fix the highlighted errors and save again';
      case 'conflict':
        return 'Click "Resolve Conflicts" to merge changes';
      case 'quota':
        return 'Contact your administrator to increase storage';
      case 'permission':
        return 'Contact your administrator for access';
      case 'timeout':
        return 'Large file detected. Increasing timeout and retrying...';
      case 'corruption':
        return 'Data integrity issue. Please refresh the page';
      default:
        return 'Try saving again or contact support if the problem persists';
    }
  }

  /**
   * Schedule automatic retry
   */
  private async scheduleRetry(error: EnhancedError, operation: SaveOperation): Promise<void> {
    const retryConfig = this.config.retryConfigs[error.category];
    const delay = this.calculateRetryDelay(error.occurrence, retryConfig);

    if (error.occurrence >= retryConfig.maxAttempts) {
      this.emit('retry-exhausted', error);
      return;
    }

    const timer = setTimeout(async () => {
      this.retryTimers.delete(error.id);
      await this.attemptRetry(error, operation);
    }, delay);

    this.retryTimers.set(error.id, timer);
  }

  /**
   * Attempt retry
   */
  private async attemptRetry(error: EnhancedError, operation: SaveOperation): Promise<boolean> {
    this.emit('retry-attempted', error, error.occurrence);

    try {
      // This would integrate with the auto-save service to retry the operation
      // For now, we'll simulate the retry
      const success = await this.simulateRetry(error, operation);

      if (success) {
        this.emit('error-recovered', error);
        this.getCircuitBreaker(error.category).recordSuccess();
        return true;
      } else {
        throw new Error('Retry failed');
      }
    } catch (retryError) {
      this.getCircuitBreaker(error.category).recordFailure();

      // Schedule another retry if attempts remaining
      if (error.occurrence < this.config.retryConfigs[error.category].maxAttempts) {
        error.occurrence++;
        error.lastOccurred = Date.now();
        await this.scheduleRetry(error, operation);
      } else {
        this.emit('retry-exhausted', error);
      }

      return false;
    }
  }

  /**
   * Calculate retry delay
   */
  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    let delay: number;

    switch (config.strategy) {
      case 'exponential':
        delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
        break;
      case 'linear':
        delay = config.baseDelay * attempt;
        break;
      case 'fixed':
        delay = config.baseDelay;
        break;
      default:
        delay = config.baseDelay;
    }

    // Apply maximum delay limit
    delay = Math.min(delay, config.maxDelay);

    // Add jitter if enabled
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return delay;
  }

  /**
   * Store error in history
   */
  private storeError(error: EnhancedError): void {
    this.errorHistory.set(error.id, error);

    // Maintain history size limit
    if (this.errorHistory.size > this.config.maxErrorHistory) {
      const oldest = Array.from(this.errorHistory.entries())
        .sort(([, a], [, b]) => a.firstOccurred - b.firstOccurred)[0];

      if (oldest) {
        this.errorHistory.delete(oldest[0]);
      }
    }
  }

  /**
   * Find existing error
   */
  private findExistingError(code: string, drawingId: string): EnhancedError | undefined {
    return Array.from(this.errorHistory.values()).find(
      error => error.code === code && error.context.drawingId === drawingId
    );
  }

  /**
   * Get circuit breaker for category
   */
  private getCircuitBreaker(category: ErrorCategory): CircuitBreaker {
    if (!this.circuitBreakers.has(category)) {
      this.circuitBreakers.set(category, new CircuitBreaker());
    }
    return this.circuitBreakers.get(category)!;
  }

  /**
   * Log error
   */
  private logError(error: EnhancedError): void {
    console.error(`[Auto-save Error] ${error.category}:`, {
      id: error.id,
      code: error.code,
      message: error.message,
      severity: error.severity,
      context: error.context,
    });
  }

  /**
   * Report error to analytics/monitoring service
   */
  private reportError(error: EnhancedError): void {
    // This would typically send to an error reporting service
    // For now, we'll just log it
    if (process.env.NODE_ENV === 'production') {
      // Send to error reporting service
      console.log('Reporting error to analytics:', error);
    }
  }

  /**
   * Simulate retry (placeholder)
   */
  private async simulateRetry(error: EnhancedError, operation: SaveOperation): Promise<boolean> {
    // This would integrate with the actual auto-save service
    // For simulation, we'll have a 70% success rate for retryable errors
    return Math.random() > 0.3;
  }

  // Helper methods for statistics
  private groupErrorsByCategory(errors: EnhancedError[]) {
    return errors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1;
      return acc;
    }, {} as Record<ErrorCategory, number>);
  }

  private groupErrorsBySeverity(errors: EnhancedError[]) {
    return errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<ErrorSeverity, number>);
  }

  private getMostCommonErrors(errors: EnhancedError[]) {
    const errorCounts = errors.reduce((acc, error) => {
      const key = `${error.code}:${error.category}`;
      acc[key] = (acc[key] || 0) + error.occurrence;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([key, count]) => ({ error: key, count }));
  }

  private getCircuitBreakerStatus() {
    const status: Record<string, any> = {};
    for (const [category, breaker] of this.circuitBreakers) {
      status[category] = {
        state: breaker.getState(),
        failures: breaker.getFailureCount(),
        nextAttempt: breaker.getNextAttemptTime(),
      };
    }
    return status;
  }
}

/**
 * Circuit Breaker implementation
 */
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failures = 0;
  private lastFailureTime = 0;
  private successes = 0;

  private readonly failureThreshold = 5;
  private readonly resetTimeout = 60000; // 1 minute
  private readonly successThreshold = 2;

  public recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  public recordSuccess(): void {
    this.successes++;

    if (this.state === 'half-open' && this.successes >= this.successThreshold) {
      this.state = 'closed';
      this.failures = 0;
      this.successes = 0;
    }
  }

  public isOpen(): boolean {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open';
        this.successes = 0;
        return false;
      }
      return true;
    }
    return false;
  }

  public getState(): string {
    return this.state;
  }

  public getFailureCount(): number {
    return this.failures;
  }

  public getNextAttemptTime(): number | null {
    if (this.state === 'open') {
      return this.lastFailureTime + this.resetTimeout;
    }
    return null;
  }
}