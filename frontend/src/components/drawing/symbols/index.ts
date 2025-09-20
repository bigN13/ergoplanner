/**
 * P&ID Symbol Library
 * Industry-standard SVG symbols following ISA-5.1, ISO 14617, and UK water standards
 */

import { NodeSymbol, PIDNodeType, HandleType } from '@/types/nodes';

// Equipment Symbols
export const PUMP_CENTRIFUGAL_SYMBOL: NodeSymbol = {
  id: 'pump-centrifugal',
  name: 'Centrifugal Pump',
  nodeType: 'pump-centrifugal',
  standard: 'ISA-5.1',
  svg: `
    <svg viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="pumpPattern" patternUnits="userSpaceOnUse" width="4" height="4">
          <path d="M0,0 L4,4 M4,0 L0,4" stroke="currentColor" stroke-width="0.5" opacity="0.3"/>
        </pattern>
      </defs>
      <!-- Pump casing (circle) -->
      <circle cx="40" cy="30" r="20" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- Impeller -->
      <path d="M25,30 Q40,15 55,30 Q40,45 25,30" fill="url(#pumpPattern)" stroke="currentColor" stroke-width="1"/>
      <!-- Inlet pipe -->
      <line x1="5" y1="30" x2="20" y2="30" stroke="currentColor" stroke-width="3"/>
      <!-- Outlet pipe -->
      <line x1="60" y1="30" x2="75" y2="30" stroke="currentColor" stroke-width="3"/>
      <!-- Motor connection -->
      <rect x="35" y="5" width="10" height="15" fill="none" stroke="currentColor" stroke-width="1"/>
      <text x="40" y="15" text-anchor="middle" font-size="8" fill="currentColor">M</text>
    </svg>
  `,
  viewBox: '0 0 80 60',
  defaultSize: { width: 80, height: 60 },
  connectionPoints: [
    { id: 'inlet', x: 5, y: 30, type: HandleType.LIQUID_INLET },
    { id: 'outlet', x: 75, y: 30, type: HandleType.LIQUID_OUTLET }
  ],
  rotatable: true,
  mirrorable: true,
  scalable: true,
  version: '1.0'
};

export const VALVE_GATE_SYMBOL: NodeSymbol = {
  id: 'valve-gate',
  name: 'Gate Valve',
  nodeType: 'valve-gate',
  standard: 'ISA-5.1',
  svg: `
    <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
      <!-- Valve body -->
      <polygon points="20,10 40,10 45,20 40,30 20,30 15,20" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- Gate -->
      <line x1="25" y1="10" x2="35" y2="30" stroke="currentColor" stroke-width="3"/>
      <!-- Stem -->
      <line x1="30" y1="10" x2="30" y2="5" stroke="currentColor" stroke-width="2"/>
      <rect x="27" y="2" width="6" height="6" fill="none" stroke="currentColor" stroke-width="1"/>
      <!-- Inlet pipe -->
      <line x1="5" y1="20" x2="15" y2="20" stroke="currentColor" stroke-width="3"/>
      <!-- Outlet pipe -->
      <line x1="45" y1="20" x2="55" y2="20" stroke="currentColor" stroke-width="3"/>
    </svg>
  `,
  viewBox: '0 0 60 40',
  defaultSize: { width: 60, height: 40 },
  connectionPoints: [
    { id: 'inlet', x: 5, y: 20, type: HandleType.LIQUID_INLET },
    { id: 'outlet', x: 55, y: 20, type: HandleType.LIQUID_OUTLET }
  ],
  rotatable: true,
  mirrorable: true,
  scalable: true,
  version: '1.0'
};

export const VALVE_BALL_SYMBOL: NodeSymbol = {
  id: 'valve-ball',
  name: 'Ball Valve',
  nodeType: 'valve-ball',
  standard: 'ISA-5.1',
  svg: `
    <svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
      <!-- Valve body -->
      <polygon points="20,10 40,10 45,20 40,30 20,30 15,20" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- Ball -->
      <circle cx="30" cy="20" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- Ball port -->
      <line x1="22" y1="20" x2="38" y2="20" stroke="currentColor" stroke-width="2"/>
      <!-- Actuator -->
      <rect x="27" y="5" width="6" height="8" fill="none" stroke="currentColor" stroke-width="1"/>
      <!-- Inlet pipe -->
      <line x1="5" y1="20" x2="15" y2="20" stroke="currentColor" stroke-width="3"/>
      <!-- Outlet pipe -->
      <line x1="45" y1="20" x2="55" y2="20" stroke="currentColor" stroke-width="3"/>
    </svg>
  `,
  viewBox: '0 0 60 40',
  defaultSize: { width: 60, height: 40 },
  connectionPoints: [
    { id: 'inlet', x: 5, y: 20, type: HandleType.LIQUID_INLET },
    { id: 'outlet', x: 55, y: 20, type: HandleType.LIQUID_OUTLET }
  ],
  rotatable: true,
  mirrorable: true,
  scalable: true,
  version: '1.0'
};

export const TANK_STORAGE_SYMBOL: NodeSymbol = {
  id: 'tank-storage',
  name: 'Storage Tank',
  nodeType: 'tank-storage',
  standard: 'ISA-5.1',
  svg: `
    <svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg">
      <!-- Tank body -->
      <rect x="15" y="20" width="50" height="60" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- Tank roof -->
      <ellipse cx="40" cy="20" rx="25" ry="8" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- Tank bottom -->
      <ellipse cx="40" cy="80" rx="25" ry="8" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- Liquid level -->
      <line x1="15" y1="60" x2="65" y2="60" stroke="currentColor" stroke-width="1" stroke-dasharray="2,2"/>
      <!-- Inlet nozzle -->
      <line x1="40" y1="5" x2="40" y2="20" stroke="currentColor" stroke-width="3"/>
      <!-- Outlet nozzle -->
      <line x1="65" y1="70" x2="75" y2="70" stroke="currentColor" stroke-width="3"/>
      <!-- Drain nozzle -->
      <line x1="40" y1="80" x2="40" y2="95" stroke="currentColor" stroke-width="2"/>
    </svg>
  `,
  viewBox: '0 0 80 100',
  defaultSize: { width: 80, height: 100 },
  connectionPoints: [
    { id: 'inlet', x: 40, y: 5, type: HandleType.LIQUID_INLET },
    { id: 'outlet', x: 75, y: 70, type: HandleType.LIQUID_OUTLET },
    { id: 'drain', x: 40, y: 95, type: HandleType.DRAIN }
  ],
  rotatable: false,
  mirrorable: true,
  scalable: true,
  version: '1.0'
};

export const HEAT_EXCHANGER_SHELL_TUBE_SYMBOL: NodeSymbol = {
  id: 'heat-exchanger-shell-tube',
  name: 'Shell & Tube Heat Exchanger',
  nodeType: 'heat-exchanger-shell-tube',
  standard: 'ISA-5.1',
  svg: `
    <svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
      <!-- Shell -->
      <ellipse cx="50" cy="30" rx="35" ry="15" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- Tube bundle -->
      <line x1="20" y1="25" x2="80" y2="25" stroke="currentColor" stroke-width="1"/>
      <line x1="20" y1="30" x2="80" y2="30" stroke="currentColor" stroke-width="1"/>
      <line x1="20" y1="35" x2="80" y2="35" stroke="currentColor" stroke-width="1"/>
      <!-- Shell side inlet -->
      <line x1="5" y1="30" x2="15" y2="30" stroke="currentColor" stroke-width="3"/>
      <!-- Shell side outlet -->
      <line x1="85" y1="30" x2="95" y2="30" stroke="currentColor" stroke-width="3"/>
      <!-- Tube side inlet -->
      <line x1="15" y1="10" x2="15" y2="15" stroke="currentColor" stroke-width="3"/>
      <!-- Tube side outlet -->
      <line x1="85" y1="45" x2="85" y2="50" stroke="currentColor" stroke-width="3"/>
      <!-- Channel heads -->
      <circle cx="15" cy="30" r="8" fill="none" stroke="currentColor" stroke-width="1"/>
      <circle cx="85" cy="30" r="8" fill="none" stroke="currentColor" stroke-width="1"/>
    </svg>
  `,
  viewBox: '0 0 100 60',
  defaultSize: { width: 100, height: 60 },
  connectionPoints: [
    { id: 'shell-inlet', x: 5, y: 30, type: HandleType.LIQUID_INLET },
    { id: 'shell-outlet', x: 95, y: 30, type: HandleType.LIQUID_OUTLET },
    { id: 'tube-inlet', x: 15, y: 10, type: HandleType.LIQUID_INLET },
    { id: 'tube-outlet', x: 85, y: 50, type: HandleType.LIQUID_OUTLET }
  ],
  rotatable: true,
  mirrorable: true,
  scalable: true,
  version: '1.0'
};

// Instrumentation Symbols
export const SENSOR_PRESSURE_SYMBOL: NodeSymbol = {
  id: 'sensor-pressure',
  name: 'Pressure Sensor',
  nodeType: 'sensor-pressure',
  standard: 'ISA-5.1',
  svg: `
    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <!-- Instrument circle -->
      <circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- Tag designation -->
      <text x="20" y="18" text-anchor="middle" font-size="8" fill="currentColor" font-weight="bold">P</text>
      <text x="20" y="26" text-anchor="middle" font-size="6" fill="currentColor">001</text>
      <!-- Process connection -->
      <line x1="20" y1="35" x2="20" y2="40" stroke="currentColor" stroke-width="2"/>
      <!-- Signal connection -->
      <line x1="35" y1="20" x2="40" y2="20" stroke="currentColor" stroke-width="1" stroke-dasharray="2,1"/>
    </svg>
  `,
  viewBox: '0 0 40 40',
  defaultSize: { width: 40, height: 40 },
  connectionPoints: [
    { id: 'process', x: 20, y: 40, type: HandleType.LIQUID_INLET },
    { id: 'signal', x: 40, y: 20, type: HandleType.SIGNAL_OUTPUT }
  ],
  rotatable: true,
  mirrorable: false,
  scalable: true,
  version: '1.0'
};

export const TRANSMITTER_4_20MA_SYMBOL: NodeSymbol = {
  id: 'transmitter-4-20ma',
  name: '4-20mA Transmitter',
  nodeType: 'transmitter-4-20ma',
  standard: 'ISA-5.1',
  svg: `
    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <!-- Instrument square -->
      <rect x="5" y="5" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- Tag designation -->
      <text x="20" y="18" text-anchor="middle" font-size="8" fill="currentColor" font-weight="bold">PT</text>
      <text x="20" y="26" text-anchor="middle" font-size="6" fill="currentColor">101</text>
      <!-- Process connection -->
      <line x1="20" y1="35" x2="20" y2="40" stroke="currentColor" stroke-width="2"/>
      <!-- Signal connections -->
      <line x1="35" y1="15" x2="40" y2="15" stroke="currentColor" stroke-width="1"/>
      <line x1="35" y1="25" x2="40" y2="25" stroke="currentColor" stroke-width="1"/>
      <!-- 4-20mA indicator -->
      <text x="38" y="12" font-size="4" fill="currentColor">+</text>
      <text x="38" y="28" font-size="4" fill="currentColor">-</text>
    </svg>
  `,
  viewBox: '0 0 40 40',
  defaultSize: { width: 40, height: 40 },
  connectionPoints: [
    { id: 'process', x: 20, y: 40, type: HandleType.LIQUID_INLET },
    { id: 'signal-pos', x: 40, y: 15, type: HandleType.SIGNAL_OUTPUT },
    { id: 'signal-neg', x: 40, y: 25, type: HandleType.SIGNAL_OUTPUT }
  ],
  rotatable: true,
  mirrorable: false,
  scalable: true,
  version: '1.0'
};

export const CONTROLLER_PID_SYMBOL: NodeSymbol = {
  id: 'controller-pid',
  name: 'PID Controller',
  nodeType: 'controller-pid',
  standard: 'ISA-5.1',
  svg: `
    <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
      <!-- Controller housing -->
      <rect x="5" y="5" width="40" height="40" rx="5" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- Display -->
      <rect x="8" y="8" width="34" height="20" fill="none" stroke="currentColor" stroke-width="1"/>
      <!-- Tag designation -->
      <text x="25" y="20" text-anchor="middle" font-size="8" fill="currentColor" font-weight="bold">PIC</text>
      <text x="25" y="27" text-anchor="middle" font-size="6" fill="currentColor">201</text>
      <!-- Control buttons -->
      <circle cx="15" cy="35" r="3" fill="none" stroke="currentColor" stroke-width="1"/>
      <circle cx="25" cy="35" r="3" fill="none" stroke="currentColor" stroke-width="1"/>
      <circle cx="35" cy="35" r="3" fill="none" stroke="currentColor" stroke-width="1"/>
      <!-- Signal connections -->
      <line x1="45" y1="15" x2="50" y2="15" stroke="currentColor" stroke-width="1"/>
      <line x1="45" y1="35" x2="50" y2="35" stroke="currentColor" stroke-width="1"/>
      <line x1="5" y1="25" x2="0" y2="25" stroke="currentColor" stroke-width="1"/>
    </svg>
  `,
  viewBox: '0 0 50 50',
  defaultSize: { width: 50, height: 50 },
  connectionPoints: [
    { id: 'input', x: 0, y: 25, type: HandleType.SIGNAL_INPUT },
    { id: 'output', x: 50, y: 35, type: HandleType.CONTROL_OUTPUT },
    { id: 'setpoint', x: 50, y: 15, type: HandleType.SIGNAL_INPUT }
  ],
  rotatable: true,
  mirrorable: false,
  scalable: true,
  version: '1.0'
};

// Piping Component Symbols
export const FITTING_ELBOW_SYMBOL: NodeSymbol = {
  id: 'fitting-elbow',
  name: '90° Elbow',
  nodeType: 'fitting-elbow',
  standard: 'ISA-5.1',
  svg: `
    <svg viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
      <!-- Elbow fitting -->
      <path d="M5,15 Q15,15 15,5" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <!-- Connection points -->
      <circle cx="5" cy="15" r="2" fill="currentColor"/>
      <circle cx="15" cy="5" r="2" fill="currentColor"/>
    </svg>
  `,
  viewBox: '0 0 30 30',
  defaultSize: { width: 30, height: 30 },
  connectionPoints: [
    { id: 'inlet', x: 5, y: 15, type: HandleType.LIQUID_INLET },
    { id: 'outlet', x: 15, y: 5, type: HandleType.LIQUID_OUTLET }
  ],
  rotatable: true,
  mirrorable: true,
  scalable: true,
  version: '1.0'
};

export const FITTING_TEE_SYMBOL: NodeSymbol = {
  id: 'fitting-tee',
  name: 'Tee Fitting',
  nodeType: 'fitting-tee',
  standard: 'ISA-5.1',
  svg: `
    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <!-- Horizontal pipe -->
      <line x1="5" y1="20" x2="35" y2="20" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <!-- Vertical branch -->
      <line x1="20" y1="20" x2="20" y2="5" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <!-- Connection points -->
      <circle cx="5" cy="20" r="2" fill="currentColor"/>
      <circle cx="35" cy="20" r="2" fill="currentColor"/>
      <circle cx="20" cy="5" r="2" fill="currentColor"/>
    </svg>
  `,
  viewBox: '0 0 40 40',
  defaultSize: { width: 40, height: 40 },
  connectionPoints: [
    { id: 'inlet', x: 5, y: 20, type: HandleType.LIQUID_INLET },
    { id: 'outlet', x: 35, y: 20, type: HandleType.LIQUID_OUTLET },
    { id: 'branch', x: 20, y: 5, type: HandleType.LIQUID_OUTLET }
  ],
  rotatable: true,
  mirrorable: true,
  scalable: true,
  version: '1.0'
};

// Electrical Symbols
export const ELECTRICAL_MOTOR_SYMBOL: NodeSymbol = {
  id: 'electrical-motor',
  name: 'Electric Motor',
  nodeType: 'electrical-motor',
  standard: 'ISA-5.1',
  svg: `
    <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
      <!-- Motor housing -->
      <circle cx="25" cy="25" r="18" fill="none" stroke="currentColor" stroke-width="2"/>
      <!-- Motor designation -->
      <text x="25" y="28" text-anchor="middle" font-size="12" fill="currentColor" font-weight="bold">M</text>
      <!-- Power connections -->
      <line x1="25" y1="7" x2="25" y2="2" stroke="currentColor" stroke-width="2"/>
      <line x1="20" y1="10" x2="18" y2="5" stroke="currentColor" stroke-width="2"/>
      <line x1="30" y1="10" x2="32" y2="5" stroke="currentColor" stroke-width="2"/>
      <!-- Shaft -->
      <line x1="43" y1="25" x2="50" y2="25" stroke="currentColor" stroke-width="3"/>
      <!-- Terminal box -->
      <rect x="15" y="2" width="20" height="8" fill="none" stroke="currentColor" stroke-width="1"/>
    </svg>
  `,
  viewBox: '0 0 50 50',
  defaultSize: { width: 50, height: 50 },
  connectionPoints: [
    { id: 'power-l1', x: 25, y: 2, type: HandleType.ELECTRICAL_INPUT },
    { id: 'power-l2', x: 18, y: 5, type: HandleType.ELECTRICAL_INPUT },
    { id: 'power-l3', x: 32, y: 5, type: HandleType.ELECTRICAL_INPUT },
    { id: 'shaft', x: 50, y: 25, type: HandleType.LIQUID_OUTLET }
  ],
  rotatable: true,
  mirrorable: true,
  scalable: true,
  version: '1.0'
};

// Symbol registry
export const SYMBOL_REGISTRY: Record<PIDNodeType, NodeSymbol> = {
  'pump-centrifugal': PUMP_CENTRIFUGAL_SYMBOL,
  'pump-positive-displacement': {
    ...PUMP_CENTRIFUGAL_SYMBOL,
    id: 'pump-positive-displacement',
    name: 'Positive Displacement Pump',
    nodeType: 'pump-positive-displacement',
    svg: PUMP_CENTRIFUGAL_SYMBOL.svg.replace(
      'Q40,15 55,30 Q40,45 25,30',
      'L55,30 L40,15 L25,30 L40,45 Z'
    )
  },
  'pump-submersible': {
    ...PUMP_CENTRIFUGAL_SYMBOL,
    id: 'pump-submersible',
    name: 'Submersible Pump',
    nodeType: 'pump-submersible'
  },
  'valve-gate': VALVE_GATE_SYMBOL,
  'valve-ball': VALVE_BALL_SYMBOL,
  'valve-butterfly': {
    ...VALVE_BALL_SYMBOL,
    id: 'valve-butterfly',
    name: 'Butterfly Valve',
    nodeType: 'valve-butterfly',
    svg: VALVE_BALL_SYMBOL.svg.replace(
      '<circle cx="30" cy="20" r="8" fill="none" stroke="currentColor" stroke-width="2"/>',
      '<ellipse cx="30" cy="20" rx="12" ry="3" fill="none" stroke="currentColor" stroke-width="2"/>'
    )
  },
  'valve-check': {
    ...VALVE_GATE_SYMBOL,
    id: 'valve-check',
    name: 'Check Valve',
    nodeType: 'valve-check',
    svg: VALVE_GATE_SYMBOL.svg.replace(
      '<line x1="25" y1="10" x2="35" y2="30" stroke="currentColor" stroke-width="3"/>',
      '<polygon points="25,15 35,20 25,25" fill="currentColor"/>'
    )
  },
  'valve-relief': {
    ...VALVE_GATE_SYMBOL,
    id: 'valve-relief',
    name: 'Relief Valve',
    nodeType: 'valve-relief'
  },
  'valve-control': {
    ...VALVE_BALL_SYMBOL,
    id: 'valve-control',
    name: 'Control Valve',
    nodeType: 'valve-control'
  },
  'tank-storage': TANK_STORAGE_SYMBOL,
  'tank-process': {
    ...TANK_STORAGE_SYMBOL,
    id: 'tank-process',
    name: 'Process Tank',
    nodeType: 'tank-process'
  },
  'tank-pressure-vessel': {
    ...TANK_STORAGE_SYMBOL,
    id: 'tank-pressure-vessel',
    name: 'Pressure Vessel',
    nodeType: 'tank-pressure-vessel'
  },
  'heat-exchanger-shell-tube': HEAT_EXCHANGER_SHELL_TUBE_SYMBOL,
  'heat-exchanger-plate': {
    ...HEAT_EXCHANGER_SHELL_TUBE_SYMBOL,
    id: 'heat-exchanger-plate',
    name: 'Plate Heat Exchanger',
    nodeType: 'heat-exchanger-plate'
  },
  'heat-exchanger-air-cooler': {
    ...HEAT_EXCHANGER_SHELL_TUBE_SYMBOL,
    id: 'heat-exchanger-air-cooler',
    name: 'Air Cooler',
    nodeType: 'heat-exchanger-air-cooler'
  },
  'compressor-centrifugal': {
    ...PUMP_CENTRIFUGAL_SYMBOL,
    id: 'compressor-centrifugal',
    name: 'Centrifugal Compressor',
    nodeType: 'compressor-centrifugal'
  },
  'compressor-reciprocating': {
    ...PUMP_CENTRIFUGAL_SYMBOL,
    id: 'compressor-reciprocating',
    name: 'Reciprocating Compressor',
    nodeType: 'compressor-reciprocating'
  },
  'compressor-screw': {
    ...PUMP_CENTRIFUGAL_SYMBOL,
    id: 'compressor-screw',
    name: 'Screw Compressor',
    nodeType: 'compressor-screw'
  },
  'sensor-pressure': SENSOR_PRESSURE_SYMBOL,
  'sensor-temperature': {
    ...SENSOR_PRESSURE_SYMBOL,
    id: 'sensor-temperature',
    name: 'Temperature Sensor',
    nodeType: 'sensor-temperature',
    svg: SENSOR_PRESSURE_SYMBOL.svg.replace('<text x="20" y="18" text-anchor="middle" font-size="8" fill="currentColor" font-weight="bold">P</text>', '<text x="20" y="18" text-anchor="middle" font-size="8" fill="currentColor" font-weight="bold">T</text>')
  },
  'sensor-flow': {
    ...SENSOR_PRESSURE_SYMBOL,
    id: 'sensor-flow',
    name: 'Flow Sensor',
    nodeType: 'sensor-flow',
    svg: SENSOR_PRESSURE_SYMBOL.svg.replace('<text x="20" y="18" text-anchor="middle" font-size="8" fill="currentColor" font-weight="bold">P</text>', '<text x="20" y="18" text-anchor="middle" font-size="8" fill="currentColor" font-weight="bold">F</text>')
  },
  'sensor-level': {
    ...SENSOR_PRESSURE_SYMBOL,
    id: 'sensor-level',
    name: 'Level Sensor',
    nodeType: 'sensor-level',
    svg: SENSOR_PRESSURE_SYMBOL.svg.replace('<text x="20" y="18" text-anchor="middle" font-size="8" fill="currentColor" font-weight="bold">P</text>', '<text x="20" y="18" text-anchor="middle" font-size="8" fill="currentColor" font-weight="bold">L</text>')
  },
  'sensor-ph': {
    ...SENSOR_PRESSURE_SYMBOL,
    id: 'sensor-ph',
    name: 'pH Sensor',
    nodeType: 'sensor-ph',
    svg: SENSOR_PRESSURE_SYMBOL.svg.replace('<text x="20" y="18" text-anchor="middle" font-size="8" fill="currentColor" font-weight="bold">P</text>', '<text x="20" y="18" text-anchor="middle" font-size="6" fill="currentColor" font-weight="bold">pH</text>')
  },
  'transmitter-4-20ma': TRANSMITTER_4_20MA_SYMBOL,
  'transmitter-digital': {
    ...TRANSMITTER_4_20MA_SYMBOL,
    id: 'transmitter-digital',
    name: 'Digital Transmitter',
    nodeType: 'transmitter-digital'
  },
  'transmitter-wireless': {
    ...TRANSMITTER_4_20MA_SYMBOL,
    id: 'transmitter-wireless',
    name: 'Wireless Transmitter',
    nodeType: 'transmitter-wireless'
  },
  'controller-pid': CONTROLLER_PID_SYMBOL,
  'controller-on-off': {
    ...CONTROLLER_PID_SYMBOL,
    id: 'controller-on-off',
    name: 'On/Off Controller',
    nodeType: 'controller-on-off'
  },
  'controller-cascade': {
    ...CONTROLLER_PID_SYMBOL,
    id: 'controller-cascade',
    name: 'Cascade Controller',
    nodeType: 'controller-cascade'
  },
  'indicator-local': {
    ...SENSOR_PRESSURE_SYMBOL,
    id: 'indicator-local',
    name: 'Local Indicator',
    nodeType: 'indicator-local'
  },
  'indicator-remote': {
    ...CONTROLLER_PID_SYMBOL,
    id: 'indicator-remote',
    name: 'Remote Indicator',
    nodeType: 'indicator-remote'
  },
  'indicator-digital': {
    ...CONTROLLER_PID_SYMBOL,
    id: 'indicator-digital',
    name: 'Digital Indicator',
    nodeType: 'indicator-digital'
  },
  'final-control-valve': {
    ...VALVE_CONTROL_SYMBOL,
    id: 'final-control-valve',
    name: 'Final Control Valve',
    nodeType: 'final-control-valve'
  },
  'final-control-vfd': {
    ...ELECTRICAL_MOTOR_SYMBOL,
    id: 'final-control-vfd',
    name: 'Variable Frequency Drive',
    nodeType: 'final-control-vfd'
  },
  'fitting-elbow': FITTING_ELBOW_SYMBOL,
  'fitting-tee': FITTING_TEE_SYMBOL,
  'fitting-reducer': {
    ...FITTING_ELBOW_SYMBOL,
    id: 'fitting-reducer',
    name: 'Reducer',
    nodeType: 'fitting-reducer'
  },
  'fitting-coupling': {
    ...FITTING_ELBOW_SYMBOL,
    id: 'fitting-coupling',
    name: 'Coupling',
    nodeType: 'fitting-coupling'
  },
  'specialty-strainer': {
    ...VALVE_GATE_SYMBOL,
    id: 'specialty-strainer',
    name: 'Strainer',
    nodeType: 'specialty-strainer'
  },
  'specialty-orifice-plate': {
    ...VALVE_GATE_SYMBOL,
    id: 'specialty-orifice-plate',
    name: 'Orifice Plate',
    nodeType: 'specialty-orifice-plate'
  },
  'specialty-rupture-disc': {
    ...VALVE_GATE_SYMBOL,
    id: 'specialty-rupture-disc',
    name: 'Rupture Disc',
    nodeType: 'specialty-rupture-disc'
  },
  'pipe-segment': {
    ...FITTING_ELBOW_SYMBOL,
    id: 'pipe-segment',
    name: 'Pipe Segment',
    nodeType: 'pipe-segment'
  },
  'connection-point': {
    ...FITTING_ELBOW_SYMBOL,
    id: 'connection-point',
    name: 'Connection Point',
    nodeType: 'connection-point'
  },
  'connection-terminal': {
    ...FITTING_ELBOW_SYMBOL,
    id: 'connection-terminal',
    name: 'Connection Terminal',
    nodeType: 'connection-terminal'
  },
  'electrical-motor': ELECTRICAL_MOTOR_SYMBOL,
  'electrical-junction-box': {
    ...CONTROLLER_PID_SYMBOL,
    id: 'electrical-junction-box',
    name: 'Junction Box',
    nodeType: 'electrical-junction-box'
  },
  'electrical-panel': {
    ...CONTROLLER_PID_SYMBOL,
    id: 'electrical-panel',
    name: 'Electrical Panel',
    nodeType: 'electrical-panel'
  },
  'safety-emergency-stop': {
    ...CONTROLLER_PID_SYMBOL,
    id: 'safety-emergency-stop',
    name: 'Emergency Stop',
    nodeType: 'safety-emergency-stop'
  },
  'safety-alarm': {
    ...CONTROLLER_PID_SYMBOL,
    id: 'safety-alarm',
    name: 'Safety Alarm',
    nodeType: 'safety-alarm'
  },
  'safety-interlock': {
    ...CONTROLLER_PID_SYMBOL,
    id: 'safety-interlock',
    name: 'Safety Interlock',
    nodeType: 'safety-interlock'
  },
  'utility-steam': {
    ...FITTING_ELBOW_SYMBOL,
    id: 'utility-steam',
    name: 'Steam Utility',
    nodeType: 'utility-steam'
  },
  'utility-air': {
    ...FITTING_ELBOW_SYMBOL,
    id: 'utility-air',
    name: 'Air Utility',
    nodeType: 'utility-air'
  },
  'utility-nitrogen': {
    ...FITTING_ELBOW_SYMBOL,
    id: 'utility-nitrogen',
    name: 'Nitrogen Utility',
    nodeType: 'utility-nitrogen'
  },
  'utility-drain': {
    ...FITTING_ELBOW_SYMBOL,
    id: 'utility-drain',
    name: 'Drain Utility',
    nodeType: 'utility-drain'
  }
};

// Helper function to get symbol by node type
export function getSymbolByType(nodeType: PIDNodeType): NodeSymbol | undefined {
  return SYMBOL_REGISTRY[nodeType];
}

// Helper function to get all symbols by category
export function getSymbolsByCategory(category: string): NodeSymbol[] {
  return Object.values(SYMBOL_REGISTRY).filter(symbol =>
    symbol.nodeType.startsWith(category)
  );
}

// Helper function to get symbols by standard
export function getSymbolsByStandard(standard: 'ISA-5.1' | 'ISO-14617' | 'UK-Water'): NodeSymbol[] {
  return Object.values(SYMBOL_REGISTRY).filter(symbol =>
    symbol.standard === standard
  );
}

export default SYMBOL_REGISTRY;