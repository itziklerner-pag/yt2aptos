import { FileItem } from '@/types';

// Operation types
export type OperationType = 
  | 'upload'
  | 'download'
  | 'move'
  | 'copy'
  | 'delete'
  | 'rename'
  | 'create-folder'
  | 'create-file';

// Operation statuses
export type OperationStatus = 
  | 'pending' 
  | 'in-progress' 
  | 'completed' 
  | 'cancelled' 
  | 'error';

// Base operation type
export interface FileOperation {
  id: string;
  type: OperationType;
  status: OperationStatus;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}

// Upload operation
export interface UploadOperation extends FileOperation {
  type: 'upload';
  file: File;
  targetPath: string;
  size: number;
  uploadedBytes: number;
  chunksUploaded?: number;
  totalChunks?: number;
  resumeToken?: string;
}

// Download operation
export interface DownloadOperation extends FileOperation {
  type: 'download';
  fileItem: FileItem;
  downloadedBytes: number;
  totalBytes: number;
  resumePosition?: number;
}

// Move operation
export interface MoveOperation extends FileOperation {
  type: 'move';
  sources: FileItem[];
  destination: string;
  itemsProcessed: number;
}

// Copy operation
export interface CopyOperation extends FileOperation {
  type: 'copy';
  sources: FileItem[];
  destination: string;
  itemsProcessed: number;
}

// Delete operation
export interface DeleteOperation extends FileOperation {
  type: 'delete';
  items: FileItem[];
  itemsProcessed: number;
  toTrash: boolean;
}

// Rename operation
export interface RenameOperation extends FileOperation {
  type: 'rename';
  item: FileItem;
  newName: string;
}

// Create folder operation
export interface CreateFolderOperation extends FileOperation {
  type: 'create-folder';
  parentPath: string;
  folderName: string;
}

// Create file operation
export interface CreateFileOperation extends FileOperation {
  type: 'create-file';
  parentPath: string;
  fileName: string;
  templateId?: string;
}

// File template
export interface FileTemplate {
  id: string;
  name: string;
  icon: string;
  extension: string;
  defaultContent: string;
}

// Clipboard state
export interface ClipboardState {
  operationType: 'cut' | 'copy' | null;
  items: FileItem[];
  sourceDirectory: string;
}

// Event types
export interface ProgressEvent {
  operationId: string;
  progress: number;
  bytesProcessed?: number;
  totalBytes?: number;
  itemsProcessed?: number;
  totalItems?: number;
  estimatedTimeRemaining?: number;
}

export interface CompletionEvent {
  operationId: string;
  result: any;
}

export interface ErrorEvent {
  operationId: string;
  error: string;
  code?: string;
  recoverable: boolean;
}

// Options types
export interface FileOperationOptions {
  onProgress?: (event: ProgressEvent) => void;
  onComplete?: (event: CompletionEvent) => void;
  onError?: (event: ErrorEvent) => void;
}

export interface UploadOptions extends FileOperationOptions {
  replaceExisting?: boolean;
  allowResume?: boolean;
  chunkSize?: number;
}

export interface DownloadOptions extends FileOperationOptions {
  saveAs?: string;
  allowResume?: boolean;
  chunkSize?: number;
}

export interface BatchOperationOptions extends FileOperationOptions {
  parallel?: boolean;
  maxConcurrent?: number;
  overwrite?: boolean;
}