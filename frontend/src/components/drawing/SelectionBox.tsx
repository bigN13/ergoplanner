'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SelectionBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  className?: string;
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({
  x,
  y,
  width,
  height,
  className,
}) => {
  return (
    <div
      className={cn(
        'absolute pointer-events-none border-2 border-blue-500 bg-blue-100 bg-opacity-20 rounded',
        'animate-pulse',
        className
      )}
      style={{
        left: x,
        top: y,
        width,
        height,
      }}
    >
      {/* Selection handles */}
      <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full" />
      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 border border-white rounded-full" />
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-full" />
      <div className="absolute top-1/2 transform -translate-y-1/2 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full" />
      <div className="absolute top-1/2 transform -translate-y-1/2 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-full" />
      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full" />
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 border border-white rounded-full" />
      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-full" />
    </div>
  );
};