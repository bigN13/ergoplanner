'use client';

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from '../base/BaseNode';
import { TankProperties, NodeVisualState } from '@/types/nodes';

interface TankNodeProps extends NodeProps<TankProperties> {
  onPropertyChange?: (nodeId: string, properties: Record<string, any>) => void;
  onValidationChange?: (nodeId: string, isValid: boolean, errors: string[]) => void;
  onStateChange?: (nodeId: string, state: NodeVisualState) => void;
}

export const TankNode: React.FC<TankNodeProps> = memo((props) => {
  const { data, id } = props;

  // Tank-specific validation
  const validateTankData = (tankData: TankProperties): string[] => {
    const errors: string[] = [];

    // Volume validation
    if (!tankData.properties.volume || tankData.properties.volume <= 0) {
      errors.push('Tank volume must be greater than 0');
    }

    // Dimension validation
    if (!tankData.properties.diameter || tankData.properties.diameter <= 0) {
      errors.push('Tank diameter must be greater than 0');
    }

    if (!tankData.properties.height || tankData.properties.height <= 0) {
      errors.push('Tank height must be greater than 0');
    }

    // Wall thickness validation
    if (!tankData.properties.wallThickness || tankData.properties.wallThickness <= 0) {
      errors.push('Wall thickness must be greater than 0');
    }

    // Material validation
    if (!tankData.properties.material?.trim()) {
      errors.push('Tank material must be specified');
    }

    // Design pressure validation
    if (!tankData.properties.designPressure || tankData.properties.designPressure < 0) {
      errors.push('Design pressure must be specified and non-negative');
    }

    // Design temperature validation
    if (!tankData.properties.designTemperature) {
      errors.push('Design temperature must be specified');
    }

    // Corrosion allowance validation
    if (tankData.properties.corrosionAllowance < 0) {
      errors.push('Corrosion allowance cannot be negative');
    }

    // Pressure vessel specific validations
    if (tankData.properties.type === 'pressure-vessel') {
      if (tankData.properties.designPressure <= 0) {
        errors.push('Design pressure must be greater than 0 for pressure vessels');
      }

      if (!tankData.properties.material || !['Carbon Steel', 'Stainless Steel', 'Inconel', 'Hastelloy'].includes(tankData.properties.material)) {
        errors.push('Invalid material for pressure vessel');
      }
    }

    // Nozzle validation
    if (tankData.properties.nozzles && tankData.properties.nozzles.length > 0) {
      tankData.properties.nozzles.forEach((nozzle, index) => {
        if (!nozzle.size || nozzle.size <= 0) {
          errors.push(`Nozzle ${index + 1}: Size must be greater than 0`);
        }
        if (nozzle.elevation < 0 || nozzle.elevation > tankData.properties.height) {
          errors.push(`Nozzle ${index + 1}: Elevation must be between 0 and tank height`);
        }
        if (!nozzle.purpose?.trim()) {
          errors.push(`Nozzle ${index + 1}: Purpose must be specified`);
        }
      });
    }

    // Volume consistency check
    const calculatedVolume = Math.PI * Math.pow(tankData.properties.diameter / 2, 2) * tankData.properties.height / 1000; // m³
    const declaredVolume = tankData.properties.volume;
    const volumeRatio = Math.abs(calculatedVolume - declaredVolume) / declaredVolume;

    if (volumeRatio > 0.1) { // 10% tolerance
      errors.push(`Volume inconsistency: Calculated ${calculatedVolume.toFixed(1)} m³ vs declared ${declaredVolume} m³`);
    }

    return errors;
  };

  // Enhanced validation callback
  const handleValidationChange = (nodeId: string, isValid: boolean, errors: string[]) => {
    const tankErrors = validateTankData(data);
    const allErrors = [...errors, ...tankErrors];
    const finalIsValid = allErrors.length === 0;

    props.onValidationChange?.(nodeId, finalIsValid, allErrors);
  };

  // Enhanced property change callback
  const handlePropertyChange = (nodeId: string, properties: Record<string, any>) => {
    const updatedProperties = { ...properties };

    // Auto-calculate volume if dimensions are provided
    if (properties.diameter && properties.height) {
      const calculatedVolume = Math.PI * Math.pow(properties.diameter / 2, 2) * properties.height / 1000; // m³
      if (!properties.volume || Math.abs(properties.volume - calculatedVolume) / calculatedVolume > 0.1) {
        updatedProperties.volume = Math.round(calculatedVolume * 100) / 100;
      }
    }

    // Auto-calculate wall thickness for pressure vessels (simplified ASME calculation)
    if (properties.type === 'pressure-vessel' && properties.designPressure && properties.diameter && properties.material) {
      let allowableStress = 20000; // Default value in psi

      // Adjust allowable stress based on material
      switch (properties.material) {
        case 'Carbon Steel':
          allowableStress = 20000;
          break;
        case 'Stainless Steel':
          allowableStress = 20000;
          break;
        case 'Inconel':
          allowableStress = 30000;
          break;
        case 'Hastelloy':
          allowableStress = 35000;
          break;
      }

      const pressurePsi = properties.designPressure * 14.504; // Convert bar to psi
      const radiusInches = (properties.diameter * 1000 / 2) / 25.4; // Convert m to inches
      const efficiency = 0.85; // Joint efficiency
      const corrosionAllowance = (properties.corrosionAllowance || 3) / 25.4; // Convert mm to inches

      const requiredThickness = (pressurePsi * radiusInches) / (allowableStress * efficiency - 0.6 * pressurePsi) + corrosionAllowance;
      const requiredThicknessMm = requiredThickness * 25.4;

      if (!properties.wallThickness || properties.wallThickness < requiredThicknessMm) {
        updatedProperties.calculatedWallThickness = Math.ceil(requiredThicknessMm);
        updatedProperties.wallThickness = updatedProperties.calculatedWallThickness;
      }
    }

    // Set default nozzles based on tank type
    if (properties.type && !properties.nozzles) {
      const defaultNozzles = [];

      switch (properties.type) {
        case 'storage':
          defaultNozzles.push(
            { size: 150, elevation: properties.height * 0.9, orientation: 'top', purpose: 'Inlet' },
            { size: 100, elevation: 0.5, orientation: 'bottom', purpose: 'Outlet' },
            { size: 50, elevation: properties.height * 0.95, orientation: 'top', purpose: 'Vent' },
            { size: 25, elevation: 0.2, orientation: 'bottom', purpose: 'Drain' }
          );
          break;
        case 'process':
          defaultNozzles.push(
            { size: 100, elevation: properties.height * 0.8, orientation: 'side', purpose: 'Feed' },
            { size: 80, elevation: properties.height * 0.2, orientation: 'side', purpose: 'Product' },
            { size: 50, elevation: properties.height * 0.95, orientation: 'top', purpose: 'Vapor' },
            { size: 25, elevation: 0.1, orientation: 'bottom', purpose: 'Drain' }
          );
          break;
        case 'pressure-vessel':
          defaultNozzles.push(
            { size: 80, elevation: properties.height * 0.75, orientation: 'side', purpose: 'Inlet' },
            { size: 80, elevation: properties.height * 0.25, orientation: 'side', purpose: 'Outlet' },
            { size: 25, elevation: properties.height * 0.9, orientation: 'top', purpose: 'Relief' },
            { size: 20, elevation: 0.1, orientation: 'bottom', purpose: 'Drain' }
          );
          break;
      }

      updatedProperties.nozzles = defaultNozzles;
    }

    // Calculate surface area for heat transfer calculations
    if (properties.diameter && properties.height) {
      const cylindricalArea = Math.PI * properties.diameter * properties.height;
      const endArea = 2 * Math.PI * Math.pow(properties.diameter / 2, 2);
      updatedProperties.surfaceArea = Math.round((cylindricalArea + endArea) * 100) / 100;
    }

    // Set default insulation based on operating temperature
    if (properties.designTemperature && !properties.insulationType) {
      if (properties.designTemperature > 60) {
        updatedProperties.insulationType = 'Mineral Wool';
      } else if (properties.designTemperature < 5) {
        updatedProperties.insulationType = 'Polyurethane Foam';
      }
    }

    // Set default heating system for process tanks
    if (properties.type === 'process' && properties.designTemperature > 40 && !properties.heatingSystem) {
      if (properties.volume < 10) {
        updatedProperties.heatingSystem = 'Electric Heating Elements';
      } else {
        updatedProperties.heatingSystem = 'Steam Coils';
      }
    }

    // Set default agitation for process tanks
    if (properties.type === 'process' && !properties.agitationType) {
      if (properties.volume < 5) {
        updatedProperties.agitationType = 'Magnetic Stirrer';
      } else if (properties.volume < 50) {
        updatedProperties.agitationType = 'Paddle Agitator';
      } else {
        updatedProperties.agitationType = 'Turbine Agitator';
      }
    }

    props.onPropertyChange?.(nodeId, updatedProperties);
  };

  return (
    <BaseNode
      {...props}
      onValidationChange={handleValidationChange}
      onPropertyChange={handlePropertyChange}
    />
  );
});

TankNode.displayName = 'TankNode';

export default TankNode;