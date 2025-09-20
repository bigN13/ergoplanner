'use client';

import { useEffect, useRef, useState } from 'react';
import { CanvasPerformanceMetrics } from '@/types/canvas';

interface UsePerformanceMonitorOptions {
  enabled?: boolean;
  interval?: number;
  onUpdate?: (metrics: CanvasPerformanceMetrics) => void;
  onThresholdExceeded?: (metric: string, value: number, threshold: number) => void;
  thresholds?: {
    frameRate?: number;
    renderTime?: number;
    memoryUsage?: number;
    nodeCount?: number;
  };
}

export const usePerformanceMonitor = (options: UsePerformanceMonitorOptions = {}) => {
  const {
    enabled = true,
    interval = 1000,
    onUpdate,
    onThresholdExceeded,
    thresholds = {
      frameRate: 30,
      renderTime: 16.67, // 60 FPS = 16.67ms per frame
      memoryUsage: 100, // MB
      nodeCount: 1000,
    },
  } = options;

  const [metrics, setMetrics] = useState<CanvasPerformanceMetrics>({
    frameRate: 0,
    renderTime: 0,
    nodeCount: 0,
    edgeCount: 0,
    visibleNodes: 0,
    visibleEdges: 0,
    memoryUsage: 0,
    lastUpdate: Date.now(),
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const renderStartTimeRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Performance monitoring
  useEffect(() => {
    if (!enabled) return;

    let animationFrameId: number;

    const measureFrameRate = () => {
      const now = performance.now();
      frameCountRef.current++;

      // Calculate frame rate every second
      if (now - lastTimeRef.current >= 1000) {
        const frameRate = (frameCountRef.current * 1000) / (now - lastTimeRef.current);

        setMetrics(prev => ({
          ...prev,
          frameRate,
          lastUpdate: Date.now(),
        }));

        // Check frame rate threshold
        if (thresholds.frameRate && frameRate < thresholds.frameRate) {
          onThresholdExceeded?.('frameRate', frameRate, thresholds.frameRate);
        }

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animationFrameId = requestAnimationFrame(measureFrameRate);
    };

    animationFrameId = requestAnimationFrame(measureFrameRate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [enabled, thresholds.frameRate, onThresholdExceeded]);

  // Memory monitoring
  useEffect(() => {
    if (!enabled || !('memory' in performance)) return;

    intervalRef.current = setInterval(() => {
      const memory = (performance as any).memory;
      if (memory) {
        const memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB

        setMetrics(prev => ({
          ...prev,
          memoryUsage,
        }));

        // Check memory threshold
        if (thresholds.memoryUsage && memoryUsage > thresholds.memoryUsage) {
          onThresholdExceeded?.('memoryUsage', memoryUsage, thresholds.memoryUsage);
        }
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, thresholds.memoryUsage, onThresholdExceeded]);

  // Render time measurement helpers
  const startRenderMeasurement = () => {
    renderStartTimeRef.current = performance.now();
  };

  const endRenderMeasurement = () => {
    const renderTime = performance.now() - renderStartTimeRef.current;

    setMetrics(prev => ({
      ...prev,
      renderTime,
    }));

    // Check render time threshold
    if (thresholds.renderTime && renderTime > thresholds.renderTime) {
      onThresholdExceeded?.('renderTime', renderTime, thresholds.renderTime);
    }

    return renderTime;
  };

  // Update node/edge counts
  const updateCounts = (nodeCount: number, edgeCount: number, visibleNodes?: number, visibleEdges?: number) => {
    setMetrics(prev => ({
      ...prev,
      nodeCount,
      edgeCount,
      visibleNodes: visibleNodes ?? nodeCount,
      visibleEdges: visibleEdges ?? edgeCount,
    }));

    // Check node count threshold
    if (thresholds.nodeCount && nodeCount > thresholds.nodeCount) {
      onThresholdExceeded?.('nodeCount', nodeCount, thresholds.nodeCount);
    }
  };

  // Call onUpdate when metrics change
  useEffect(() => {
    if (onUpdate) {
      onUpdate(metrics);
    }
  }, [metrics, onUpdate]);

  // Performance optimization recommendations
  const getOptimizationRecommendations = (): string[] => {
    const recommendations: string[] = [];

    if (metrics.frameRate < 30) {
      recommendations.push('Consider reducing the number of visible elements or simplifying node rendering');
    }

    if (metrics.renderTime > 16.67) {
      recommendations.push('Enable level of detail rendering or virtualization for better performance');
    }

    if (metrics.nodeCount > 500) {
      recommendations.push('Consider using virtualization to render only visible nodes');
    }

    if (metrics.memoryUsage > 50) {
      recommendations.push('Monitor memory usage and consider implementing cleanup strategies');
    }

    return recommendations;
  };

  // Performance grade calculation
  const getPerformanceGrade = (): 'excellent' | 'good' | 'fair' | 'poor' => {
    const scores = {
      frameRate: metrics.frameRate >= 50 ? 4 : metrics.frameRate >= 30 ? 3 : metrics.frameRate >= 20 ? 2 : 1,
      renderTime: metrics.renderTime <= 8 ? 4 : metrics.renderTime <= 16.67 ? 3 : metrics.renderTime <= 33 ? 2 : 1,
      nodeCount: metrics.nodeCount <= 100 ? 4 : metrics.nodeCount <= 500 ? 3 : metrics.nodeCount <= 1000 ? 2 : 1,
      memoryUsage: metrics.memoryUsage <= 25 ? 4 : metrics.memoryUsage <= 50 ? 3 : metrics.memoryUsage <= 100 ? 2 : 1,
    };

    const averageScore = (scores.frameRate + scores.renderTime + scores.nodeCount + scores.memoryUsage) / 4;

    if (averageScore >= 3.5) return 'excellent';
    if (averageScore >= 2.5) return 'good';
    if (averageScore >= 1.5) return 'fair';
    return 'poor';
  };

  // Utility to format metrics for display
  const formatMetrics = () => ({
    frameRate: `${metrics.frameRate.toFixed(1)} FPS`,
    renderTime: `${metrics.renderTime.toFixed(2)}ms`,
    nodeCount: metrics.nodeCount.toLocaleString(),
    edgeCount: metrics.edgeCount.toLocaleString(),
    visibleNodes: metrics.visibleNodes.toLocaleString(),
    visibleEdges: metrics.visibleEdges.toLocaleString(),
    memoryUsage: `${metrics.memoryUsage.toFixed(1)} MB`,
    grade: getPerformanceGrade(),
  });

  return {
    metrics,
    startRenderMeasurement,
    endRenderMeasurement,
    updateCounts,
    getOptimizationRecommendations,
    getPerformanceGrade,
    formatMetrics,
    enabled,
  };
};

// Hook for React Flow specific performance monitoring
export const useReactFlowPerformance = () => {
  const performanceMonitor = usePerformanceMonitor({
    enabled: true,
    interval: 1000,
    thresholds: {
      frameRate: 30,
      renderTime: 16.67,
      memoryUsage: 100,
      nodeCount: 1000,
    },
    onThresholdExceeded: (metric, value, threshold) => {
      console.warn(`Performance threshold exceeded: ${metric} = ${value} (threshold: ${threshold})`);
    },
  });

  // ReactFlow-specific optimizations
  const shouldUseVirtualization = () => {
    return performanceMonitor.metrics.nodeCount > 500 ||
           performanceMonitor.metrics.renderTime > 16.67;
  };

  const shouldUseLevelOfDetail = () => {
    return performanceMonitor.metrics.nodeCount > 200 ||
           performanceMonitor.metrics.frameRate < 30;
  };

  const getRecommendedUpdateFrequency = () => {
    if (performanceMonitor.metrics.frameRate < 20) return 500; // 2 FPS
    if (performanceMonitor.metrics.frameRate < 30) return 100; // 10 FPS
    return 16; // 60 FPS
  };

  return {
    ...performanceMonitor,
    shouldUseVirtualization,
    shouldUseLevelOfDetail,
    getRecommendedUpdateFrequency,
  };
};