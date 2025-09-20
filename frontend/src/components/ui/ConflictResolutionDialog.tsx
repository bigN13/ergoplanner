/**
 * Conflict Resolution Dialog
 * TASK-023: Auto-save Functionality
 *
 * Interactive interface for resolving save conflicts with
 * three-way merge visualization and resolution options.
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  UserIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  selectActiveConflicts,
  selectUIState,
  resolveConflict,
  setConflictDialogVisible,
} from '@/store/slices/autoSaveSlice';
import type {
  SaveConflict,
  ConflictingChange,
  ConflictResolutionOption,
} from '@/types/autosave';
import {
  performThreeWayMerge,
  generateResolutionOptions,
  applyConflictResolution,
} from '@/utils/conflictResolution';

interface ConflictResolutionDialogProps {
  className?: string;
}

export function ConflictResolutionDialog({ className = '' }: ConflictResolutionDialogProps) {
  const dispatch = useAppDispatch();
  const conflicts = useAppSelector(selectActiveConflicts);
  const uiState = useAppSelector(selectUIState);

  const [selectedConflict, setSelectedConflict] = useState<SaveConflict | null>(null);
  const [resolutionOptions, setResolutionOptions] = useState<ConflictResolutionOption[]>([]);
  const [selectedResolution, setSelectedResolution] = useState<string>('');
  const [customResolutions, setCustomResolutions] = useState<Record<string, any>>({});
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set());
  const [isResolving, setIsResolving] = useState(false);

  // Get the first conflict or the one specified in UI state
  useEffect(() => {
    if (uiState.conflictDialogData) {
      setSelectedConflict(uiState.conflictDialogData);
    } else if (conflicts.length > 0) {
      setSelectedConflict(conflicts[0]);
    } else {
      setSelectedConflict(null);
    }
  }, [conflicts, uiState.conflictDialogData]);

  // Generate resolution options when conflict changes
  useEffect(() => {
    if (selectedConflict) {
      // This would typically fetch the actual data from the store
      const options = generateResolutionOptions(
        {} as any, // localData - would come from store
        {} as any, // serverData - would come from API
        {} as any  // baseData - would come from store
      );
      setResolutionOptions(options);
      setSelectedResolution(options.find(opt => opt.recommended)?.id || options[0]?.id || '');
    }
  }, [selectedConflict]);

  // Handle conflict resolution
  const handleResolveConflict = async () => {
    if (!selectedConflict || !selectedResolution) {
      return;
    }

    setIsResolving(true);

    try {
      const resolution = resolutionOptions.find(opt => opt.id === selectedResolution);
      if (!resolution) {
        throw new Error('Invalid resolution option');
      }

      // Apply the resolution
      dispatch(resolveConflict({
        id: selectedConflict.id,
        resolution,
      }));

      // Close dialog if no more conflicts
      if (conflicts.length <= 1) {
        dispatch(setConflictDialogVisible(false));
      } else {
        // Move to next conflict
        const nextConflict = conflicts.find(c => c.id !== selectedConflict.id);
        setSelectedConflict(nextConflict || null);
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      // Show error notification
    } finally {
      setIsResolving(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    dispatch(setConflictDialogVisible(false));
  };

  // Toggle change expansion
  const toggleChangeExpansion = (changeId: string) => {
    const newExpanded = new Set(expandedChanges);
    if (newExpanded.has(changeId)) {
      newExpanded.delete(changeId);
    } else {
      newExpanded.add(changeId);
    }
    setExpandedChanges(newExpanded);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get conflict severity color
  const getConflictSeverity = (conflict: SaveConflict) => {
    const autoResolvableCount = conflict.conflictingChanges.filter(c => c.confidence > 0.8).length;
    const totalCount = conflict.conflictingChanges.length;

    if (autoResolvableCount === totalCount) {
      return 'low'; // All changes can be auto-resolved
    } else if (autoResolvableCount > totalCount / 2) {
      return 'medium'; // Most changes can be auto-resolved
    } else {
      return 'high'; // Many changes require manual resolution
    }
  };

  const severityColors = {
    low: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    medium: 'text-orange-600 bg-orange-50 border-orange-200',
    high: 'text-red-600 bg-red-50 border-red-200',
  };

  if (!uiState.showConflictDialog || !selectedConflict) {
    return null;
  }

  const severity = getConflictSeverity(selectedConflict);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`
            bg-white rounded-lg shadow-xl
            max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden
            flex flex-col
            ${className}
          `}
        >
          {/* Header */}
          <div className={`
            px-6 py-4 border-b border-gray-200
            ${severityColors[severity]}
          `}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="w-6 h-6" />
                <div>
                  <h2 className="text-lg font-semibold">
                    Save Conflict Detected
                  </h2>
                  <p className="text-sm opacity-80">
                    Your changes conflict with recent updates from another user
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isResolving}
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Conflict Info */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-4 h-4 opacity-60" />
                <span>Detected: {formatTimestamp(selectedConflict.timestamp)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">
                  {selectedConflict.conflictingChanges.length} conflicting changes
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Conflicting Changes List */}
            <div className="w-1/2 border-r border-gray-200 flex flex-col">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="font-medium text-gray-900">Conflicting Changes</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Changes that conflict between your version and the server
                </p>
              </div>

              <div className="flex-1 overflow-y-auto">
                {selectedConflict.conflictingChanges.map((change, index) => (
                  <ConflictingChangeItem
                    key={`${change.path}-${index}`}
                    change={change}
                    isExpanded={expandedChanges.has(`${change.path}-${index}`)}
                    onToggleExpansion={() => toggleChangeExpansion(`${change.path}-${index}`)}
                    onSelectResolution={(resolution) => {
                      setCustomResolutions(prev => ({
                        ...prev,
                        [change.path]: resolution,
                      }));
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Resolution Options */}
            <div className="w-1/2 flex flex-col">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="font-medium text-gray-900">Resolution Options</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Choose how to resolve the conflicts
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {resolutionOptions.map((option) => (
                  <ResolutionOption
                    key={option.id}
                    option={option}
                    isSelected={selectedResolution === option.id}
                    onSelect={() => setSelectedResolution(option.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {conflicts.length > 1 && (
                  <span>
                    Conflict {conflicts.findIndex(c => c.id === selectedConflict.id) + 1} of {conflicts.length}
                  </span>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={isResolving}
                >
                  Cancel
                </button>

                <button
                  onClick={handleResolveConflict}
                  disabled={!selectedResolution || isResolving}
                  className="
                    px-4 py-2 text-sm font-medium text-white
                    bg-blue-600 border border-transparent rounded-md
                    hover:bg-blue-700 disabled:bg-gray-400
                    transition-colors flex items-center space-x-2
                  "
                >
                  {isResolving ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      <span>Resolving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Resolve Conflict</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Individual conflicting change item
 */
interface ConflictingChangeItemProps {
  change: ConflictingChange;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onSelectResolution: (resolution: 'local' | 'server' | 'custom') => void;
}

function ConflictingChangeItem({
  change,
  isExpanded,
  onToggleExpansion,
  onSelectResolution,
}: ConflictingChangeItemProps) {
  const [selectedResolution, setSelectedResolution] = useState<'local' | 'server' | 'custom'>('local');

  const handleResolutionChange = (resolution: 'local' | 'server' | 'custom') => {
    setSelectedResolution(resolution);
    onSelectResolution(resolution);
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'add': return 'text-green-600 bg-green-50';
      case 'update': return 'text-blue-600 bg-blue-50';
      case 'delete': return 'text-red-600 bg-red-50';
      case 'move': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const confidenceColor = change.confidence > 0.8 ? 'text-green-600' :
                         change.confidence > 0.5 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div
        className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={onToggleExpansion}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            )}

            <span className={`
              px-2 py-1 text-xs font-medium rounded
              ${getChangeTypeColor(change.changeType)}
            `}>
              {change.changeType}
            </span>

            <span className="text-sm font-medium text-gray-900 truncate">
              {change.path}
            </span>
          </div>

          <div className={`text-xs font-medium ${confidenceColor}`}>
            {Math.round(change.confidence * 100)}% confidence
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-50 border-t border-gray-200"
          >
            <div className="p-4 space-y-4">
              {/* Value Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <UserIcon className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Your Version</span>
                  </div>
                  <div className="bg-white p-2 rounded border text-xs font-mono max-h-20 overflow-y-auto">
                    {JSON.stringify(change.localValue, null, 2)}
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <ComputerDesktopIcon className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">Server Version</span>
                  </div>
                  <div className="bg-white p-2 rounded border text-xs font-mono max-h-20 overflow-y-auto">
                    {JSON.stringify(change.serverValue, null, 2)}
                  </div>
                </div>
              </div>

              {/* Resolution Selection */}
              <div>
                <span className="text-sm font-medium text-gray-700 mb-2 block">
                  Choose Resolution:
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleResolutionChange('local')}
                    className={`
                      px-3 py-1 text-xs rounded border transition-colors
                      ${selectedResolution === 'local'
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    Use Mine
                  </button>
                  <button
                    onClick={() => handleResolutionChange('server')}
                    className={`
                      px-3 py-1 text-xs rounded border transition-colors
                      ${selectedResolution === 'server'
                        ? 'bg-green-100 border-green-300 text-green-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    Use Server
                  </button>
                  <button
                    onClick={() => handleResolutionChange('custom')}
                    className={`
                      px-3 py-1 text-xs rounded border transition-colors
                      ${selectedResolution === 'custom'
                        ? 'bg-purple-100 border-purple-300 text-purple-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    Custom
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Resolution option component
 */
interface ResolutionOptionProps {
  option: ConflictResolutionOption;
  isSelected: boolean;
  onSelect: () => void;
}

function ResolutionOption({ option, isSelected, onSelect }: ResolutionOptionProps) {
  const getOptionIcon = (type: string) => {
    switch (type) {
      case 'local': return UserIcon;
      case 'server': return ComputerDesktopIcon;
      case 'merge': return ArrowPathIcon;
      case 'custom': return ExclamationTriangleIcon;
      default: return CheckCircleIcon;
    }
  };

  const IconComponent = getOptionIcon(option.type);

  return (
    <div
      onClick={onSelect}
      className={`
        p-3 rounded-lg border cursor-pointer transition-all
        ${isSelected
          ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }
      `}
    >
      <div className="flex items-start space-x-3">
        <div className={`
          flex-shrink-0 w-5 h-5 mt-0.5
          ${isSelected ? 'text-blue-600' : 'text-gray-400'}
        `}>
          <IconComponent className="w-5 h-5" />
        </div>

        <div className="flex-1">
          <div className={`
            font-medium text-sm flex items-center space-x-2
            ${isSelected ? 'text-blue-900' : 'text-gray-900'}
          `}>
            <span>{option.type.charAt(0).toUpperCase() + option.type.slice(1)} Resolution</span>
            {option.recommended && (
              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                Recommended
              </span>
            )}
          </div>

          <p className={`
            text-xs mt-1
            ${isSelected ? 'text-blue-700' : 'text-gray-600'}
          `}>
            {option.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ConflictResolutionDialog;