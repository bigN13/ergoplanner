'use client';

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from '../base/BaseNode';
import { PIDNodeData, NodeVisualState } from '@/types/nodes';

interface SpecialtyProperties extends PIDNodeData {
  properties: {
    specialtyType: 'strainer' | 'orifice-plate' | 'rupture-disc' | 'steam-trap' | 'check-valve' | 'safety-valve' | 'expansion-joint' | 'sight-glass';
    size: number;
    sizeUnit: string;
    pressureRating: number;
    pressureUnit: string;
    temperatureRating: number;
    temperatureUnit: string;
    material: string;
    endConnections: string;

    // Strainer specific
    meshSize?: number;
    strainerType?: 'Y' | 'basket' | 'duplex' | 'automatic';

    // Orifice plate specific
    orificeDiameter?: number;
    betaRatio?: number;
    dischargeCoefficient?: number;

    // Rupture disc specific
    burstPressure?: number;
    discMaterial?: string;

    // Steam trap specific
    trapType?: 'thermostatic' | 'mechanical' | 'thermodynamic';
    condensateCapacity?: number;

    // Safety valve specific
    setPress?: number;
    relievingCapacity?: number;

    // Expansion joint specific
    axialMovement?: number;
    lateralMovement?: number;
    angularMovement?: number;

    [key: string]: any;
  };
}

interface SpecialtyNodeProps extends NodeProps<SpecialtyProperties> {
  onPropertyChange?: (nodeId: string, properties: Record<string, any>) => void;
  onValidationChange?: (nodeId: string, isValid: boolean, errors: string[]) => void;
  onStateChange?: (nodeId: string, state: NodeVisualState) => void;
}

export const SpecialtyNode: React.FC<SpecialtyNodeProps> = memo((props) => {
  const { data, id } = props;

  // Specialty item specific validation
  const validateSpecialtyData = (specialtyData: SpecialtyProperties): string[] => {
    const errors: string[] = [];

    // Specialty type validation
    const validSpecialtyTypes = ['strainer', 'orifice-plate', 'rupture-disc', 'steam-trap', 'check-valve', 'safety-valve', 'expansion-joint', 'sight-glass'];
    if (!validSpecialtyTypes.includes(specialtyData.properties.specialtyType)) {
      errors.push('Invalid specialty item type');
    }

    // Common validations
    if (!specialtyData.properties.size || specialtyData.properties.size <= 0) {
      errors.push('Size must be greater than 0');
    }

    if (!specialtyData.properties.sizeUnit?.trim()) {
      errors.push('Size unit must be specified');
    }

    if (!specialtyData.properties.pressureRating || specialtyData.properties.pressureRating <= 0) {
      errors.push('Pressure rating must be greater than 0');
    }

    if (specialtyData.properties.temperatureRating === undefined) {
      errors.push('Temperature rating must be specified');
    }

    if (!specialtyData.properties.material?.trim()) {
      errors.push('Material must be specified');
    }

    if (!specialtyData.properties.endConnections?.trim()) {
      errors.push('End connections must be specified');
    }

    // Strainer specific validations
    if (specialtyData.properties.specialtyType === 'strainer') {
      if (!specialtyData.properties.meshSize || specialtyData.properties.meshSize <= 0) {
        errors.push('Mesh size must be greater than 0 for strainers');
      }

      const validStrainerTypes = ['Y', 'basket', 'duplex', 'automatic'];
      if (!specialtyData.properties.strainerType || !validStrainerTypes.includes(specialtyData.properties.strainerType)) {
        errors.push('Invalid strainer type');
      }

      if (specialtyData.properties.meshSize > 40) {
        errors.push('Mesh size too large (>40 mesh) - consider coarse straining');
      }
    }

    // Orifice plate specific validations
    if (specialtyData.properties.specialtyType === 'orifice-plate') {
      if (!specialtyData.properties.orificeDiameter || specialtyData.properties.orificeDiameter <= 0) {
        errors.push('Orifice diameter must be greater than 0');
      }

      if (specialtyData.properties.orificeDiameter >= specialtyData.properties.size) {
        errors.push('Orifice diameter must be smaller than pipe size');
      }

      if (specialtyData.properties.betaRatio) {
        if (specialtyData.properties.betaRatio <= 0.2 || specialtyData.properties.betaRatio >= 0.8) {
          errors.push('Beta ratio should be between 0.2 and 0.8 for accurate measurement');
        }
      }

      if (specialtyData.properties.dischargeCoefficient) {
        if (specialtyData.properties.dischargeCoefficient <= 0.5 || specialtyData.properties.dischargeCoefficient > 1.0) {
          errors.push('Discharge coefficient should be between 0.5 and 1.0');
        }
      }
    }

    // Rupture disc specific validations
    if (specialtyData.properties.specialtyType === 'rupture-disc') {
      if (!specialtyData.properties.burstPressure || specialtyData.properties.burstPressure <= 0) {
        errors.push('Burst pressure must be greater than 0 for rupture discs');
      }

      if (specialtyData.properties.burstPressure <= specialtyData.properties.pressureRating * 0.9) {
        errors.push('Burst pressure should be higher than normal operating pressure');
      }

      if (!specialtyData.properties.discMaterial?.trim()) {
        errors.push('Disc material must be specified');
      }
    }

    // Steam trap specific validations
    if (specialtyData.properties.specialtyType === 'steam-trap') {
      const validTrapTypes = ['thermostatic', 'mechanical', 'thermodynamic'];
      if (!specialtyData.properties.trapType || !validTrapTypes.includes(specialtyData.properties.trapType)) {
        errors.push('Invalid steam trap type');
      }

      if (!specialtyData.properties.condensateCapacity || specialtyData.properties.condensateCapacity <= 0) {
        errors.push('Condensate capacity must be greater than 0 for steam traps');
      }
    }

    // Safety valve specific validations
    if (specialtyData.properties.specialtyType === 'safety-valve') {
      if (!specialtyData.properties.setPress || specialtyData.properties.setPress <= 0) {
        errors.push('Set pressure must be greater than 0 for safety valves');
      }

      if (specialtyData.properties.setPress <= specialtyData.properties.pressureRating) {
        errors.push('Set pressure should be higher than normal operating pressure');
      }

      if (!specialtyData.properties.relievingCapacity || specialtyData.properties.relievingCapacity <= 0) {
        errors.push('Relieving capacity must be greater than 0 for safety valves');
      }
    }

    // Expansion joint specific validations
    if (specialtyData.properties.specialtyType === 'expansion-joint') {
      if (specialtyData.properties.axialMovement !== undefined && specialtyData.properties.axialMovement < 0) {
        errors.push('Axial movement cannot be negative');
      }

      if (specialtyData.properties.lateralMovement !== undefined && specialtyData.properties.lateralMovement < 0) {
        errors.push('Lateral movement cannot be negative');
      }

      if (specialtyData.properties.angularMovement !== undefined &&
          (specialtyData.properties.angularMovement < 0 || specialtyData.properties.angularMovement > 30)) {
        errors.push('Angular movement should be between 0 and 30 degrees');
      }
    }

    return errors;
  };

  // Enhanced validation callback
  const handleValidationChange = (nodeId: string, isValid: boolean, errors: string[]) => {
    const specialtyErrors = validateSpecialtyData(data);
    const allErrors = [...errors, ...specialtyErrors];
    const finalIsValid = allErrors.length === 0;

    props.onValidationChange?.(nodeId, finalIsValid, allErrors);
  };

  // Enhanced property change callback
  const handlePropertyChange = (nodeId: string, properties: Record<string, any>) => {
    const updatedProperties = { ...properties };

    // Set type-specific defaults
    switch (properties.specialtyType) {
      case 'strainer':
        setStrainerDefaults(updatedProperties, properties);
        break;
      case 'orifice-plate':
        setOrificePlateDefaults(updatedProperties, properties);
        break;
      case 'rupture-disc':
        setRuptureDiscDefaults(updatedProperties, properties);
        break;
      case 'steam-trap':
        setSteamTrapDefaults(updatedProperties, properties);
        break;
      case 'safety-valve':
        setSafetyValveDefaults(updatedProperties, properties);
        break;
      case 'expansion-joint':
        setExpansionJointDefaults(updatedProperties, properties);
        break;
      case 'sight-glass':
        setSightGlassDefaults(updatedProperties, properties);
        break;
    }

    // Set default material if not specified
    if (!properties.material) {
      if (properties.temperatureRating > 400 || properties.pressureRating > 40) {
        updatedProperties.material = 'Stainless Steel 316';
      } else {
        updatedProperties.material = 'Carbon Steel';
      }
    }

    // Set default pressure and temperature ratings
    if (!properties.pressureRating) {
      updatedProperties.pressureRating = 25; // bar
    }

    if (properties.temperatureRating === undefined) {
      updatedProperties.temperatureRating = 200; // °C
    }

    // Set default end connections based on size
    if (!properties.endConnections) {
      if (properties.size <= 2) {
        updatedProperties.endConnections = 'Threaded';
      } else if (properties.size <= 4) {
        updatedProperties.endConnections = 'Socket Weld';
      } else {
        updatedProperties.endConnections = 'Flanged';
      }
    }

    // Set default units
    if (!properties.sizeUnit) {
      updatedProperties.sizeUnit = 'inch';
    }

    if (!properties.pressureUnit) {
      updatedProperties.pressureUnit = 'bar';
    }

    if (!properties.temperatureUnit) {
      updatedProperties.temperatureUnit = '°C';
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

// Helper functions to set type-specific defaults
function setStrainerDefaults(updatedProperties: any, properties: any) {
  if (!properties.meshSize) {
    updatedProperties.meshSize = 20; // 20 mesh typical
  }

  if (!properties.strainerType) {
    if (properties.size <= 2) {
      updatedProperties.strainerType = 'Y';
    } else {
      updatedProperties.strainerType = 'basket';
    }
  }

  if (!properties.material) {
    updatedProperties.material = 'Stainless Steel 316';
  }
}

function setOrificePlateDefaults(updatedProperties: any, properties: any) {
  if (!properties.orificeDiameter && properties.size) {
    // Default to 0.7 beta ratio
    updatedProperties.orificeDiameter = properties.size * 0.7;
    updatedProperties.betaRatio = 0.7;
  }

  if (!properties.dischargeCoefficient) {
    updatedProperties.dischargeCoefficient = 0.61; // Typical for sharp-edge orifice
  }

  if (!properties.material) {
    updatedProperties.material = 'Stainless Steel 316';
  }
}

function setRuptureDiscDefaults(updatedProperties: any, properties: any) {
  if (!properties.burstPressure && properties.pressureRating) {
    updatedProperties.burstPressure = properties.pressureRating * 1.1; // 110% of operating pressure
  }

  if (!properties.discMaterial) {
    if (properties.temperatureRating > 300) {
      updatedProperties.discMaterial = 'Inconel';
    } else {
      updatedProperties.discMaterial = 'Stainless Steel 316';
    }
  }
}

function setSteamTrapDefaults(updatedProperties: any, properties: any) {
  if (!properties.trapType) {
    if (properties.size <= 1) {
      updatedProperties.trapType = 'thermostatic';
    } else {
      updatedProperties.trapType = 'mechanical';
    }
  }

  if (!properties.condensateCapacity) {
    // Estimate based on size (very approximate)
    updatedProperties.condensateCapacity = properties.size * properties.size * 100; // kg/h
  }

  if (!properties.material) {
    updatedProperties.material = 'Stainless Steel 316';
  }
}

function setSafetyValveDefaults(updatedProperties: any, properties: any) {
  if (!properties.setPress && properties.pressureRating) {
    updatedProperties.setPress = properties.pressureRating * 1.05; // 5% over operating pressure
  }

  if (!properties.relievingCapacity) {
    // Estimate based on size (very approximate)
    updatedProperties.relievingCapacity = properties.size * properties.size * 1000; // kg/h
  }

  if (!properties.material) {
    updatedProperties.material = 'Stainless Steel 316';
  }
}

function setExpansionJointDefaults(updatedProperties: any, properties: any) {
  if (properties.axialMovement === undefined) {
    updatedProperties.axialMovement = properties.size * 5; // mm, rough estimate
  }

  if (properties.lateralMovement === undefined) {
    updatedProperties.lateralMovement = properties.size * 2; // mm
  }

  if (properties.angularMovement === undefined) {
    updatedProperties.angularMovement = 10; // degrees
  }

  if (!properties.bellowsMaterial) {
    updatedProperties.bellowsMaterial = 'Stainless Steel 321';
  }
}

function setSightGlassDefaults(updatedProperties: any, properties: any) {
  if (!properties.glassType) {
    if (properties.pressureRating > 40) {
      updatedProperties.glassType = 'Tempered';
    } else {
      updatedProperties.glassType = 'Standard';
    }
  }

  if (!properties.material) {
    updatedProperties.material = 'Stainless Steel 304';
  }

  if (!properties.gasketMaterial) {
    if (properties.temperatureRating > 200) {
      updatedProperties.gasketMaterial = 'PTFE';
    } else {
      updatedProperties.gasketMaterial = 'EPDM';
    }
  }
}

SpecialtyNode.displayName = 'SpecialtyNode';

export default SpecialtyNode;