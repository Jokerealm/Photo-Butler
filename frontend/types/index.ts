// Core data types and interfaces for the e-commerce redesign

// Re-export prompt template types
export * from './promptTemplate'
export * from './promptTemplateErrors'

// Template interface - represents an AI art style template
export interface Template {
  id: string;
  name: string;
  previewUrl: string;
  prompt: string;
  category?: string;
  // Optional fields for future expansion
  description?: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Generation task status enum
export enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Generation task interface - represents an AI image generation request
export interface GenerationTask {
  id: string;
  userId: string;
  templateId: string;
  template: Template;
  originalImageUrl: string;
  generatedImageUrl?: string;
  status: TaskStatus;
  progress: number;
  errorMessage?: string;
  estimatedCompletionTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Task filter interface for filtering tasks in workspace gallery
export interface TaskFilter {
  status?: TaskStatus[];
  templateId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Task sort options enum
export enum TaskSortOption {
  CREATED_DESC = 'created_desc',
  CREATED_ASC = 'created_asc',
  STATUS = 'status',
  TEMPLATE = 'template'
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface TemplateListResponse {
  templates: Template[];
}

export interface TemplateSearchResponse {
  templates: Template[];
  total: number;
  query: string;
}

export interface TaskListResponse {
  tasks: GenerationTask[];
  total: number;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'task_update' | 'task_complete' | 'task_failed' | 'ping' | 'pong';
  data?: GenerationTask | any;
}

// Component prop interfaces
export interface TemplateCardProps {
  template: Template;
  onClick: (template: Template) => void;
  className?: string;
}

export interface TemplateModalProps {
  template: Template;
  isOpen: boolean;
  onClose: () => void;
  onTaskSubmit: (task: GenerationTask) => void;
}

export interface WorkspaceGalleryProps {
  userId?: string;
}

export interface TaskCardProps {
  task: GenerationTask;
  onDownload?: (task: GenerationTask) => void;
  onRetry?: (task: GenerationTask) => void;
  onDelete?: (task: GenerationTask) => void;
  onRefresh?: (task: GenerationTask) => void;
}

// State interfaces for components
export interface TemplateMarketplaceState {
  templates: Template[];
  filteredTemplates: Template[];
  searchQuery: string;
  loading: boolean;
  error: string | null;
  selectedTemplate: Template | null;
  showModal: boolean;
}

export interface TemplateCardState {
  imageLoaded: boolean;
  imageError: boolean;
}

export interface TemplateModalState {
  uploadedFile: File | null;
  previewUrl: string | null;
  isSubmitting: boolean;
  submitError: string | null;
}

export interface WorkspaceGalleryState {
  tasks: GenerationTask[];
  loading: boolean;
  error: string | null;
  filter: TaskFilter;
  sortBy: TaskSortOption;
}