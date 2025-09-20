'use client';

import React, { useEffect, useRef } from 'react';
import {
  Copy,
  ClipboardPaste as Paste,
  Trash2,
  RotateCw,
  RotateCcw,
  Layers,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Group,
  Ungroup,
  ArrowUp,
  ArrowDown,
  Settings,
  Edit,
  Info,
} from 'lucide-react';
import { ContextMenuItem } from '@/types/canvas';
import { cn } from '@/lib/utils';

interface CanvasContextMenuProps {
  x: number;
  y: number;
  target: 'canvas' | 'node' | 'edge' | 'selection' | any;
  onClose: () => void;
  onAction: (action: string, data?: any) => void;
  selectedNodes?: string[];
  selectedEdges?: string[];
}

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  x,
  y,
  target,
  onClose,
  onAction,
  selectedNodes = [],
  selectedEdges = [],
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Calculate menu position to stay within viewport
  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      // Adjust X position if menu goes off right edge
      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      // Adjust Y position if menu goes off bottom edge
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      // Ensure menu doesn't go off left or top edges
      adjustedX = Math.max(10, adjustedX);
      adjustedY = Math.max(10, adjustedY);

      menu.style.left = `${adjustedX}px`;
      menu.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  const getMenuItems = (): ContextMenuItem[] => {
    const hasSelection = selectedNodes.length > 0 || selectedEdges.length > 0;
    const hasMultipleSelection = selectedNodes.length > 1 || selectedEdges.length > 1;

    switch (target) {
      case 'canvas':
        return [
          {
            id: 'paste',
            label: 'Paste',
            icon: 'Paste',
            shortcut: 'Ctrl+V',
            action: () => onAction('paste'),
          },
          { id: 'sep1', label: '', separator: true, action: () => {} },
          {
            id: 'select-all',
            label: 'Select All',
            shortcut: 'Ctrl+A',
            action: () => onAction('select-all'),
          },
          { id: 'sep2', label: '', separator: true, action: () => {} },
          {
            id: 'add-component',
            label: 'Add Component',
            submenu: [
              {
                id: 'add-pump',
                label: 'Pump',
                action: () => onAction('add-component', 'pump'),
              },
              {
                id: 'add-valve',
                label: 'Valve',
                action: () => onAction('add-component', 'valve'),
              },
              {
                id: 'add-tank',
                label: 'Tank',
                action: () => onAction('add-component', 'tank'),
              },
              {
                id: 'add-pipe',
                label: 'Pipe',
                action: () => onAction('add-component', 'pipe'),
              },
            ],
            action: () => {},
          },
          {
            id: 'add-annotation',
            label: 'Add Text',
            shortcut: 'T',
            action: () => onAction('add-annotation'),
          },
          { id: 'sep3', label: '', separator: true, action: () => {} },
          {
            id: 'canvas-settings',
            label: 'Canvas Settings',
            icon: 'Settings',
            action: () => onAction('canvas-settings'),
          },
        ];

      case 'node':
      case 'selection':
        return [
          {
            id: 'edit',
            label: 'Edit Properties',
            icon: 'Edit',
            shortcut: 'Enter',
            action: () => onAction('edit-properties'),
          },
          { id: 'sep1', label: '', separator: true, action: () => {} },
          {
            id: 'copy',
            label: 'Copy',
            icon: 'Copy',
            shortcut: 'Ctrl+C',
            action: () => onAction('copy'),
          },
          {
            id: 'paste',
            label: 'Paste',
            icon: 'Paste',
            shortcut: 'Ctrl+V',
            action: () => onAction('paste'),
          },
          {
            id: 'duplicate',
            label: 'Duplicate',
            shortcut: 'Ctrl+D',
            action: () => onAction('duplicate'),
          },
          {
            id: 'delete',
            label: 'Delete',
            icon: 'Trash2',
            shortcut: 'Delete',
            action: () => onAction('delete'),
          },
          { id: 'sep2', label: '', separator: true, action: () => {} },
          {
            id: 'rotate-cw',
            label: 'Rotate Clockwise',
            icon: 'RotateCw',
            shortcut: 'R',
            action: () => onAction('rotate', 90),
          },
          {
            id: 'rotate-ccw',
            label: 'Rotate Counter-Clockwise',
            icon: 'RotateCcw',
            shortcut: 'Shift+R',
            action: () => onAction('rotate', -90),
          },
          { id: 'sep3', label: '', separator: true, action: () => {} },
          ...(hasMultipleSelection ? [
            {
              id: 'group',
              label: 'Group',
              icon: 'Group',
              shortcut: 'Ctrl+G',
              action: () => onAction('group'),
            },
            {
              id: 'align',
              label: 'Align',
              submenu: [
                {
                  id: 'align-left',
                  label: 'Align Left',
                  action: () => onAction('align', 'left'),
                },
                {
                  id: 'align-center',
                  label: 'Align Center',
                  action: () => onAction('align', 'center'),
                },
                {
                  id: 'align-right',
                  label: 'Align Right',
                  action: () => onAction('align', 'right'),
                },
                { id: 'sep-align', label: '', separator: true, action: () => {} },
                {
                  id: 'align-top',
                  label: 'Align Top',
                  action: () => onAction('align', 'top'),
                },
                {
                  id: 'align-middle',
                  label: 'Align Middle',
                  action: () => onAction('align', 'middle'),
                },
                {
                  id: 'align-bottom',
                  label: 'Align Bottom',
                  action: () => onAction('align', 'bottom'),
                },
              ],
              action: () => {},
            },
            {
              id: 'distribute',
              label: 'Distribute',
              submenu: [
                {
                  id: 'distribute-horizontal',
                  label: 'Horizontally',
                  action: () => onAction('distribute', 'horizontal'),
                },
                {
                  id: 'distribute-vertical',
                  label: 'Vertically',
                  action: () => onAction('distribute', 'vertical'),
                },
              ],
              action: () => {},
            },
            { id: 'sep4', label: '', separator: true, action: () => {} },
          ] : []),
          {
            id: 'bring-forward',
            label: 'Bring Forward',
            icon: 'ArrowUp',
            action: () => onAction('bring-forward'),
          },
          {
            id: 'send-backward',
            label: 'Send Backward',
            icon: 'ArrowDown',
            action: () => onAction('send-backward'),
          },
          { id: 'sep5', label: '', separator: true, action: () => {} },
          {
            id: 'lock',
            label: 'Lock',
            icon: 'Lock',
            action: () => onAction('lock'),
          },
          {
            id: 'hide',
            label: 'Hide',
            icon: 'EyeOff',
            action: () => onAction('hide'),
          },
          { id: 'sep6', label: '', separator: true, action: () => {} },
          {
            id: 'properties',
            label: 'Properties',
            icon: 'Info',
            action: () => onAction('show-properties'),
          },
        ];

      case 'edge':
        return [
          {
            id: 'edit',
            label: 'Edit Properties',
            icon: 'Edit',
            shortcut: 'Enter',
            action: () => onAction('edit-properties'),
          },
          { id: 'sep1', label: '', separator: true, action: () => {} },
          {
            id: 'delete',
            label: 'Delete',
            icon: 'Trash2',
            shortcut: 'Delete',
            action: () => onAction('delete'),
          },
          { id: 'sep2', label: '', separator: true, action: () => {} },
          {
            id: 'add-label',
            label: 'Add Label',
            action: () => onAction('add-label'),
          },
          {
            id: 'reverse-direction',
            label: 'Reverse Direction',
            action: () => onAction('reverse-direction'),
          },
          { id: 'sep3', label: '', separator: true, action: () => {} },
          {
            id: 'properties',
            label: 'Properties',
            icon: 'Info',
            action: () => onAction('show-properties'),
          },
        ];

      default:
        return [];
    }
  };

  const renderMenuItem = (item: ContextMenuItem, index: number) => {
    if (item.separator) {
      return <div key={`sep-${index}`} className="h-px bg-gray-200 dark:bg-gray-600 my-1" />;
    }

    const IconComponent = item.icon ? getIconComponent(item.icon) : null;

    return (
      <div key={item.id} className="relative group">
        <button
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 text-sm text-left',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            'focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none',
            item.disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (!item.disabled && !item.submenu) {
              item.action();
              onClose();
            }
          }}
          disabled={item.disabled}
        >
          <div className="flex items-center gap-2">
            {IconComponent && <IconComponent className="w-4 h-4" />}
            <span>{item.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {item.shortcut && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {item.shortcut}
              </span>
            )}
            {item.submenu && (
              <span className="text-gray-400">▶</span>
            )}
          </div>
        </button>

        {/* Submenu */}
        {item.submenu && (
          <div className="absolute left-full top-0 ml-1 hidden group-hover:block">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 min-w-48">
              {item.submenu.map((subItem, subIndex) => renderMenuItem(subItem, subIndex))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      Copy,
      Paste,
      Trash2,
      RotateCw,
      RotateCcw,
      Layers,
      Lock,
      Unlock,
      Eye,
      EyeOff,
      Group,
      Ungroup,
      ArrowUp,
      ArrowDown,
      Settings,
      Edit,
      Info,
    };
    return icons[iconName];
  };

  const menuItems = getMenuItems();

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 min-w-48"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, index) => renderMenuItem(item, index))}
    </div>
  );
};