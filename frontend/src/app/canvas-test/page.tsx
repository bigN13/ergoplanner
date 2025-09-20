'use client';

import React from 'react';
import { DrawingCanvasProvider } from '@/components/drawing/DrawingCanvas';
import { CanvasMode } from '@/types/canvas';

export default function CanvasTestPage() {
  const handleCanvasReady = (instance: any) => {
    console.log('Canvas ready:', instance);

    // Add some sample nodes and edges for testing
    const sampleNodes = [
      {
        id: 'pump-1',
        type: 'component',
        position: { x: 100, y: 100 },
        data: {
          componentType: 'pump',
          label: 'P-001',
          properties: {
            power: '5kW',
            flow: '100L/min',
          },
        },
      },
      {
        id: 'valve-1',
        type: 'component',
        position: { x: 300, y: 100 },
        data: {
          componentType: 'valve',
          label: 'V-001',
          properties: {
            type: 'Ball Valve',
            size: 'DN50',
          },
        },
      },
      {
        id: 'tank-1',
        type: 'component',
        position: { x: 500, y: 100 },
        data: {
          componentType: 'tank',
          label: 'T-001',
          properties: {
            capacity: '1000L',
            pressure: '10bar',
          },
        },
      },
      {
        id: 'note-1',
        type: 'annotation',
        position: { x: 300, y: 250 },
        data: {
          label: 'Process Flow\nWater Treatment',
          fontSize: 16,
          fontWeight: 'bold',
          textAlign: 'center',
        },
      },
    ];

    const sampleEdges = [
      {
        id: 'pipe-1',
        type: 'pipe',
        source: 'pump-1',
        target: 'valve-1',
        sourceHandle: 'outlet',
        targetHandle: 'inlet',
        data: {
          pipeType: 'water',
          diameter: 50,
          pressure: 8,
          flow: 100,
          showFlow: true,
          label: 'Main Line',
        },
      },
      {
        id: 'pipe-2',
        type: 'pipe',
        source: 'valve-1',
        target: 'tank-1',
        sourceHandle: 'outlet',
        targetHandle: 'inlet',
        data: {
          pipeType: 'water',
          diameter: 50,
          pressure: 6,
          flow: 90,
          showFlow: true,
        },
      },
    ];

    // Set sample data
    setTimeout(() => {
      instance.setNodes(sampleNodes);
      instance.setEdges(sampleEdges);
      instance.fitView({ padding: 0.1 });
    }, 100);
  };

  const handleCanvasError = (error: Error) => {
    console.error('Canvas error:', error);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">
            Ergoplanner Canvas Test
          </h1>
          <p className="text-gray-600 mt-1">
            Testing ReactFlow canvas implementation with P&ID components
          </p>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 h-[calc(100vh-120px)]">
        <DrawingCanvasProvider
          drawingId="test-drawing"
          mode={CanvasMode.EDIT}
          readonly={false}
          onReady={handleCanvasReady}
          onError={handleCanvasError}
          className="w-full h-full"
        />
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-gray-500">
            Use the toolbar on the left to interact with the canvas.
            Try zooming, panning, and selecting elements.
          </p>
        </div>
      </div>
    </div>
  );
}