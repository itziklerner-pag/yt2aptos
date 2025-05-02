import { FileItem } from '@/types';
import {
  UploadOperation,
  DownloadOperation,
  MoveOperation,
  CopyOperation,
  DeleteOperation,
  RenameOperation,
  CreateFolderOperation,
  CreateFileOperation,
  FileOperation,
  UploadOptions,
  DownloadOptions,
  FileOperationOptions,
  BatchOperationOptions,
  FileTemplate,
  ClipboardState
} from '@/types/file-operations.types';

/**
 * Interface for file operations service
 * Defines methods for all file system operations
 */
export interface IFileOperationsService {
  // Operations management
  getOperations(): FileOperation[];
  getOperation(id: string): FileOperation | undefined;
  cancelOperation(operationId: string): Promise<boolean>;
  
  // Templates
  getFileTemplates(): FileTemplate[];
  
  // Upload operations
  uploadFiles(files: File[], targetPath: string, options?: UploadOptions): Promise<UploadOperation[]>;
  uploadFile(file: File, targetPath: string, options?: UploadOptions): Promise<UploadOperation>;
  pauseUpload(operationId: string): Promise<boolean>;
  resumeUpload(operationId: string): Promise<UploadOperation>;
  cancelUpload(operationId: string): Promise<boolean>;
  
  // Download operations
  downloadFiles(files: FileItem[], options?: DownloadOptions): Promise<DownloadOperation[]>;
  downloadFile(file: FileItem, options?: DownloadOptions): Promise<DownloadOperation>;
  pauseDownload(operationId: string): Promise<boolean>;
  resumeDownload(operationId: string): Promise<DownloadOperation>;
  cancelDownload(operationId: string): Promise<boolean>;
  
  // Create operations
  createFolder(parentPath: string, folderName: string, options?: FileOperationOptions): Promise<CreateFolderOperation>;
  createFile(parentPath: string, fileName: string, templateId?: string, options?: FileOperationOptions): Promise<CreateFileOperation>;
  
  // Modify operations
  rename(item: FileItem, newName: string, options?: FileOperationOptions): Promise<RenameOperation>;
  move(items: FileItem[], destination: string, options?: BatchOperationOptions): Promise<MoveOperation>;
  copy(items: FileItem[], destination: string, options?: BatchOperationOptions): Promise<CopyOperation>;
  delete(items: FileItem[], toTrash?: boolean, options?: BatchOperationOptions): Promise<DeleteOperation>;
  
  // Trash operations
  restoreFromTrash(items: FileItem[], options?: BatchOperationOptions): Promise<MoveOperation>;
  emptyTrash(options?: FileOperationOptions): Promise<DeleteOperation>;
  
  // Clipboard operations
  cutToClipboard(items: FileItem[], sourceDirectory: string): void;
  copyToClipboard(items: FileItem[], sourceDirectory: string): void;
  pasteFromClipboard(destination: string, options?: BatchOperationOptions): Promise<MoveOperation | CopyOperation | null>;
  getClipboardState(): ClipboardState;
  clearClipboard(): void;
  
  // Undo/Redo
  undo(): Promise<boolean>;
  redo(): Promise<boolean>;
  canUndo(): boolean;
  canRedo(): boolean;
  
  // File operations
  listFiles(path: string): Promise<FileItem[]>;
  getFileDetails(path: string): Promise<FileItem | null>;
}