/**
 * Network Monitoring Service
 * TASK-023: Auto-save Functionality
 *
 * Monitors network connectivity, connection quality, and handles
 * offline/online state changes for the auto-save system.
 */

import { EventEmitter } from 'events';
import type { NetworkStatus } from '@/types/autosave';

// Network event types
export interface NetworkEvents {
  'status-change': (status: NetworkStatus) => void;
  'connection-lost': (lastOnline: number) => void;
  'connection-restored': (downtime: number) => void;
  'quality-change': (quality: 'excellent' | 'good' | 'poor' | 'offline') => void;
  'slow-connection': (rtt: number, downlink: number) => void;
}

// Connection quality thresholds
const QUALITY_THRESHOLDS = {
  excellent: { rtt: 50, downlink: 10 },    // < 50ms RTT, > 10 Mbps
  good: { rtt: 150, downlink: 1 },         // < 150ms RTT, > 1 Mbps
  poor: { rtt: 500, downlink: 0.1 },       // < 500ms RTT, > 0.1 Mbps
} as const;

// Network monitoring configuration
interface NetworkMonitorConfig {
  pingInterval: number;           // Interval for connectivity checks
  pingTimeout: number;           // Timeout for ping requests
  qualityCheckInterval: number;   // Interval for quality assessment
  reconnectAttempts: number;      // Max reconnection attempts
  reconnectDelay: number;         // Base delay between reconnection attempts
  slowConnectionThreshold: number; // RTT threshold for slow connection warning
}

const DEFAULT_CONFIG: NetworkMonitorConfig = {
  pingInterval: 30000,      // 30 seconds
  pingTimeout: 5000,        // 5 seconds
  qualityCheckInterval: 60000, // 1 minute
  reconnectAttempts: 10,
  reconnectDelay: 1000,     // 1 second
  slowConnectionThreshold: 1000, // 1 second
};

/**
 * Network Monitor Service
 *
 * Provides comprehensive network monitoring including:
 * - Online/offline status detection
 * - Connection quality assessment
 * - Automatic reconnection handling
 * - Network performance metrics
 * - Real-time status updates
 */
export class NetworkMonitor extends EventEmitter {
  private config: NetworkMonitorConfig;
  private status: NetworkStatus;
  private isMonitoring = false;

  // Monitoring intervals
  private pingInterval?: NodeJS.Timeout;
  private qualityCheckInterval?: NodeJS.Timeout;
  private reconnectTimer?: NodeJS.Timeout;

  // Connection tracking
  private lastOnlineTime: number = Date.now();
  private reconnectAttempts = 0;
  private connectionHistory: { timestamp: number; online: boolean; rtt?: number }[] = [];

  // Performance tracking
  private rttHistory: number[] = [];
  private downlinkHistory: number[] = [];

  constructor(config: Partial<NetworkMonitorConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.status = this.getInitialNetworkStatus();
    this.initializeEventListeners();
  }

  /**
   * Start network monitoring
   */
  public start(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.updateStatus({ online: navigator.onLine });

    // Start periodic connectivity checks
    this.startConnectivityChecks();

    // Start connection quality monitoring
    this.startQualityMonitoring();

    console.log('Network monitor started');
  }

  /**
   * Stop network monitoring
   */
  public stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    // Clear intervals
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = undefined;
    }

    if (this.qualityCheckInterval) {
      clearInterval(this.qualityCheckInterval);
      this.qualityCheckInterval = undefined;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    console.log('Network monitor stopped');
  }

  /**
   * Get current network status
   */
  public getStatus(): NetworkStatus {
    return { ...this.status };
  }

  /**
   * Get connection quality assessment
   */
  public getConnectionQuality(): 'excellent' | 'good' | 'poor' | 'offline' {
    if (!this.status.online) {
      return 'offline';
    }

    const { rtt = Infinity, downlink = 0 } = this.status;

    if (rtt <= QUALITY_THRESHOLDS.excellent.rtt && downlink >= QUALITY_THRESHOLDS.excellent.downlink) {
      return 'excellent';
    }

    if (rtt <= QUALITY_THRESHOLDS.good.rtt && downlink >= QUALITY_THRESHOLDS.good.downlink) {
      return 'good';
    }

    if (rtt <= QUALITY_THRESHOLDS.poor.rtt && downlink >= QUALITY_THRESHOLDS.poor.downlink) {
      return 'poor';
    }

    return 'poor';
  }

  /**
   * Get network statistics
   */
  public getStatistics() {
    const avgRtt = this.rttHistory.length > 0
      ? this.rttHistory.reduce((sum, rtt) => sum + rtt, 0) / this.rttHistory.length
      : 0;

    const avgDownlink = this.downlinkHistory.length > 0
      ? this.downlinkHistory.reduce((sum, dl) => sum + dl, 0) / this.downlinkHistory.length
      : 0;

    const uptime = this.calculateUptime();

    return {
      averageRtt: avgRtt,
      averageDownlink: avgDownlink,
      uptime,
      reconnectAttempts: this.reconnectAttempts,
      connectionHistory: [...this.connectionHistory],
      quality: this.getConnectionQuality(),
    };
  }

  /**
   * Force a connectivity check
   */
  public async checkConnectivity(): Promise<boolean> {
    try {
      const rtt = await this.performPingTest();

      if (rtt >= 0) {
        this.updateStatus({
          online: true,
          rtt,
          lastOnline: Date.now(),
          reconnectAttempts: 0,
        });

        if (!this.status.online) {
          this.handleConnectionRestored();
        }

        return true;
      } else {
        this.handleConnectionLost();
        return false;
      }
    } catch (error) {
      this.handleConnectionLost();
      return false;
    }
  }

  /**
   * Initialize event listeners for browser network events
   */
  private initializeEventListeners(): void {
    // Basic online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Connection change events (if available)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connection.addEventListener('change', this.handleConnectionChange.bind(this));
      }
    }

    // Page visibility changes (to check connection when page becomes visible)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  /**
   * Get initial network status
   */
  private getInitialNetworkStatus(): NetworkStatus {
    const connection = (navigator as any).connection;

    return {
      online: navigator.onLine,
      connectionType: connection?.type,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveOnline: navigator.onLine,
      reconnectAttempts: 0,
    };
  }

  /**
   * Update network status and emit events
   */
  private updateStatus(updates: Partial<NetworkStatus>): void {
    const previousStatus = { ...this.status };
    this.status = { ...this.status, ...updates };

    // Record connection history
    this.connectionHistory.push({
      timestamp: Date.now(),
      online: this.status.online,
      rtt: this.status.rtt,
    });

    // Keep history size manageable
    if (this.connectionHistory.length > 100) {
      this.connectionHistory.shift();
    }

    // Update performance history
    if (this.status.rtt !== undefined) {
      this.rttHistory.push(this.status.rtt);
      if (this.rttHistory.length > 50) {
        this.rttHistory.shift();
      }
    }

    if (this.status.downlink !== undefined) {
      this.downlinkHistory.push(this.status.downlink);
      if (this.downlinkHistory.length > 50) {
        this.downlinkHistory.shift();
      }
    }

    // Emit status change event
    this.emit('status-change', this.status);

    // Emit quality change if it changed
    const previousQuality = this.getQualityFromStatus(previousStatus);
    const currentQuality = this.getConnectionQuality();
    if (previousQuality !== currentQuality) {
      this.emit('quality-change', currentQuality);
    }

    // Emit slow connection warning
    if (this.status.rtt && this.status.rtt > this.config.slowConnectionThreshold) {
      this.emit('slow-connection', this.status.rtt, this.status.downlink || 0);
    }
  }

  /**
   * Start periodic connectivity checks
   */
  private startConnectivityChecks(): void {
    this.pingInterval = setInterval(async () => {
      if (!this.isMonitoring) return;

      try {
        const isConnected = await this.checkConnectivity();

        if (!isConnected && this.status.online) {
          this.handleConnectionLost();
        } else if (isConnected && !this.status.online) {
          this.handleConnectionRestored();
        }
      } catch (error) {
        console.warn('Connectivity check failed:', error);
      }
    }, this.config.pingInterval);
  }

  /**
   * Start connection quality monitoring
   */
  private startQualityMonitoring(): void {
    this.qualityCheckInterval = setInterval(() => {
      if (!this.isMonitoring || !this.status.online) return;

      // Update connection info if available
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          this.updateStatus({
            connectionType: connection.type,
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
          });
        }
      }
    }, this.config.qualityCheckInterval);
  }

  /**
   * Perform a ping test to check connectivity and measure RTT
   */
  private async performPingTest(): Promise<number> {
    const startTime = performance.now();

    try {
      // Use a small image request as a ping test
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.pingTimeout);

      const response = await fetch('/ping.png?' + Date.now(), {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const endTime = performance.now();

      return endTime - startTime;
    } catch (error) {
      // If the specific endpoint fails, try a more generic approach
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.pingTimeout);

        await fetch('/', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const endTime = performance.now();

        return endTime - startTime;
      } catch (fallbackError) {
        return -1; // Indicates failure
      }
    }
  }

  /**
   * Handle browser online event
   */
  private handleOnline(): void {
    console.log('Browser detected online');
    this.updateStatus({ online: true });

    // Verify with a connectivity check
    this.checkConnectivity();
  }

  /**
   * Handle browser offline event
   */
  private handleOffline(): void {
    console.log('Browser detected offline');
    this.handleConnectionLost();
  }

  /**
   * Handle connection info change (Network Information API)
   */
  private handleConnectionChange(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;

      this.updateStatus({
        connectionType: connection.type,
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      });
    }
  }

  /**
   * Handle page visibility change
   */
  private handleVisibilityChange(): void {
    if (!document.hidden && this.isMonitoring) {
      // Check connectivity when page becomes visible
      setTimeout(() => this.checkConnectivity(), 1000);
    }
  }

  /**
   * Handle connection lost
   */
  private handleConnectionLost(): void {
    if (this.status.online) {
      this.lastOnlineTime = Date.now();
      this.updateStatus({
        online: false,
        saveOnline: false,
      });

      this.emit('connection-lost', this.lastOnlineTime);
      console.warn('Network connection lost');

      // Start reconnection attempts
      this.startReconnectionAttempts();
    }
  }

  /**
   * Handle connection restored
   */
  private handleConnectionRestored(): void {
    if (!this.status.online) {
      const downtime = Date.now() - this.lastOnlineTime;

      this.updateStatus({
        online: true,
        saveOnline: true,
        lastOnline: Date.now(),
        reconnectAttempts: 0,
      });

      this.emit('connection-restored', downtime);
      console.log(`Network connection restored after ${downtime}ms`);

      // Clear reconnection timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = undefined;
      }

      this.reconnectAttempts = 0;
    }
  }

  /**
   * Start reconnection attempts
   */
  private startReconnectionAttempts(): void {
    if (this.reconnectAttempts >= this.config.reconnectAttempts) {
      console.warn('Max reconnection attempts reached');
      return;
    }

    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    this.updateStatus({ reconnectAttempts: this.reconnectAttempts });

    this.reconnectTimer = setTimeout(async () => {
      if (!this.isMonitoring) return;

      console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.config.reconnectAttempts}`);

      const isConnected = await this.checkConnectivity();

      if (!isConnected) {
        // Continue attempting
        this.startReconnectionAttempts();
      }
    }, delay);
  }

  /**
   * Calculate uptime percentage
   */
  private calculateUptime(): number {
    if (this.connectionHistory.length < 2) {
      return this.status.online ? 100 : 0;
    }

    const totalTime = this.connectionHistory[this.connectionHistory.length - 1].timestamp -
                     this.connectionHistory[0].timestamp;

    let onlineTime = 0;

    for (let i = 1; i < this.connectionHistory.length; i++) {
      const current = this.connectionHistory[i];
      const previous = this.connectionHistory[i - 1];

      if (previous.online) {
        onlineTime += current.timestamp - previous.timestamp;
      }
    }

    return totalTime > 0 ? (onlineTime / totalTime) * 100 : 0;
  }

  /**
   * Get quality from status object
   */
  private getQualityFromStatus(status: NetworkStatus): 'excellent' | 'good' | 'poor' | 'offline' {
    if (!status.online) return 'offline';

    const { rtt = Infinity, downlink = 0 } = status;

    if (rtt <= QUALITY_THRESHOLDS.excellent.rtt && downlink >= QUALITY_THRESHOLDS.excellent.downlink) {
      return 'excellent';
    }

    if (rtt <= QUALITY_THRESHOLDS.good.rtt && downlink >= QUALITY_THRESHOLDS.good.downlink) {
      return 'good';
    }

    return 'poor';
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stop();
    this.removeAllListeners();

    // Remove browser event listeners
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connection.removeEventListener('change', this.handleConnectionChange.bind(this));
      }
    }
  }
}

// Singleton instance for global use
let networkMonitorInstance: NetworkMonitor | null = null;

/**
 * Get or create the global network monitor instance
 */
export function getNetworkMonitor(config?: Partial<NetworkMonitorConfig>): NetworkMonitor {
  if (!networkMonitorInstance) {
    networkMonitorInstance = new NetworkMonitor(config);
  }
  return networkMonitorInstance;
}

/**
 * Destroy the global network monitor instance
 */
export function destroyNetworkMonitor(): void {
  if (networkMonitorInstance) {
    networkMonitorInstance.destroy();
    networkMonitorInstance = null;
  }
}