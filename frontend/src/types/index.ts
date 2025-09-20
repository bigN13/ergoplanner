// Auth Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
  isEmailConfirmed: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresAt: string;
}

// User Roles
export enum UserRole {
  Admin = 'Admin',
  ProjectManager = 'ProjectManager',
  Approver = 'Approver',
  Reviewer = 'Reviewer',
  Checker = 'Checker',
  Author = 'Author',
  Viewer = 'Viewer'
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  drawings: Drawing[];
  teamMembers: ProjectMember[];
}

export enum ProjectStatus {
  Draft = 'Draft',
  Active = 'Active',
  OnHold = 'OnHold',
  Completed = 'Completed',
  Archived = 'Archived'
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: UserRole;
  user: User;
  addedAt: string;
}

// Drawing Types
export interface Drawing {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  reactFlowData: ReactFlowData;
  status: DrawingStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  currentWorkflow?: Workflow;
  components: Component[];
}

export enum DrawingStatus {
  Draft = 'Draft',
  InReview = 'InReview',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Archived = 'Archived'
}

export interface ReactFlowData {
  nodes: any[];
  edges: any[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

// Component Types
export interface Component {
  id: string;
  drawingId: string;
  name: string;
  type: ComponentType;
  symbolId: string;
  properties: ComponentProperty[];
  position: {
    x: number;
    y: number;
  };
  reactFlowNodeId: string;
  boqItem?: BoQItem;
}

export enum ComponentType {
  Pump = 'Pump',
  Valve = 'Valve',
  Tank = 'Tank',
  Pipe = 'Pipe',
  Instrument = 'Instrument',
  Fitting = 'Fitting',
  Equipment = 'Equipment'
}

export interface ComponentProperty {
  id: string;
  name: string;
  value: string;
  dataType: PropertyDataType;
  unit?: string;
  isRequired: boolean;
}

export enum PropertyDataType {
  Text = 'Text',
  Number = 'Number',
  Boolean = 'Boolean',
  Date = 'Date',
  Selection = 'Selection'
}

// BoQ Types
export interface BoQItem {
  id: string;
  componentId: string;
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  supplier?: string;
  specifications: Record<string, any>;
  category: string;
}

// Symbol Types
export interface Symbol {
  id: string;
  name: string;
  standard: SymbolStandard;
  category: ComponentType;
  svgPath: string;
  defaultProperties: ComponentProperty[];
  isActive: boolean;
}

export enum SymbolStandard {
  ISA = 'ISA',
  ISO = 'ISO',
  UKWater = 'UKWater'
}

// Workflow Types
export interface Workflow {
  id: string;
  drawingId: string;
  type: WorkflowType;
  status: WorkflowStatus;
  currentStage: WorkflowStage;
  stages: WorkflowStage[];
  comments: WorkflowComment[];
  createdAt: string;
  completedAt?: string;
}

export enum WorkflowType {
  Approval = 'Approval',
  Review = 'Review'
}

export enum WorkflowStatus {
  InProgress = 'InProgress',
  Completed = 'Completed',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled'
}

export interface WorkflowStage {
  id: string;
  name: string;
  order: number;
  assignedTo: string;
  status: StageStatus;
  completedAt?: string;
  comments?: string;
}

export enum StageStatus {
  Pending = 'Pending',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Rejected = 'Rejected',
  Skipped = 'Skipped'
}

export interface WorkflowComment {
  id: string;
  workflowId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: User;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  autoClose?: boolean;
  duration?: number;
}

// Form Types
export interface FormFieldError {
  message: string;
  type: string;
}

export interface FormState<T> {
  data: T;
  errors: Record<keyof T, FormFieldError | undefined>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
}

// Real-time Types
export interface SignalRConnection {
  connectionId: string;
  isConnected: boolean;
  groups: string[];
}

export interface DrawingCollaborationEvent {
  type: 'cursor-move' | 'component-select' | 'component-edit' | 'user-join' | 'user-leave';
  userId: string;
  drawingId: string;
  data: any;
  timestamp: string;
}

// Theme Types
export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}