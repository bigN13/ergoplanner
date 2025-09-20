'use client';

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { NodeVisualState, NODE_STATE_COLORS, PIDNode } from '@/types/nodes';

/**
 * Visual State Manager
 * Manages visual states for P&ID nodes (normal, alarm, warning, error, offline, maintenance)
 */

interface VisualStateContextType {
  getNodeStateStyle: (state: NodeVisualState) => React.CSSProperties;
  getStateIcon: (state: NodeVisualState) => string;
  getStateDescription: (state: NodeVisualState) => string;
  shouldShowStateIndicator: (state: NodeVisualState) => boolean;
  getAnimationClass: (state: NodeVisualState) => string;
  getStateColor: (state: NodeVisualState) => typeof NODE_STATE_COLORS[NodeVisualState];
}

const VisualStateContext = createContext<VisualStateContextType | null>(null);

export const useVisualState = (): VisualStateContextType => {
  const context = useContext(VisualStateContext);
  if (!context) {
    throw new Error('useVisualState must be used within a VisualStateProvider');
  }
  return context;
};

interface VisualStateProviderProps {
  children: React.ReactNode;
}

export const VisualStateProvider: React.FC<VisualStateProviderProps> = ({ children }) => {
  // Get style configuration for a node state
  const getNodeStateStyle = useCallback((state: NodeVisualState): React.CSSProperties => {
    const colors = NODE_STATE_COLORS[state];

    return {
      backgroundColor: colors.background,
      borderColor: colors.border,
      color: colors.text,
      transition: 'all 0.3s ease-in-out'
    };
  }, []);

  // Get icon for visual state
  const getStateIcon = useCallback((state: NodeVisualState): string => {
    const stateIcons = {
      [NodeVisualState.NORMAL]: '',
      [NodeVisualState.ALARM]: '🚨',
      [NodeVisualState.WARNING]: '⚠️',
      [NodeVisualState.ERROR]: '❌',
      [NodeVisualState.OFFLINE]: '📴',
      [NodeVisualState.MAINTENANCE]: '🔧',
      [NodeVisualState.SELECTED]: '',
      [NodeVisualState.HIGHLIGHTED]: '✨'
    };

    return stateIcons[state] || '';
  }, []);

  // Get human-readable description for state
  const getStateDescription = useCallback((state: NodeVisualState): string => {
    const descriptions = {
      [NodeVisualState.NORMAL]: 'Normal Operation',
      [NodeVisualState.ALARM]: 'Alarm Condition',
      [NodeVisualState.WARNING]: 'Warning Condition',
      [NodeVisualState.ERROR]: 'Error State',
      [NodeVisualState.OFFLINE]: 'Offline/Shutdown',
      [NodeVisualState.MAINTENANCE]: 'Under Maintenance',
      [NodeVisualState.SELECTED]: 'Selected',
      [NodeVisualState.HIGHLIGHTED]: 'Highlighted'
    };

    return descriptions[state] || 'Unknown State';
  }, []);

  // Determine if state indicator should be shown
  const shouldShowStateIndicator = useCallback((state: NodeVisualState): boolean => {
    return state !== NodeVisualState.NORMAL && state !== NodeVisualState.SELECTED;
  }, []);

  // Get CSS animation class for state
  const getAnimationClass = useCallback((state: NodeVisualState): string => {
    const animationClasses = {
      [NodeVisualState.NORMAL]: '',
      [NodeVisualState.ALARM]: 'animate-pulse',
      [NodeVisualState.WARNING]: 'animate-bounce',
      [NodeVisualState.ERROR]: 'animate-pulse',
      [NodeVisualState.OFFLINE]: 'opacity-60',
      [NodeVisualState.MAINTENANCE]: 'animate-pulse',
      [NodeVisualState.SELECTED]: 'animate-pulse',
      [NodeVisualState.HIGHLIGHTED]: 'animate-bounce'
    };

    return animationClasses[state] || '';
  }, []);

  // Get color configuration for state
  const getStateColor = useCallback((state: NodeVisualState) => {
    return NODE_STATE_COLORS[state];
  }, []);

  const contextValue = useMemo(() => ({
    getNodeStateStyle,
    getStateIcon,
    getStateDescription,
    shouldShowStateIndicator,
    getAnimationClass,
    getStateColor
  }), [
    getNodeStateStyle,
    getStateIcon,
    getStateDescription,
    shouldShowStateIndicator,
    getAnimationClass,
    getStateColor
  ]);

  return (
    <VisualStateContext.Provider value={contextValue}>
      {children}
    </VisualStateContext.Provider>
  );
};

/**
 * State Change Manager
 * Handles state transitions and validation
 */
export class StateChangeManager {
  private static stateTransitions: Record<NodeVisualState, NodeVisualState[]> = {
    [NodeVisualState.NORMAL]: [
      NodeVisualState.ALARM,
      NodeVisualState.WARNING,
      NodeVisualState.ERROR,
      NodeVisualState.OFFLINE,
      NodeVisualState.MAINTENANCE,
      NodeVisualState.SELECTED,
      NodeVisualState.HIGHLIGHTED
    ],
    [NodeVisualState.ALARM]: [
      NodeVisualState.NORMAL,
      NodeVisualState.ERROR,
      NodeVisualState.OFFLINE,
      NodeVisualState.MAINTENANCE
    ],
    [NodeVisualState.WARNING]: [
      NodeVisualState.NORMAL,
      NodeVisualState.ALARM,
      NodeVisualState.ERROR,
      NodeVisualState.OFFLINE,
      NodeVisualState.MAINTENANCE
    ],
    [NodeVisualState.ERROR]: [
      NodeVisualState.NORMAL,
      NodeVisualState.MAINTENANCE,
      NodeVisualState.OFFLINE
    ],
    [NodeVisualState.OFFLINE]: [
      NodeVisualState.NORMAL,
      NodeVisualState.MAINTENANCE
    ],
    [NodeVisualState.MAINTENANCE]: [
      NodeVisualState.NORMAL,
      NodeVisualState.OFFLINE
    ],
    [NodeVisualState.SELECTED]: [
      NodeVisualState.NORMAL,
      NodeVisualState.ALARM,
      NodeVisualState.WARNING,
      NodeVisualState.ERROR,
      NodeVisualState.OFFLINE,
      NodeVisualState.MAINTENANCE,
      NodeVisualState.HIGHLIGHTED
    ],
    [NodeVisualState.HIGHLIGHTED]: [
      NodeVisualState.NORMAL,
      NodeVisualState.SELECTED
    ]
  };

  static canTransition(from: NodeVisualState, to: NodeVisualState): boolean {
    return this.stateTransitions[from]?.includes(to) || false;
  }

  static getValidTransitions(from: NodeVisualState): NodeVisualState[] {
    return this.stateTransitions[from] || [];
  }

  static validateStateChange(from: NodeVisualState, to: NodeVisualState): {
    isValid: boolean;
    reason?: string;
  } {
    if (from === to) {
      return { isValid: true };
    }

    if (!this.canTransition(from, to)) {
      return {
        isValid: false,
        reason: `Cannot transition from ${from} to ${to}`
      };
    }

    // Additional business logic validations
    if (from === NodeVisualState.MAINTENANCE && to === NodeVisualState.ALARM) {
      return {
        isValid: false,
        reason: 'Equipment under maintenance cannot have alarm states'
      };
    }

    if (from === NodeVisualState.OFFLINE && to === NodeVisualState.WARNING) {
      return {
        isValid: false,
        reason: 'Offline equipment cannot have warning states'
      };
    }

    return { isValid: true };
  }
}

/**
 * State Priority Manager
 * Manages state priorities for displaying the most critical state
 */
export class StatePriorityManager {
  private static statePriorities: Record<NodeVisualState, number> = {
    [NodeVisualState.ERROR]: 5,
    [NodeVisualState.ALARM]: 4,
    [NodeVisualState.WARNING]: 3,
    [NodeVisualState.MAINTENANCE]: 2,
    [NodeVisualState.OFFLINE]: 1,
    [NodeVisualState.NORMAL]: 0,
    [NodeVisualState.SELECTED]: -1,
    [NodeVisualState.HIGHLIGHTED]: -2
  };

  static getHighestPriorityState(states: NodeVisualState[]): NodeVisualState {
    if (states.length === 0) {
      return NodeVisualState.NORMAL;
    }

    return states.reduce((highest, current) => {
      return this.statePriorities[current] > this.statePriorities[highest] ? current : highest;
    });
  }

  static getPriority(state: NodeVisualState): number {
    return this.statePriorities[state] ?? 0;
  }

  static sortStatesByPriority(states: NodeVisualState[]): NodeVisualState[] {
    return [...states].sort((a, b) => this.statePriorities[b] - this.statePriorities[a]);
  }
}

/**
 * State Animation Manager
 * Manages animations and transitions between states
 */
export class StateAnimationManager {
  private static animationDurations: Record<NodeVisualState, number> = {
    [NodeVisualState.NORMAL]: 300,
    [NodeVisualState.ALARM]: 1000,
    [NodeVisualState.WARNING]: 1500,
    [NodeVisualState.ERROR]: 800,
    [NodeVisualState.OFFLINE]: 500,
    [NodeVisualState.MAINTENANCE]: 2000,
    [NodeVisualState.SELECTED]: 200,
    [NodeVisualState.HIGHLIGHTED]: 600
  };

  static getAnimationDuration(state: NodeVisualState): number {
    return this.animationDurations[state] || 300;
  }

  static getTransitionCSS(from: NodeVisualState, to: NodeVisualState): string {
    const duration = Math.max(
      this.getAnimationDuration(from),
      this.getAnimationDuration(to)
    );

    return `transition: all ${duration}ms ease-in-out`;
  }

  static shouldAnimate(state: NodeVisualState): boolean {
    return [
      NodeVisualState.ALARM,
      NodeVisualState.WARNING,
      NodeVisualState.ERROR,
      NodeVisualState.MAINTENANCE,
      NodeVisualState.SELECTED,
      NodeVisualState.HIGHLIGHTED
    ].includes(state);
  }
}

/**
 * Bulk State Manager
 * Manages state changes for multiple nodes
 */
export class BulkStateManager {
  static applyStateToNodes(
    nodeIds: string[],
    state: NodeVisualState,
    nodes: Record<string, PIDNode>
  ): Record<string, PIDNode> {
    const updatedNodes = { ...nodes };

    nodeIds.forEach(nodeId => {
      const node = updatedNodes[nodeId];
      if (node) {
        const validation = StateChangeManager.validateStateChange(
          node.data.visualState,
          state
        );

        if (validation.isValid) {
          updatedNodes[nodeId] = {
            ...node,
            data: {
              ...node.data,
              visualState: state,
              modifiedAt: new Date().toISOString()
            }
          };
        }
      }
    });

    return updatedNodes;
  }

  static getNodesInState(
    state: NodeVisualState,
    nodes: Record<string, PIDNode>
  ): PIDNode[] {
    return Object.values(nodes).filter(node => node.data.visualState === state);
  }

  static getStateStatistics(nodes: Record<string, PIDNode>): Record<NodeVisualState, number> {
    const statistics: Record<NodeVisualState, number> = {
      [NodeVisualState.NORMAL]: 0,
      [NodeVisualState.ALARM]: 0,
      [NodeVisualState.WARNING]: 0,
      [NodeVisualState.ERROR]: 0,
      [NodeVisualState.OFFLINE]: 0,
      [NodeVisualState.MAINTENANCE]: 0,
      [NodeVisualState.SELECTED]: 0,
      [NodeVisualState.HIGHLIGHTED]: 0
    };

    Object.values(nodes).forEach(node => {
      const state = node.data.visualState || NodeVisualState.NORMAL;
      statistics[state]++;
    });

    return statistics;
  }
}

/**
 * State History Manager
 * Tracks state changes over time
 */
export interface StateHistoryEntry {
  nodeId: string;
  previousState: NodeVisualState;
  newState: NodeVisualState;
  timestamp: string;
  userId?: string;
  reason?: string;
}

export class StateHistoryManager {
  private static history: StateHistoryEntry[] = [];

  static recordStateChange(
    nodeId: string,
    previousState: NodeVisualState,
    newState: NodeVisualState,
    userId?: string,
    reason?: string
  ): void {
    const entry: StateHistoryEntry = {
      nodeId,
      previousState,
      newState,
      timestamp: new Date().toISOString(),
      userId,
      reason
    };

    this.history.push(entry);

    // Keep only last 1000 entries to prevent memory issues
    if (this.history.length > 1000) {
      this.history = this.history.slice(-1000);
    }
  }

  static getNodeHistory(nodeId: string): StateHistoryEntry[] {
    return this.history.filter(entry => entry.nodeId === nodeId);
  }

  static getRecentHistory(limit: number = 50): StateHistoryEntry[] {
    return this.history.slice(-limit).reverse();
  }

  static clearHistory(): void {
    this.history = [];
  }

  static exportHistory(): StateHistoryEntry[] {
    return [...this.history];
  }
}

// Utility hooks for component integration
export function useStateTransition() {
  return useCallback((
    nodeId: string,
    currentState: NodeVisualState,
    newState: NodeVisualState,
    onStateChange?: (nodeId: string, state: NodeVisualState) => void,
    userId?: string,
    reason?: string
  ) => {
    const validation = StateChangeManager.validateStateChange(currentState, newState);

    if (validation.isValid) {
      StateHistoryManager.recordStateChange(nodeId, currentState, newState, userId, reason);
      onStateChange?.(nodeId, newState);
      return { success: true };
    } else {
      return { success: false, error: validation.reason };
    }
  }, []);
}

export function useStatePriority() {
  return useCallback((states: NodeVisualState[]) => {
    return StatePriorityManager.getHighestPriorityState(states);
  }, []);
}

export default VisualStateProvider;