'use client';

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
// import { useSignalR } from '@/hooks/useSignalR';
import {
  updateCollaborator,
  removeCollaborator,
  updateReactFlowData,
} from '@/store/slices/drawingSlice';

interface CanvasSignalRIntegrationProps {
  drawingId: string;
  children: React.ReactNode;
}

export const CanvasSignalRIntegration: React.FC<CanvasSignalRIntegrationProps> = ({
  drawingId,
  children,
}) => {
  const dispatch = useAppDispatch();
  // const { isConnected, joinGroup, leaveGroup } = useSignalR();

  // useEffect(() => {
  //   if (isConnected && drawingId) {
  //     // Join the drawing room for real-time collaboration
  //     joinGroup(`drawing-${drawingId}`);

  //     return () => {
  //       leaveGroup(`drawing-${drawingId}`);
  //     };
  //   }
  // }, [isConnected, drawingId, joinGroup, leaveGroup]);

  // For now, we'll just render children without actual SignalR integration
  // The full integration will be completed when the SignalR infrastructure is ready
  return <>{children}</>;
};