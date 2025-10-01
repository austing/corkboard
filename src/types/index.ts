// =============================================================================
// Core Database Types (derived from Drizzle schema)
// =============================================================================

export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  password: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  createdAt: Date;
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedAt: Date;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
  assignedAt: Date;
}

export interface Scrap {
  id: string;
  code: string;
  content: string;
  x: number;
  y: number;
  visible: boolean;
  userId: string;
  nestedWithin?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Extended Types with Relations
// =============================================================================

export interface ScrapWithUser extends Scrap {
  userName: string;
  userEmail: string;
}

export interface UserWithRoles extends User {
  roles: Role[];
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

// =============================================================================
// Form Types
// =============================================================================

export interface ScrapFormData {
  content: string;
  x: number;
  y: number;
  visible?: boolean;
  nestedWithin?: string | null;
}

export interface ScrapCreateData {
  content: string;
  x: number;
  y: number;
  nestedWithin?: string | null;
}

export interface ScrapUpdateData {
  content?: string;
  x?: number;
  y?: number;
  visible?: boolean;
  nestedWithin?: string | null;
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
}

export interface RoleFormData {
  name: string;
  description?: string;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ScrapsResponse extends ApiResponse {
  scraps: ScrapWithUser[];
}

export interface PermissionCheckResponse extends ApiResponse {
  hasPermission: boolean;
}

export interface VisibilityUpdateResponse extends ApiResponse {
  visible: boolean;
}

// =============================================================================
// Component Props Types
// =============================================================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

// =============================================================================
// Hook Types
// =============================================================================

export interface UseModalOptions {
  onClose?: () => void;
  preventBodyScroll?: boolean;
  updateUrlHash?: string | null;
  escapeToClose?: boolean;
}

export interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  resetOnSuccess?: boolean;
}

export interface ShortcutConfig {
  key: string;
  handler: () => void;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  preventDefault?: boolean;
  enabled?: boolean;
}

// =============================================================================
// Canvas and Position Types
// =============================================================================

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface CanvasConfig {
  scrapWidth: number;
  scrapHeight: number;
  padding: number;
}

// =============================================================================
// Permission and Auth Types
// =============================================================================

export type PermissionResource = 
  | 'scrap' 
  | 'admin' 
  | 'user' 
  | 'role' 
  | 'permission'
  | 'system';

export type PermissionAction = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'access'
  | 'view_all'
  | 'update_self';

export interface PermissionCheck {
  userId: string;
  resource: PermissionResource;
  action: PermissionAction;
}

// =============================================================================
// Error Types
// =============================================================================

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

export interface ValidationError extends AppError {
  field?: string;
  validationErrors?: Record<string, string[]>;
}

export interface ApiError extends AppError {
  endpoint?: string;
  method?: string;
  requestData?: unknown;
}

// =============================================================================
// Event Types
// =============================================================================

export interface ScrapMoveEvent {
  scrapId: string;
  oldPosition: Position;
  newPosition: Position;
}

export interface ScrapSelectEvent {
  scrap: ScrapWithUser;
  action: 'view' | 'edit' | 'move';
}

// =============================================================================
// Configuration Types
// =============================================================================

export interface ThemeConfig {
  primary: {
    bg: string;
    hover: string;
    text: string;
  };
  moving: {
    bg: string;
    text: string;
    border: string;
  };
  invisible: {
    bg: string;
    text: string;
  };
}

export interface AppConfig {
  theme: ThemeConfig;
  canvas: CanvasConfig;
  features: {
    enableMove: boolean;
    enableHashNavigation: boolean;
    maxScrapLength: number;
  };
}

// =============================================================================
// Utility Types
// =============================================================================

export type NonNullable<T> = T extends null | undefined ? never : T;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];