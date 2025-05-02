import { v4 as uuidv4 } from 'uuid';
import { FileItem, FileType } from '@/types';
import { 
  IFileOperationsService 
} from './file-operations.interface';
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
  ClipboardState,
  ProgressEvent,
  CompletionEvent,
  ErrorEvent,
  OperationStatus
} from '@/types/file-operations.types';

// Mock file templates for creating new files
const DEFAULT_FILE_TEMPLATES: FileTemplate[] = [
  {
    id: 'txt',
    name: 'Text Document',
    icon: 'document',
    extension: 'txt',
    defaultContent: ''
  },
  {
    id: 'md',
    name: 'Markdown',
    icon: 'document',
    extension: 'md',
    defaultContent: '# New Document\n\n'
  },
  {
    id: 'js',
    name: 'JavaScript',
    icon: 'code',
    extension: 'js',
    defaultContent: 'console.log("Hello, world!");\n'
  },
  {
    id: 'html',
    name: 'HTML',
    icon: 'code',
    extension: 'html',
    defaultContent: '<!DOCTYPE html>\n<html>\n<head>\n  <title>New Document</title>\n</head>\n<body>\n  <h1>Hello, world!</h1>\n</body>\n</html>\n'
  }
];

// Mock filesystem data - will be built as operations are performed
const mockFileSystem = new Map<string, FileItem[]>();

/**
 * Get file type from file extension
 */
const getFileTypeFromExtension = (filename: string): FileType => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  if (!extension) return 'unknown';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
    return 'image';
  } else if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(extension)) {
    return 'video';
  } else if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(extension)) {
    return 'audio';
  } else if (['pdf'].includes(extension)) {
    return 'pdf';
  } else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'rtf'].includes(extension)) {
    return 'document';
  } else if (['zip', 'rar', 'tar', 'gz', '7z'].includes(extension)) {
    return 'archive';
  } else if (['js', 'ts', 'html', 'css', 'jsx', 'tsx', 'json', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'php', 'rb'].includes(extension)) {
    return 'code';
  }
  
  return 'unknown';
};

/**
 * Mock implementation of file operations service
 * Used for development and testing
 */
export class MockFileOperationsService implements IFileOperationsService {
  private operations: Map<string, FileOperation> = new Map();
  private undoStack: Array<{ action: string, data: any }> = [];
  private redoStack: Array<{ action: string, data: any }> = [];
  private clipboard: ClipboardState = { operationType: null, items: [], sourceDirectory: '' };
  private fileTemplates: FileTemplate[] = [...DEFAULT_FILE_TEMPLATES];
  private simulateNetworkDelay = true;
  private simulateErrors = false;
  private errorRate = 0.05; // 5% chance of error for testing error handling
  
  constructor() {
    // Initialize with some mock data
    this.initializeMockData();
  }
/**
   * Create mock filesystem data
   */
  private initializeMockData() {
    // Root directory
    mockFileSystem.set('/', [
      {
        id: uuidv4(),
        name: 'Documents',
        type: 'folder',
        size: 0,
        created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        modified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        path: '/Documents',
        owner: 'current_user'
      },
      {
        id: uuidv4(),
        name: 'Pictures',
        type: 'folder',
        size: 0,
        created: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        modified: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        path: '/Pictures',
        owner: 'current_user'
      },
      {
        id: uuidv4(),
        name: 'Videos',
        type: 'folder',
        size: 0,
        created: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        modified: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        path: '/Videos',
        owner: 'current_user'
      },
      {
        id: uuidv4(),
        name: 'welcome.md',
        type: 'document',
        size: 2048,
        created: new Date(),
        modified: new Date(),
        path: '/welcome.md',
        owner: 'system',
        starred: true
      }
    ]);
    
    // Documents folder
    mockFileSystem.set('/Documents', [
      {
        id: uuidv4(),
        name: 'Project Proposal.pdf',
        type: 'pdf',
        size: 1024 * 1024 * 2.5, // 2.5 MB
        created: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        modified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        path: '/Documents/Project Proposal.pdf',
        owner: 'current_user'
      },
      {
        id: uuidv4(),
        name: 'Meeting Notes.txt',
        type: 'document',
        size: 1024 * 15, // 15 KB
        created: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        modified: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        path: '/Documents/Meeting Notes.txt',
        owner: 'current_user'
      },
      {
        id: uuidv4(),
        name: 'Shared',
        type: 'folder',
        size: 0,
        created: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        modified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        path: '/Documents/Shared',
        owner: 'current_user',
        shared: true
      }
    ]);
    
    // Pictures folder
    mockFileSystem.set('/Pictures', [
      {
        id: uuidv4(),
        name: 'Vacation.jpg',
        type: 'image',
        size: 1024 * 1024 * 5, // 5 MB
        created: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
        modified: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
        path: '/Pictures/Vacation.jpg',
        owner: 'current_user',
        thumbnail: 'https://via.placeholder.com/150'
      },
      {
        id: uuidv4(),
        name: 'Profile.png',
        type: 'image',
        size: 1024 * 512, // 512 KB
        created: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        modified: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        path: '/Pictures/Profile.png',
        owner: 'current_user',
        thumbnail: 'https://via.placeholder.com/150'
      }
    ]);
    
    // Shared folder
    mockFileSystem.set('/Documents/Shared', [
      {
        id: uuidv4(),
        name: 'Team Project.docx',
        type: 'document',
        size: 1024 * 1024 * 1.2, // 1.2 MB
        created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        modified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        path: '/Documents/Shared/Team Project.docx',
        owner: 'other_user',
        shared: true
      }
    ]);
    
    // Create Trash folder
    mockFileSystem.set('/Trash', []);
  }
  
  /**
   * Simulates network delay for async operations
   */
  private async delay(ms: number = 1000): Promise<void> {
    if (!this.simulateNetworkDelay) return;
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Randomly decides if an operation should fail (for testing error handling)
   */
  private shouldFail(): boolean {
    return this.simulateErrors && Math.random() < this.errorRate;
  }
  
  /**
   * Creates a unique ID for operations
   */
  private createOperationId(): string {
    return uuidv4();
  }
  
  /**
   * Updates an operation with progress and triggers callbacks
   */
  private updateOperationProgress(
    operationId: string, 
    progress: number, 
    options?: { 
      bytesProcessed?: number, 
      totalBytes?: number,
      itemsProcessed?: number,
      totalItems?: number,
      estimatedTimeRemaining?: number
    }
  ): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;
    
    operation.progress = progress;
    operation.updatedAt = new Date();
    
    if (operation.status === 'pending') {
      operation.status = 'in-progress';
    }
    
    // Create progress event
    const progressEvent: ProgressEvent = {
      operationId,
      progress,
      ...options
    };
    
    // Call appropriate callback
    switch (operation.type) {
      case 'upload':
        if ((operation as UploadOperation).uploadedBytes !== undefined && options?.bytesProcessed !== undefined) {
          (operation as UploadOperation).uploadedBytes = options.bytesProcessed;
        }
        (options as UploadOptions)?.onProgress?.(progressEvent);
        break;
      case 'download':
        if ((operation as DownloadOperation).downloadedBytes !== undefined && options?.bytesProcessed !== undefined) {
          (operation as DownloadOperation).downloadedBytes = options.bytesProcessed;
        }
        (options as DownloadOptions)?.onProgress?.(progressEvent);
        break;
      default:
        (options as FileOperationOptions)?.onProgress?.(progressEvent);
        break;
    }
  }
  
  /**
   * Completes an operation and triggers callbacks
   */
  private completeOperation(
    operationId: string, 
    result: any, 
    options?: UploadOptions | DownloadOptions | FileOperationOptions
  ): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;
    
    operation.status = 'completed';
    operation.progress = 100;
    operation.updatedAt = new Date();
    
    // Create completion event
    const completionEvent: CompletionEvent = {
      operationId,
      result
    };
    
    // Call appropriate callback
    if ('onComplete' in options && options.onComplete) {
      options.onComplete(completionEvent);
    }
  }
  
  /**
   * Fails an operation and triggers error callbacks
   */
  private failOperation(
    operationId: string, 
    error: string, 
    options?: UploadOptions | DownloadOptions | FileOperationOptions,
    code?: string,
    recoverable: boolean = false
  ): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;
    
    operation.status = 'error';
    operation.error = error;
    operation.updatedAt = new Date();
    
    // Create error event
    const errorEvent: ErrorEvent = {
      operationId,
      error,
      code,
      recoverable
    };
    
    // Call appropriate callback
    if ('onError' in options && options.onError) {
      options.onError(errorEvent);
    }
  }
  
  /**
   * Creates a file path from parent path and name
   */
  private createPath(parentPath: string, name: string): string {
    return parentPath === '/' 
      ? `/${name}` 
      : `${parentPath}/${name}`;
  }
  
  /**
   * Gets the parent path from a full path
   */
  private getParentPath(path: string): string {
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return '/';
    parts.pop();
    return parts.length === 0 ? '/' : `/${parts.join('/')}`;
  }
  
  /**
   * Gets filename from path
   */
  private getFilenameFromPath(path: string): string {
    return path.split('/').filter(Boolean).pop() || '';
  }
  
  /**
   * Checks if a file exists at a path
   */
  private fileExists(path: string): boolean {
    const parentPath = this.getParentPath(path);
    const name = this.getFilenameFromPath(path);
    const parentDir = mockFileSystem.get(parentPath) || [];
    
    return parentDir.some(item => item.name === name);
  }
  
  /**
   * Add an entry to undo stack
   */
// IFileOperationsService implementation
  
  getOperations(): FileOperation[] {
    return Array.from(this.operations.values());
  }
  
  getOperation(id: string): FileOperation | undefined {
    return this.operations.get(id);
  }
  
  getFileTemplates(): FileTemplate[] {
    return this.fileTemplates;
  }
  
  async uploadFiles(
    files: File[],
    targetPath: string,
    options?: UploadOptions
  ): Promise<UploadOperation[]> {
    const operations: UploadOperation[] = [];
    
    for (const file of files) {
      try {
        const operation = await this.uploadFile(file, targetPath, options);
        operations.push(operation);
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
    
    return operations;
  }
  
  async uploadFile(
    file: File,
    targetPath: string,
    options?: UploadOptions
  ): Promise<UploadOperation> {
    const operationId = this.createOperationId();
    
    // Create the upload operation
    const operation: UploadOperation = {
      id: operationId,
      type: 'upload',
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      file,
      targetPath,
      size: file.size,
      uploadedBytes: 0,
      // Simulate chunking for large files
      chunksUploaded: 0,
      totalChunks: file.size > 1024 * 1024 ? Math.ceil(file.size / (1024 * 1024)) : 1,
      resumeToken: options?.allowResume ? uuidv4() : undefined
    };
    
    // Store the operation
    this.operations.set(operationId, operation);
    
    // Run the upload in the background
    this.processUpload(operationId, options);
    
    return operation;
  }
  
  private async processUpload(
    operationId: string,
    options?: UploadOptions
  ): Promise<void> {
    const operation = this.operations.get(operationId) as UploadOperation;
    if (!operation) return;
    
    const { file, targetPath, totalChunks = 1 } = operation;
    const filePath = this.createPath(targetPath, file.name);
    
    // Check if path exists
    if (!mockFileSystem.has(targetPath)) {
      this.failOperation(
        operationId,
        `Target directory not found: ${targetPath}`,
        options,
        'DIR_NOT_FOUND',
        false
      );
      return;
    }
    
    // Check if file already exists
    const existingFile = this.fileExists(filePath);
    if (existingFile && !(options?.replaceExisting)) {
      this.failOperation(
        operationId,
        `File already exists: ${filePath}`,
        options,
        'FILE_EXISTS',
        true
      );
      return;
    }
    
    // Simulate uploading chunks
    for (let chunk = 0; chunk < totalChunks; chunk++) {
      // Check if upload was cancelled
      const currentOp = this.operations.get(operationId) as UploadOperation;
      if (!currentOp || currentOp.status === 'cancelled') {
        return;
      }
      
      // Simulate network delay
      await this.delay(500);
      
      // Simulate failure
      if (this.shouldFail()) {
        this.failOperation(
          operationId,
          'Network error during upload',
          options,
          'NETWORK_ERROR',
          true
        );
        return;
      }
      
      // Calculate progress
      const progress = Math.round(((chunk + 1) / totalChunks) * 100);
      const bytesProcessed = Math.min(
        file.size,
        Math.round(((chunk + 1) / totalChunks) * file.size)
      );
      
      // Update operation
      operation.chunksUploaded = chunk + 1;
      operation.uploadedBytes = bytesProcessed;
      
      // Report progress
      this.updateOperationProgress(operationId, progress, {
        bytesProcessed,
        totalBytes: file.size,
        estimatedTimeRemaining: (totalChunks - chunk - 1) * 500 // Estimate based on chunk delay
      });
    }
    
    // Create the file item
    const fileItem: FileItem = {
      id: uuidv4(),
      name: file.name,
      type: getFileTypeFromExtension(file.name),
      size: file.size,
      created: new Date(),
      modified: new Date(),
      path: filePath,
      owner: 'current_user'
    };
    
    // Add to mock filesystem
    const parentDirItems = mockFileSystem.get(targetPath) || [];
    
    // If file exists and replace is enabled, remove old file
    if (existingFile && options?.replaceExisting) {
      const index = parentDirItems.findIndex(item => item.name === file.name);
      if (index !== -1) {
        parentDirItems.splice(index, 1);
      }
    }
    
    parentDirItems.push(fileItem);
    mockFileSystem.set(targetPath, parentDirItems);
    
    // Add to undo stack
    this.addToUndoStack('upload', { 
      filePath, 
      parentPath: targetPath
    });
    
    // Complete the operation
    this.completeOperation(operationId, fileItem, options);
  }
  
  async pauseUpload(operationId: string): Promise<boolean> {
    const operation = this.operations.get(operationId) as UploadOperation;
    if (!operation || operation.type !== 'upload') return false;
    
    // Only in-progress uploads can be paused
    if (operation.status !== 'in-progress') return false;
    
    operation.status = 'pending';
    operation.updatedAt = new Date();
    
    return true;
  }
  
  async resumeUpload(operationId: string): Promise<UploadOperation> {
    const operation = this.operations.get(operationId) as UploadOperation;
    if (!operation || operation.type !== 'upload') {
      throw new Error('Invalid operation ID or type');
    }
    
    // Only pending uploads can be resumed
    if (operation.status !== 'pending') {
      throw new Error('Operation cannot be resumed');
    }
    
    operation.status = 'in-progress';
    operation.updatedAt = new Date();
    
    // Continue the upload process from where it left off
    this.processUpload(operationId);
    
    return operation;
  }
  
  async cancelUpload(operationId: string): Promise<boolean> {
    const operation = this.operations.get(operationId) as UploadOperation;
    if (!operation || operation.type !== 'upload') return false;
    
    // Cannot cancel completed operations
    if (operation.status === 'completed') return false;
    
    operation.status = 'cancelled';
    operation.updatedAt = new Date();
    
    return true;
  }
  private addToUndoStack(action: string, data: any): void {
    this.undoStack.push({ action, data });
    // Clear redo stack when a new action is performed
    this.redoStack = [];
  }
  
  async downloadFiles(
    files: FileItem[],
    options?: DownloadOptions
  ): Promise<DownloadOperation[]> {
    const operations: DownloadOperation[] = [];
    
    for (const file of files) {
      try {
        const operation = await this.downloadFile(file, options);
        operations.push(operation);
      } catch (error) {
        console.error('Download error:', error);
      }
    }
    
    return operations;
  }
  
  async downloadFile(
    file: FileItem,
    options?: DownloadOptions
  ): Promise<DownloadOperation> {
    const operationId = this.createOperationId();
    
    // Create the download operation
    const operation: DownloadOperation = {
      id: operationId,
      type: 'download',
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      fileItem: file,
      downloadedBytes: 0,
      totalBytes: file.size,
      resumePosition: options?.allowResume ? 0 : undefined
    };
    
    // Store the operation
    this.operations.set(operationId, operation);
    
    // Run the download in the background
    this.processDownload(operationId, options);
    
    return operation;
  }
  
  private async processDownload(
    operationId: string,
    options?: DownloadOptions
  ): Promise<void> {
    const operation = this.operations.get(operationId) as DownloadOperation;
    if (!operation) return;
    
    const { fileItem } = operation;
    
    // Simulate chunked download for larger files
    const chunkSize = options?.chunkSize || 1024 * 1024; // Default 1MB chunks
    const totalChunks = Math.ceil(fileItem.size / chunkSize);
    
    // Start from resumePosition if set
    const startChunk = operation.resumePosition 
      ? Math.floor(operation.resumePosition / chunkSize)
      : 0;
    
    for (let chunk = startChunk; chunk < totalChunks; chunk++) {
      // Check if download was cancelled
      const currentOp = this.operations.get(operationId) as DownloadOperation;
      if (!currentOp || currentOp.status === 'cancelled') {
        return;
      }
      
      // Simulate network delay
      await this.delay(300);
      
      // Simulate failure
      if (this.shouldFail()) {
        this.failOperation(
          operationId,
          'Network error during download',
          options,
          'NETWORK_ERROR',
          true
        );
        return;
      }
      
      // Calculate progress
      const progress = Math.round(((chunk + 1) / totalChunks) * 100);
      const bytesProcessed = Math.min(
        fileItem.size,
        (chunk + 1) * chunkSize
      );
      
      // Update operation
      operation.downloadedBytes = bytesProcessed;
      operation.resumePosition = bytesProcessed;
      
      // Report progress
      this.updateOperationProgress(operationId, progress, {
        bytesProcessed,
        totalBytes: fileItem.size,
        estimatedTimeRemaining: (totalChunks - chunk - 1) * 300 // Estimate based on chunk delay
      });
    }
    
    // In a real implementation, this would trigger the browser's download
    // For the mock, we just simulate the completion
    
    // Complete the operation
    this.completeOperation(operationId, {
      fileName: options?.saveAs || fileItem.name,
      filePath: fileItem.path,
      size: fileItem.size
    }, options);
  }
  
  async pauseDownload(operationId: string): Promise<boolean> {
    const operation = this.operations.get(operationId) as DownloadOperation;
    if (!operation || operation.type !== 'download') return false;
    
    // Only in-progress downloads can be paused
    if (operation.status !== 'in-progress') return false;
    
    operation.status = 'pending';
    operation.updatedAt = new Date();
    
    return true;
  }
  
  async resumeDownload(operationId: string): Promise<DownloadOperation> {
    const operation = this.operations.get(operationId) as DownloadOperation;
    if (!operation || operation.type !== 'download') {
      throw new Error('Invalid operation ID or type');
    }
    
    // Only pending downloads can be resumed
    if (operation.status !== 'pending') {
      throw new Error('Operation cannot be resumed');
    }
    
    operation.status = 'in-progress';
    operation.updatedAt = new Date();
    
    // Continue the download process from where it left off
    this.processDownload(operationId);
    
    return operation;
  }
  
  async cancelDownload(operationId: string): Promise<boolean> {
    const operation = this.operations.get(operationId) as DownloadOperation;
    if (!operation || operation.type !== 'download') return false;
    
    // Cannot cancel completed operations
    if (operation.status === 'completed') return false;
    
    operation.status = 'cancelled';
    operation.updatedAt = new Date();
    
    return true;
  }
  
  async createFolder(
    parentPath: string,
    folderName: string,
    options?: FileOperationOptions
  ): Promise<CreateFolderOperation> {
    const operationId = this.createOperationId();
    
    // Create the operation
    const operation: CreateFolderOperation = {
      id: operationId,
      type: 'create-folder',
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      parentPath,
      folderName
    };
    
    // Store the operation
    this.operations.set(operationId, operation);
    
    // Process the operation
    this.processCreateFolder(operationId, options);
    
    return operation;
  }
  
  private async processCreateFolder(
    operationId: string,
    options?: FileOperationOptions
  ): Promise<void> {
    const operation = this.operations.get(operationId) as CreateFolderOperation;
    if (!operation) return;
    
    const { parentPath, folderName } = operation;
    const folderPath = this.createPath(parentPath, folderName);
    
    // Check if parent path exists
    if (!mockFileSystem.has(parentPath)) {
      this.failOperation(
        operationId,
        `Parent directory not found: ${parentPath}`,
        options,
        'DIR_NOT_FOUND',
        false
      );
      return;
    }
    
    // Check if folder already exists
    if (mockFileSystem.has(folderPath)) {
      this.failOperation(
        operationId,
        `Folder already exists: ${folderPath}`,
        options,
        'FOLDER_EXISTS',
        false
      );
      return;
    }
    
    // Simulate delay
    await this.delay(300);
    
    // Update progress
    this.updateOperationProgress(operationId, 50);
    
    // Create the folder item
    const folderItem: FileItem = {
      id: uuidv4(),
      name: folderName,
      type: 'folder',
      size: 0,
      created: new Date(),
      modified: new Date(),
      path: folderPath,
      owner: 'current_user'
    };
    
    // Add to parent directory
    const parentDirItems = mockFileSystem.get(parentPath) || [];
    parentDirItems.push(folderItem);
    mockFileSystem.set(parentPath, parentDirItems);
    
    // Create the directory entry
    mockFileSystem.set(folderPath, []);
    
    // Update progress
    this.updateOperationProgress(operationId, 100);
    
    // Add to undo stack
    this.addToUndoStack('create-folder', { 
      folderPath,
      parentPath
    });
    
    // Complete the operation
    this.completeOperation(operationId, folderItem, options);
  }
  
  async createFile(
    parentPath: string,
    fileName: string,
    templateId?: string,
    options?: FileOperationOptions
  ): Promise<CreateFileOperation> {
    const operationId = this.createOperationId();
    
    // Create the operation
    const operation: CreateFileOperation = {
      id: operationId,
      type: 'create-file',
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      parentPath,
      fileName,
      templateId
    };
    
    // Store the operation
    this.operations.set(operationId, operation);
    
    // Process the operation
    this.processCreateFile(operationId, options);
    
    return operation;
  }
  
  private async processCreateFile(
    operationId: string,
    options?: FileOperationOptions
  ): Promise<void> {
    const operation = this.operations.get(operationId) as CreateFileOperation;
    if (!operation) return;
    
    const { parentPath, fileName, templateId } = operation;
    const filePath = this.createPath(parentPath, fileName);
    
    // Check if parent path exists
    if (!mockFileSystem.has(parentPath)) {
      this.failOperation(
        operationId,
        `Parent directory not found: ${parentPath}`,
        options,
        'DIR_NOT_FOUND',
        false
      );
      return;
    }
    
    // Check if file already exists
    if (this.fileExists(filePath)) {
      this.failOperation(
        operationId,
        `File already exists: ${filePath}`,
        options,
        'FILE_EXISTS',
        false
      );
      return;
    }
    
    // Find template if specified
    let fileSize = 0;
    if (templateId) {
      const template = this.fileTemplates.find(t => t.id === templateId);
      if (template && template.defaultContent) {
        fileSize = template.defaultContent.length;
      }
    }
    
    // Simulate delay
    await this.delay(200);
async rename(
    item: FileItem,
    newName: string,
    options?: FileOperationOptions
  ): Promise<RenameOperation> {
    const operationId = this.createOperationId();
    
    // Create the operation
    const operation: RenameOperation = {
      id: operationId,
      type: 'rename',
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      item,
      newName
    };
    
    // Store the operation
    this.operations.set(operationId, operation);
    
    // Process the operation
    this.processRename(operationId, options);
    
    return operation;
  }
  
  private async processRename(
    operationId: string,
    options?: FileOperationOptions
  ): Promise<void> {
    const operation = this.operations.get(operationId) as RenameOperation;
    if (!operation) return;
    
    const { item, newName } = operation;
    const parentPath = this.getParentPath(item.path);
    const newPath = this.createPath(parentPath, newName);
    
    // Check if parent path exists
    if (!mockFileSystem.has(parentPath)) {
      this.failOperation(
        operationId,
        `Parent directory not found: ${parentPath}`,
        options,
        'DIR_NOT_FOUND',
        false
      );
      return;
    }
    
    // Check if destination already exists
    if (this.fileExists(newPath)) {
      this.failOperation(
        operationId,
        `File already exists: ${newPath}`,
        options,
        'FILE_EXISTS',
        false
      );
      return;
    }
    
    // Simulate delay
    await this.delay(200);
    
    // Update progress
    this.updateOperationProgress(operationId, 50);
    
    // Find the item in the parent directory
    const parentDirItems = mockFileSystem.get(parentPath) || [];
    const itemIndex = parentDirItems.findIndex(i => i.id === item.id);
    
    if (itemIndex === -1) {
      this.failOperation(
        operationId,
        `Item not found: ${item.path}`,
        options,
        'ITEM_NOT_FOUND',
        false
      );
      return;
    }
    
    // Store old data for undo
    const oldData = {
      item: { ...parentDirItems[itemIndex] },
      path: item.path
    };
    
    // Update the item
    parentDirItems[itemIndex] = {
      ...parentDirItems[itemIndex],
      name: newName,
      path: newPath,
      modified: new Date()
    };
    
    // Update the directory
    mockFileSystem.set(parentPath, parentDirItems);
    
    // If it's a folder, update all children paths recursively
    if (item.type === 'folder') {
      this.updateChildrenPaths(item.path, newPath);
      
      // Update the folder entry in the map
      if (mockFileSystem.has(item.path)) {
        const folderContents = mockFileSystem.get(item.path) || [];
        mockFileSystem.delete(item.path);
        mockFileSystem.set(newPath, folderContents);
      }
    }
    
    // Update progress
    this.updateOperationProgress(operationId, 100);
    
    // Add to undo stack
    this.addToUndoStack('rename', oldData);
    
    // Complete the operation
    this.completeOperation(operationId, parentDirItems[itemIndex], options);
  }
  
  /**
   * Updates paths of all children when a folder is renamed
   */
  private updateChildrenPaths(oldBasePath: string, newBasePath: string): void {
    // Get all paths
    const allPaths = Array.from(mockFileSystem.keys());
    
    // Find paths that start with oldBasePath
    const affectedPaths = allPaths.filter(path => 
      path === oldBasePath || path.startsWith(`${oldBasePath}/`)
    );
    
    // Update each affected path
    for (const path of affectedPaths) {
      if (path === oldBasePath) continue; // Skip the folder itself
      
      const relativePath = path.substring(oldBasePath.length);
      const newPath = `${newBasePath}${relativePath}`;
      
      // Update the path in the map
      const items = mockFileSystem.get(path) || [];
      mockFileSystem.delete(path);
      mockFileSystem.set(newPath, items);
      
      // Update each item's path
      for (const item of items) {
        item.path = item.path.replace(path, newPath);
      }
    }
  }
  
  async move(
    items: FileItem[],
    destination: string,
    options?: BatchOperationOptions
  ): Promise<MoveOperation> {
    const operationId = this.createOperationId();
    
    // Create the operation
    const operation: MoveOperation = {
      id: operationId,
      type: 'move',
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      sources: items,
      destination,
      itemsProcessed: 0
    };
    
    // Store the operation
    this.operations.set(operationId, operation);
    
    // Process the operation
    this.processMoveOrCopy(operationId, true, options);
    
    return operation;
  }
  
  async copy(
    items: FileItem[],
    destination: string,
    options?: BatchOperationOptions
  ): Promise<CopyOperation> {
    const operationId = this.createOperationId();
    
    // Create the operation
    const operation: CopyOperation = {
      id: operationId,
      type: 'copy',
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      sources: items,
      destination,
      itemsProcessed: 0
    };
    
    // Store the operation
    this.operations.set(operationId, operation);
    
    // Process the operation
    this.processMoveOrCopy(operationId, false, options);
    
    return operation;
  }
  
  private async processMoveOrCopy(
    operationId: string,
    isMove: boolean,
    options?: BatchOperationOptions
  ): Promise<void> {
    const operation = this.operations.get(operationId) as MoveOperation | CopyOperation;
    if (!operation) return;
    
    const { sources, destination } = operation;
    
    // Check if destination exists
    if (!mockFileSystem.has(destination)) {
      this.failOperation(
        operationId,
        `Destination directory not found: ${destination}`,
        options,
        'DIR_NOT_FOUND',
        false
      );
      return;
    }
    
    // Store original items for undo
    const originalItems: Array<{ item: FileItem, sourcePath: string }> = [];
    
    // Process items serially or in parallel
    const parallel = options?.parallel ?? false;
    const maxConcurrent = options?.maxConcurrent ?? 3;
    
    if (parallel) {
      // Process in parallel with concurrency limit
      const chunks = [];
      for (let i = 0; i < sources.length; i += maxConcurrent) {
        chunks.push(sources.slice(i, i + maxConcurrent));
      }
      
      for (const chunk of chunks) {
        await Promise.all(chunk.map(async (item, index) => {
          await this.processSingleMoveOrCopy(
            operationId,
            item,
            destination,
            isMove,
            originalItems,
            options
          );
          
          // Update progress
          const totalProcessed = originalItems.length;
          const progress = Math.round((totalProcessed / sources.length) * 100);
          
          this.updateOperationProgress(operationId, progress, {
            itemsProcessed: totalProcessed,
            totalItems: sources.length
          });
        }));
      }
    } else {
      // Process serially
      for (let i = 0; i < sources.length; i++) {
        // Check if operation was cancelled
        const currentOp = this.operations.get(operationId);
        if (!currentOp || currentOp.status === 'cancelled') {
          return;
        }
        
        await this.processSingleMoveOrCopy(
          operationId,
          sources[i],
          destination,
          isMove,
          originalItems,
          options
        );
        
        // Update progress
        const progress = Math.round(((i + 1) / sources.length) * 100);
        operation.itemsProcessed = i + 1;
        
        this.updateOperationProgress(operationId, progress, {
          itemsProcessed: i + 1,
          totalItems: sources.length
        });
      }
    }
    
    // Add to undo stack
    this.addToUndoStack(isMove ? 'move' : 'copy', { 
      items: originalItems,
      destination
    });
    
    // Complete the operation
    this.completeOperation(operationId, {
      processed: operation.itemsProcessed,
      total: sources.length,
      destination
    }, options);
  }
  
  private async processSingleMoveOrCopy(
    operationId: string,
    item: FileItem,
    destination: string,
    isMove: boolean,
    originalItems: Array<{ item: FileItem, sourcePath: string }>,
    options?: BatchOperationOptions
  ): Promise<void> {
    // Get source and destination paths
    const sourcePath = this.getParentPath(item.path);
    const destPath = this.createPath(destination, item.name);
    
    // Skip if trying to move to the same directory
    if (isMove && sourcePath === destination) {
      return;
    }
    
    // Check for name conflicts
    if (this.fileExists(destPath) && !(options?.overwrite)) {
      // In real implementation, would handle conflict resolution
      // For now, just skip
async delete(
    items: FileItem[],
    toTrash: boolean = true,
    options?: BatchOperationOptions
  ): Promise<DeleteOperation> {
    const operationId = this.createOperationId();
    
    // Create the operation
    const operation: DeleteOperation = {
      id: operationId,
      type: 'delete',
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      items,
      itemsProcessed: 0,
      toTrash
    };
    
    // Store the operation
    this.operations.set(operationId, operation);
    
    // Process the operation
    this.processDelete(operationId, options);
    
    return operation;
  }
  
  private async processDelete(
    operationId: string,
    options?: BatchOperationOptions
  ): Promise<void> {
    const operation = this.operations.get(operationId) as DeleteOperation;
    if (!operation) return;
    
    const { items, toTrash } = operation;
    
    // Store deleted items for undo
    const deletedItems: Array<{ item: FileItem, parentPath: string }> = [];
    
    // Process items
    for (let i = 0; i < items.length; i++) {
      // Check if operation was cancelled
      const currentOp = this.operations.get(operationId);
      if (!currentOp || currentOp.status === 'cancelled') {
        return;
      }
      
      const item = items[i];
      const parentPath = this.getParentPath(item.path);
      
      // Simulate delay
      await this.delay(100);
      
      // Store for undo
      deletedItems.push({ item: { ...item }, parentPath });
      
      // If moving to trash
      if (toTrash) {
        // Get trash items
        const trashPath = '/Trash';
        const trashItems = mockFileSystem.get(trashPath) || [];
        
        // Check if item with same name exists in trash
        let trashItemName = item.name;
        let counter = 1;
        while (trashItems.some(i => i.name === trashItemName)) {
          const lastDotIndex = item.name.lastIndexOf('.');
          if (lastDotIndex > 0) {
            trashItemName = `${item.name.substring(0, lastDotIndex)} (${counter})${item.name.substring(lastDotIndex)}`;
          } else {
            trashItemName = `${item.name} (${counter})`;
          }
          counter++;
        }
        
        // Create trash item
        const trashItem: FileItem = {
          ...item,
          name: trashItemName,
          path: this.createPath(trashPath, trashItemName)
        };
        
        // Add to trash
        trashItems.push(trashItem);
        mockFileSystem.set(trashPath, trashItems);
        
        // If it's a folder, move contents to trash as well
        if (item.type === 'folder') {
          this.moveToTrash(item.path, trashItem.path);
        }
      }
      
      // Remove from parent directory
      const parentDirItems = mockFileSystem.get(parentPath) || [];
      const itemIndex = parentDirItems.findIndex(i => i.id === item.id);
      
      if (itemIndex !== -1) {
        parentDirItems.splice(itemIndex, 1);
        mockFileSystem.set(parentPath, parentDirItems);
      }
      
      // If it's a folder, remove the folder and all its contents
      if (item.type === 'folder' && !toTrash) {
        this.recursiveDeleteFolder(item.path);
      } else if (item.type === 'folder') {
        // If moving to trash, just remove the original folder
        mockFileSystem.delete(item.path);
      }
      
      // Update progress
      const progress = Math.round(((i + 1) / items.length) * 100);
      operation.itemsProcessed = i + 1;
      
      this.updateOperationProgress(operationId, progress, {
        itemsProcessed: i + 1,
        totalItems: items.length
      });
    }
    
    // Add to undo stack
    this.addToUndoStack('delete', { 
      items: deletedItems,
      toTrash
    });
    
    // Complete the operation
    this.completeOperation(operationId, {
      processed: operation.itemsProcessed,
      total: items.length,
      toTrash
    }, options);
  }
  
  /**
   * Recursively deletes a folder and its contents
   */
  private recursiveDeleteFolder(folderPath: string): void {
    // Find all paths that start with folder path
    const allPaths = Array.from(mockFileSystem.keys());
    const pathsToDelete = allPaths.filter(path => 
      path === folderPath || path.startsWith(`${folderPath}/`)
    );
    
    // Delete in reverse order (deepest first)
    pathsToDelete.sort((a, b) => b.length - a.length);
    
    // Delete each path
    for (const path of pathsToDelete) {
      mockFileSystem.delete(path);
    }
  }
  
  /**
   * Moves a folder's contents to trash
   */
  private moveToTrash(sourcePath: string, trashPath: string): void {
    // Find all paths that start with source path
    const allPaths = Array.from(mockFileSystem.keys());
    const pathsToMove = allPaths.filter(path => 
      path === sourcePath || path.startsWith(`${sourcePath}/`)
    );
    
    // Move each path
    for (const path of pathsToMove) {
      if (path === sourcePath) continue; // Skip the folder itself
      
      const relativePath = path.substring(sourcePath.length);
      const newPath = `${trashPath}${relativePath}`;
      
      // Copy the items
      const items = mockFileSystem.get(path) || [];
      const newItems = items.map(item => ({
        ...item,
        path: item.path.replace(path, newPath)
      }));
      
      mockFileSystem.set(newPath, newItems);
      mockFileSystem.delete(path);
    }
  }
  
  async restoreFromTrash(
    items: FileItem[],
    options?: BatchOperationOptions
  ): Promise<MoveOperation> {
    // Get the original paths (stored in metadata or estimated)
    const itemsWithDestinations = items.map(item => {
      // In a real implementation, would retrieve the original path from metadata
      // For the mock, just strip the "Trash/" prefix and handle name conflicts
      const originalPath = item.path.replace('/Trash/', '/');
      return { item, destination: this.getParentPath(originalPath) };
    });
    
    // Create a move operation
    const operationId = this.createOperationId();
    
    // Create the operation (move)
    const operation: MoveOperation = {
      id: operationId,
      type: 'move',
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      sources: items,
      destination: 'multiple', // Special value for multiple destinations
      itemsProcessed: 0
    };
    
    // Store the operation
    this.operations.set(operationId, operation);
    
    // Process the restore
    this.processRestore(operationId, itemsWithDestinations, options);
    
    return operation;
  }
  
  private async processRestore(
    operationId: string,
    itemsWithDestinations: Array<{ item: FileItem, destination: string }>,
    options?: BatchOperationOptions
  ): Promise<void> {
    const operation = this.operations.get(operationId) as MoveOperation;
    if (!operation) return;
    
    // Store original items for undo
    const originalItems: Array<{ item: FileItem, sourcePath: string }> = [];
    
    // Process each item
    for (let i = 0; i < itemsWithDestinations.length; i++) {
      // Check if operation was cancelled
      const currentOp = this.operations.get(operationId);
      if (!currentOp || currentOp.status === 'cancelled') {
        return;
      }
      
      const { item, destination } = itemsWithDestinations[i];
      
      // Ensure destination exists
      if (!mockFileSystem.has(destination)) {
        // Create destination path
        await this.createParentDirectories(destination);
      }
      
      await this.processSingleMoveOrCopy(
        operationId,
        item,
        destination,
        true, // Move
        originalItems,
        options
      );
      
      // Update progress
      const progress = Math.round(((i + 1) / itemsWithDestinations.length) * 100);
      operation.itemsProcessed = i + 1;
      
      this.updateOperationProgress(operationId, progress, {
        itemsProcessed: i + 1,
        totalItems: itemsWithDestinations.length
      });
    }
    
    // Add to undo stack
    this.addToUndoStack('restore', { 
      items: originalItems
    });
    
    // Complete the operation
    this.completeOperation(operationId, {
      processed: operation.itemsProcessed,
      total: itemsWithDestinations.length
    }, options);
  }
  
  /**
   * Creates parent directories as needed for a path
   */
  private async createParentDirectories(path: string): Promise<void> {
    const parts = path.split('/').filter(Boolean);
    let currentPath = '/';
    
    for (const part of parts) {
      const newPath = this.createPath(currentPath, part);
      
      if (!mockFileSystem.has(newPath)) {
        // Create directory
        mockFileSystem.set(newPath, []);
        
        // Add to parent
        const parentItems = mockFileSystem.get(currentPath) || [];
        parentItems.push({
          id: uuidv4(),
          name: part,
          type: 'folder',
          size: 0,
          created: new Date(),
          modified: new Date(),
          path: newPath,
          owner: 'current_user'
        });
        mockFileSystem.set(currentPath, parentItems);
      }
      
      currentPath = newPath;
    }
  }
  
  async emptyTrash(options?: FileOperationOptions): Promise<DeleteOperation> {
    const trashPath = '/Trash';
    const trashItems = mockFileSystem.get(trashPath) || [];
    
    // Create a delete operation
    const operationId = this.createOperationId();
    
    // Create the operation
    const operation: DeleteOperation = {
      id: operationId,
      type: 'delete',
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: trashItems,
      itemsProcessed: 0,
      toTrash: false // Permanent delete
    };
    
    // Store the operation
    this.operations.set(operationId, operation);
    
    // Process the operation
    this.processEmptyTrash(operationId, options);
    
    return operation;
  }
  
  private async processEmptyTrash(
    operationId: string,
    options?: FileOperationOptions
  ): Promise<void> {
    const operation = this.operations.get(operationId) as DeleteOperation;
    if (!operation) return;
    
    const trashPath = '/Trash';
    const trashItems = [...(mockFileSystem.get(trashPath) || [])];
    
    // Store for undo
    const deletedItems = trashItems.map(item => ({
      item: { ...item },
      parentPath: trashPath
    }));
    
    // Simulate delay
    await this.delay(500);
    
    // Update progress
    this.updateOperationProgress(operationId, 50);
    
    // Clear trash
    mockFileSystem.set(trashPath, []);
    
async undo(): Promise<boolean> {
    if (!this.canUndo()) {
      return false;
    }
    
    const lastAction = this.undoStack.pop();
    if (!lastAction) return false;
    
    this.redoStack.push(lastAction);
    
    // Process undo based on action type
    switch (lastAction.action) {
      case 'upload':
      case 'create-file': {
        const { filePath, parentPath } = lastAction.data;
        
        // Remove file from parent directory
        const parentDir = mockFileSystem.get(parentPath) || [];
        const fileIndex = parentDir.findIndex(item => item.path === filePath);
        
        if (fileIndex !== -1) {
          parentDir.splice(fileIndex, 1);
          mockFileSystem.set(parentPath, parentDir);
        }
        break;
      }
      
      case 'create-folder': {
        const { folderPath, parentPath } = lastAction.data;
        
        // Remove folder from parent directory
        const parentDir = mockFileSystem.get(parentPath) || [];
        const folderIndex = parentDir.findIndex(item => item.path === folderPath);
        
        if (folderIndex !== -1) {
          parentDir.splice(folderIndex, 1);
          mockFileSystem.set(parentPath, parentDir);
        }
        
        // Remove folder entry and all subfolders
        this.recursiveDeleteFolder(folderPath);
        break;
      }
      
      case 'rename': {
        const { item, path } = lastAction.data;
        const parentPath = this.getParentPath(path);
        
        // Find item in parent directory
        const parentDir = mockFileSystem.get(parentPath) || [];
        const itemIndex = parentDir.findIndex(i => i.id === item.id);
        
        if (itemIndex !== -1) {
          // If it's a folder, need to update all children paths
          if (item.type === 'folder') {
            const currentPath = parentDir[itemIndex].path;
            this.updateChildrenPaths(currentPath, path);
            
            // Update the folder entry in the map
            if (mockFileSystem.has(currentPath)) {
              const folderContents = mockFileSystem.get(currentPath) || [];
              mockFileSystem.delete(currentPath);
              mockFileSystem.set(path, folderContents);
            }
          }
          
          // Restore original name and path
          parentDir[itemIndex] = {
            ...parentDir[itemIndex],
            name: item.name,
            path: path,
            modified: item.modified
          };
          
          mockFileSystem.set(parentPath, parentDir);
        }
        break;
      }
      
      case 'move':
      case 'copy': {
        const { items, destination } = lastAction.data;
        
        // For each moved/copied item
        for (const { item, sourcePath } of items) {
          if (lastAction.action === 'move') {
            // For move, restore item to its original location
            const destPath = this.getParentPath(item.path);
            const destItems = mockFileSystem.get(destPath) || [];
            
            // Remove from destination
            const destIndex = destItems.findIndex(i => i.id === item.id);
            if (destIndex !== -1) {
              destItems.splice(destIndex, 1);
              mockFileSystem.set(destPath, destItems);
            }
            
            // Restore to source
            const sourceItems = mockFileSystem.get(sourcePath) || [];
            sourceItems.push(item);
            mockFileSystem.set(sourcePath, sourceItems);
            
            // If it's a folder, need to restore contents
            if (item.type === 'folder') {
              const destFolder = this.createPath(destPath, item.name);
              if (mockFileSystem.has(destFolder)) {
                const contents = mockFileSystem.get(destFolder) || [];
                mockFileSystem.delete(destFolder);
                mockFileSystem.set(item.path, contents);
              }
            }
          } else {
            // For copy, just remove the copied items
            const destPath = this.getParentPath(item.path);
            const destItems = mockFileSystem.get(destPath) || [];
            
            // Find the copied item by name (since ID will be different)
            const destIndex = destItems.findIndex(i => i.name === item.name);
            if (destIndex !== -1) {
              const copiedItem = destItems[destIndex];
              destItems.splice(destIndex, 1);
              mockFileSystem.set(destPath, destItems);
              
              // If it's a folder, remove all copied subfolders
              if (item.type === 'folder') {
                this.recursiveDeleteFolder(copiedItem.path);
              }
            }
          }
        }
        break;
      }
      
      case 'delete': {
        const { items, toTrash } = lastAction.data;
        
        // For each deleted item
        for (const { item, parentPath } of items) {
          // Restore item to its original location
          const parentItems = mockFileSystem.get(parentPath) || [];
          parentItems.push(item);
          mockFileSystem.set(parentPath, parentItems);
          
          // If it was a folder, need to restore contents
          if (item.type === 'folder') {
            // In a real implementation, would need to restore all subfolder contents
            // For the mock, just create empty folder
            mockFileSystem.set(item.path, []);
          }
          
          // If it was moved to trash, remove from trash
          if (toTrash) {
            const trashPath = '/Trash';
            const trashItems = mockFileSystem.get(trashPath) || [];
            
            // Find the item in trash (name might be different due to conflict handling)
            const trashIndex = trashItems.findIndex(i => 
              i.name.startsWith(item.name) || i.path.includes(item.name)
            );
            
            if (trashIndex !== -1) {
              const trashItem = trashItems[trashIndex];
              trashItems.splice(trashIndex, 1);
              mockFileSystem.set(trashPath, trashItems);
              
              // If it's a folder, remove all trashed subfolder contents
              if (item.type === 'folder') {
                this.recursiveDeleteFolder(trashItem.path);
              }
            }
          }
        }
        break;
      }
      
      case 'empty-trash': {
        const { items } = lastAction.data;
        
        // Restore all items to trash
        const trashPath = '/Trash';
        const trashItems = mockFileSystem.get(trashPath) || [];
        
        for (const { item } of items) {
          trashItems.push(item);
          
          // If it's a folder, we should restore its contents too
          // In a real implementation, would restore full folder structure
          if (item.type === 'folder') {
            mockFileSystem.set(item.path, []);
          }
        }
        
        mockFileSystem.set(trashPath, trashItems);
        break;
      }
      
      case 'restore': {
        const { items } = lastAction.data;
        
        // Move items back to trash
        const trashPath = '/Trash';
        const trashItems = mockFileSystem.get(trashPath) || [];
        
        for (const { item, sourcePath } of items) {
          // Remove from current location
          const parentPath = this.getParentPath(item.path);
          const parentItems = mockFileSystem.get(parentPath) || [];
          
          const itemIndex = parentItems.findIndex(i => i.id === item.id);
          if (itemIndex !== -1) {
            parentItems.splice(itemIndex, 1);
            mockFileSystem.set(parentPath, parentItems);
          }
          
          // Add back to trash
          trashItems.push({
            ...item,
            path: this.createPath(trashPath, item.name)
          });
          
          // If it's a folder, handle contents
          if (item.type === 'folder') {
            if (mockFileSystem.has(item.path)) {
              mockFileSystem.delete(item.path);
            }
          }
        }
        
        mockFileSystem.set(trashPath, trashItems);
        break;
      }
    }
    
    return true;
  }
  
  async redo(): Promise<boolean> {
    if (!this.canRedo()) {
      return false;
    }
    
    const action = this.redoStack.pop();
    if (!action) return false;
    
    // Add back to undo stack
    this.undoStack.push(action);
    
    // Process redo based on action type
    // In a real implementation, would need more detailed logic for each action type
    // For the mock, simplify by just redoing the operation
    
    switch (action.action) {
      case 'upload':
      case 'create-file': {
        // Would re-upload or re-create file
        // For mock, just add a placeholder file
        const { filePath, parentPath } = action.data;
        const fileName = this.getFilenameFromPath(filePath);
        
        const parentItems = mockFileSystem.get(parentPath) || [];
        parentItems.push({
          id: uuidv4(),
          name: fileName,
          type: getFileTypeFromExtension(fileName),
          size: 1024,
          created: new Date(),
          modified: new Date(),
          path: filePath,
          owner: 'current_user'
        });
        
        mockFileSystem.set(parentPath, parentItems);
        break;
      }
      
      case 'create-folder': {
        const { folderPath, parentPath } = action.data;
        const folderName = this.getFilenameFromPath(folderPath);
        
        // Create folder entry
        mockFileSystem.set(folderPath, []);
        
        // Add to parent
        const parentItems = mockFileSystem.get(parentPath) || [];
        parentItems.push({
          id: uuidv4(),
          name: folderName,
          type: 'folder',
          size: 0,
          created: new Date(),
          modified: new Date(),
          path: folderPath,
          owner: 'current_user'
        });
        
        mockFileSystem.set(parentPath, parentItems);
        break;
      }
      
      // Other cases would be handled similarly
      // For a complete implementation, each operation would need specific redo logic
      // In practice, this would often involve just re-executing the operation with saved parameters
    }
    
    return true;
  }
  
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }
  
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
  
  async cancelOperation(operationId: string): Promise<boolean> {
    const operation = this.operations.get(operationId);
    if (!operation) return false;
    
    // Cannot cancel completed or already cancelled operations
    if (operation.status === 'completed' || operation.status === 'cancelled') {
      return false;
    }
    
    operation.status = 'cancelled';
    operation.updatedAt = new Date();
    
    return true;
  }
  
  async listFiles(path: string): Promise<FileItem[]> {
    // Simulate delay
    await this.delay(200);
    
    // Check if path exists
    if (!mockFileSystem.has(path)) {
      return [];
    }
    
    return mockFileSystem.get(path) || [];
  }
  
  async getFileDetails(path: string): Promise<FileItem | null> {
    // Simulate delay
    await this.delay(100);
    
    const parentPath = this.getParentPath(path);
    const fileName = this.getFilenameFromPath(path);
    
    // Check if parent path exists
    if (!mockFileSystem.has(parentPath)) {
      return null;
    }
    
    // Find file in parent directory
    const parentDir = mockFileSystem.get(parentPath) || [];
    const file = parentDir.find(item => item.name === fileName);
    
    return file || null;
  }
}
    // Delete all subfolder entries
    const allPaths = Array.from(mockFileSystem.keys());
    const trashPaths = allPaths.filter(path => 
      path !== trashPath && path.startsWith(`${trashPath}/`)
    );
    
    for (const path of trashPaths) {
      mockFileSystem.delete(path);
    }
    
    // Update progress
    this.updateOperationProgress(operationId, 100);
    
    // Add to undo stack
    this.addToUndoStack('empty-trash', { 
      items: deletedItems
    });
    
    // Complete the operation
    this.completeOperation(operationId, {
      processed: trashItems.length,
      total: trashItems.length
    }, options);
  }
  
  cutToClipboard(items: FileItem[], sourceDirectory: string): void {
    this.clipboard = {
      operationType: 'cut',
      items: [...items],
      sourceDirectory
    };
  }
  
  copyToClipboard(items: FileItem[], sourceDirectory: string): void {
    this.clipboard = {
      operationType: 'copy',
      items: [...items],
      sourceDirectory
    };
  }
  
  async pasteFromClipboard(
    destination: string,
    options?: BatchOperationOptions
  ): Promise<MoveOperation | CopyOperation | null> {
    if (!this.clipboard.operationType || this.clipboard.items.length === 0) {
      return null;
    }
    
    const { operationType, items } = this.clipboard;
    
    if (operationType === 'cut') {
      return this.move(items, destination, options);
    } else {
      return this.copy(items, destination, options);
    }
  }
  
  getClipboardState(): ClipboardState {
    return { ...this.clipboard };
  }
  
  clearClipboard(): void {
    this.clipboard = { 
      operationType: null, 
      items: [], 
      sourceDirectory: '' 
    };
  }
      return;
    }
    
    // Simulate delay
    await this.delay(200);
    
    // Store original for undo
    originalItems.push({ item: { ...item }, sourcePath });
    
    // Get items from source and destination
    const sourceItems = mockFileSystem.get(sourcePath) || [];
    const destItems = mockFileSystem.get(destination) || [];
    
    // Create a copy of the item
    const newItem: FileItem = {
      ...item,
      id: isMove ? item.id : uuidv4(), // New ID for copy
      path: destPath,
      modified: new Date()
    };
    
    // Add to destination
    destItems.push(newItem);
    mockFileSystem.set(destination, destItems);
    
    // If it's a folder, handle children
    if (item.type === 'folder') {
      // For folders, also need to copy/move the contents
      const folderContents = mockFileSystem.get(item.path) || [];
      
      // Create the folder entry in the destination
      mockFileSystem.set(destPath, isMove ? folderContents : [...folderContents.map(i => ({
        ...i,
        id: uuidv4(),
        path: i.path.replace(item.path, destPath)
      }))]);
      
      // If this is a move, update all the paths
      if (isMove) {
        this.updateChildrenPaths(item.path, destPath);
      } else {
        // For copy, need to recursively copy all subfolders and files
        this.recursiveCopyFolder(item.path, destPath);
      }
    }
    
    // If moving, remove from source
    if (isMove) {
      const itemIndex = sourceItems.findIndex(i => i.id === item.id);
      if (itemIndex !== -1) {
        sourceItems.splice(itemIndex, 1);
        mockFileSystem.set(sourcePath, sourceItems);
        
        // If it's a folder, also remove the folder entry
        if (item.type === 'folder') {
          mockFileSystem.delete(item.path);
        }
      }
    }
  }
  
  /**
   * Recursively copies a folder and all its contents
   */
  private recursiveCopyFolder(sourcePath: string, destPath: string): void {
    // Copy all children
    const allPaths = Array.from(mockFileSystem.keys());
    
    // Find all paths that start with source path
    const pathsToCopy = allPaths.filter(path => 
      path === sourcePath || path.startsWith(`${sourcePath}/`)
    );
    
    // Copy each path
    for (const path of pathsToCopy) {
      if (path === sourcePath) continue; // Skip the folder itself
      
      const relativePath = path.substring(sourcePath.length);
      const newPath = `${destPath}${relativePath}`;
      
      // Copy the items
      const items = mockFileSystem.get(path) || [];
      const newItems = items.map(item => ({
        ...item,
        id: uuidv4(),
        path: item.path.replace(path, newPath)
      }));
      
      mockFileSystem.set(newPath, newItems);
    }
  }
    
    // Update progress
    this.updateOperationProgress(operationId, 50);
    
    // Create the file item
    const fileItem: FileItem = {
      id: uuidv4(),
      name: fileName,
      type: getFileTypeFromExtension(fileName),
      size: fileSize,
      created: new Date(),
      modified: new Date(),
      path: filePath,
      owner: 'current_user'
    };
    
    // Add to parent directory
    const parentDirItems = mockFileSystem.get(parentPath) || [];
    parentDirItems.push(fileItem);
    mockFileSystem.set(parentPath, parentDirItems);
    
    // Update progress
    this.updateOperationProgress(operationId, 100);
    
    // Add to undo stack
    this.addToUndoStack('create-file', { 
      filePath, 
      parentPath
    });
    
    // Complete the operation
    this.completeOperation(operationId, fileItem, options);
  }
  }