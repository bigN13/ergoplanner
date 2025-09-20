'use client';

import { useEffect } from 'react';
import { KeyboardShortcut } from '@/types/canvas';

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  ignoreInputs?: boolean;
}

export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = true,
    ignoreInputs = true,
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcuts when typing in inputs, textareas, or contenteditable elements
      if (ignoreInputs) {
        const target = event.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' ||
                       target.tagName === 'TEXTAREA' ||
                       target.contentEditable === 'true';

        if (isInput) return;
      }

      // Find matching shortcut
      const matchingShortcut = shortcuts.find(shortcut => {
        const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatches = !!shortcut.ctrlKey === (event.ctrlKey || event.metaKey);
        const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
        const altMatches = !!shortcut.altKey === event.altKey;

        return keyMatches && ctrlMatches && shiftMatches && altMatches;
      });

      if (matchingShortcut) {
        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }

        try {
          matchingShortcut.action();
        } catch (error) {
          console.error('Error executing keyboard shortcut:', error);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled, preventDefault, stopPropagation, ignoreInputs]);
};

// Hook for registering global shortcuts with categories
export const useGlobalShortcuts = () => {
  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts
    {
      key: 'Escape',
      description: 'Cancel current action or clear selection',
      action: () => {
        // Dispatch global escape action
        window.dispatchEvent(new CustomEvent('canvas:escape'));
      },
      category: 'navigation',
    },
    {
      key: 'F11',
      description: 'Toggle fullscreen',
      action: () => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
      },
      category: 'view',
    },

    // View shortcuts
    {
      key: '0',
      ctrlKey: true,
      description: 'Reset zoom to 100%',
      action: () => {
        window.dispatchEvent(new CustomEvent('canvas:reset-zoom'));
      },
      category: 'view',
    },
    {
      key: '1',
      ctrlKey: true,
      description: 'Fit view to content',
      action: () => {
        window.dispatchEvent(new CustomEvent('canvas:fit-view'));
      },
      category: 'view',
    },
    {
      key: '+',
      ctrlKey: true,
      description: 'Zoom in',
      action: () => {
        window.dispatchEvent(new CustomEvent('canvas:zoom-in'));
      },
      category: 'view',
    },
    {
      key: '-',
      ctrlKey: true,
      description: 'Zoom out',
      action: () => {
        window.dispatchEvent(new CustomEvent('canvas:zoom-out'));
      },
      category: 'view',
    },

    // Tool shortcuts
    {
      key: 'v',
      description: 'Select tool',
      action: () => {
        window.dispatchEvent(new CustomEvent('canvas:tool-select', { detail: 'select' }));
      },
      category: 'navigation',
    },
    {
      key: 'h',
      description: 'Pan tool',
      action: () => {
        window.dispatchEvent(new CustomEvent('canvas:tool-select', { detail: 'pan' }));
      },
      category: 'navigation',
    },
    {
      key: 'p',
      description: 'Pipe tool',
      action: () => {
        window.dispatchEvent(new CustomEvent('canvas:tool-select', { detail: 'draw_pipe' }));
      },
      category: 'navigation',
    },
    {
      key: 't',
      description: 'Text tool',
      action: () => {
        window.dispatchEvent(new CustomEvent('canvas:tool-select', { detail: 'add_annotation' }));
      },
      category: 'navigation',
    },

    // Grid and snap shortcuts
    {
      key: 'g',
      ctrlKey: true,
      description: 'Toggle grid',
      action: () => {
        window.dispatchEvent(new CustomEvent('canvas:toggle-grid'));
      },
      category: 'view',
    },
    {
      key: 'g',
      ctrlKey: true,
      shiftKey: true,
      description: 'Toggle snap to grid',
      action: () => {
        window.dispatchEvent(new CustomEvent('canvas:toggle-snap'));
      },
      category: 'view',
    },

    // Save shortcuts
    {
      key: 's',
      ctrlKey: true,
      description: 'Save drawing',
      action: () => {
        window.dispatchEvent(new CustomEvent('canvas:save'));
      },
      category: 'editing',
    },
    {
      key: 's',
      ctrlKey: true,
      shiftKey: true,
      description: 'Save drawing as...',
      action: () => {
        window.dispatchEvent(new CustomEvent('canvas:save-as'));
      },
      category: 'editing',
    },

    // Layer shortcuts
    {
      key: 'l',
      ctrlKey: true,
      description: 'Toggle layers panel',
      action: () => {
        window.dispatchEvent(new CustomEvent('canvas:toggle-layers'));
      },
      category: 'view',
    },

    // Help shortcuts
    {
      key: 'F1',
      description: 'Show keyboard shortcuts',
      action: () => {
        window.dispatchEvent(new CustomEvent('canvas:show-help'));
      },
      category: 'navigation',
    },
    {
      key: '?',
      shiftKey: true,
      description: 'Show keyboard shortcuts',
      action: () => {
        window.dispatchEvent(new CustomEvent('canvas:show-help'));
      },
      category: 'navigation',
    },
  ];

  useKeyboardShortcuts(shortcuts, {
    enabled: true,
    preventDefault: true,
    stopPropagation: true,
    ignoreInputs: true,
  });

  return shortcuts;
};

// Utility function to format shortcut display
export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];

  if (shortcut.ctrlKey) {
    parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
  }
  if (shortcut.shiftKey) {
    parts.push('Shift');
  }
  if (shortcut.altKey) {
    parts.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt');
  }

  // Format special keys
  const keyMap: Record<string, string> = {
    ' ': 'Space',
    'Escape': 'Esc',
    'Delete': 'Del',
    'Backspace': '⌫',
    'Enter': '↵',
    'Tab': '⇥',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
  };

  const key = keyMap[shortcut.key] || shortcut.key.toUpperCase();
  parts.push(key);

  return parts.join('+');
};