
export enum TaskStatus {
  ToDo = 'To Do',
  InProgress = 'In Progress',
  Done = 'Done',
}

export const TaskStatusColors: Record<TaskStatus, string> = {
  [TaskStatus.ToDo]: 'bg-sky-300', // Lighter blue for ToDo
  [TaskStatus.InProgress]: 'bg-sky-500', // Sky blue for InProgress
  [TaskStatus.Done]: 'bg-emerald-500', // Green for Done
};

export interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string; // Base64 encoded file content
  uploadedAt: string; // ISO string
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  status: TaskStatus;
  startDate?: string; // Store as YYYY-MM-DD
  dueDate?: string; // Store as YYYY-MM-DD
  department?: string;
  assignedTo?: string; // New field for task assignment
  subTasks?: Task[];
  parentId?: string | null;
  level?: number; // For indentation in UI, 0 for top-level tasks
  files?: FileData[]; // Array to store uploaded files
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  createdAt: string; // ISO string
}

export type ModalType = 
  | 'addProject' 
  | 'editProject' 
  | 'manageTasks' 
  | 'addTask' 
  | 'editTask'
  | 'adminLogin'
  | 'confirmation'
  | 'createAdminAfterReset' // New modal type for creating admin after reset
  | null;

export interface ModalData {
  project?: Project;
  projectId?: string;
  task?: Task;
  taskId?: string;
  parentTaskId?: string | null; // For adding sub-tasks
  currentLevel?: number; // For setting level of new sub-task
  confirmationTitle?: string;
  confirmationMessage?: string;
  onConfirmAction?: (...args: any[]) => void; // Allow onConfirmAction to accept arguments
  confirmButtonText?: string; // For customizing the confirm button text
  importedData?: ExportDataFormat; // To pass imported data to confirm action
}

export interface ModalState {
  type: ModalType;
  data?: ModalData;
}

// For demo purposes, admin user structure
export interface AdminUser {
  username: string;
  passwordHash: string; // In a real app, this would be a securely hashed password
}

// For data export/import
export interface ExportDataFormat {
  version: string;
  exportedAt: string;
  adminLoggedIn: boolean;
  projects: Project[];
}