import React, { createContext, useContext, useState, useEffect } from 'react';
import { FileItem } from '@/types';
import { 
  ClipboardState, 
  FileTemplate,
  FileOperation
} from '@/types/file-operations.types';
import { MockFileOperationsService } from '@/services/file-operations/mock-file-operations.service';

// Create the service instance
const fileOperationsService = new MockFileOperationsService();

// Define the context type
interface FileOperationsContextType {
  // File listings
  currentDirectory: string;
  setCurrentDirectory: (path: string) => void;
  listFiles: (path: string) => Promise<FileItem[]>;
  refreshCurrentDirectory: () => Promise<void>;
  
  // Selection
  selectedItems: FileItem[];
  selectItem: (item: FileItem, isMultiSelect?: boolean) => void;
  deselectItem: (item: FileItem) => void;
  selectAll: () => void;
  deselectAll: () => void;
  
  // File operations
  uploadFiles: (files: File[], options?: any) => Promise<any[]>;
  downloadFile: (file: FileItem, options?: any) => Promise<any>;
  downloadFiles: (files: FileItem[], options?: any) => Promise<any[]>;
  createFolder: (name: string, options?: any) => Promise<any>;
  createFile: (name: string, templateId?: string, options?: any) => Promise<any>;
  renameItem: (item: FileItem, newName: string, options?: any) => Promise<any>;
  moveItems: (items: FileItem[], destination: string, options?: any) => Promise<any>;
  copyItems: (items: FileItem[], destination: string, options?: any) => Promise<any>;
  deleteItems: (items: FileItem[], toTrash?: boolean, options?: any) => Promise<any>;
  restoreItems: (items: FileItem[], options?: any) => Promise<any>;
  emptyTrash: (options?: any) => Promise<any>;
  
  // Clipboard operations
  clipboard: ClipboardState;
  cutToClipboard: (items: FileItem[]) => void;
  copyToClipboard: (items: FileItem[]) => void;
  pasteFromClipboard: () => Promise<any>;
  clearClipboard: () => void;
  
  // Undo/Redo
  canUndo: boolean;
  canRedo: boolean;
  undo: () => Promise<boolean>;
  redo: () => Promise<boolean>;
  
  // Templates
  fileTemplates: FileTemplate[];
  
  // Operations tracking
  operations: FileOperation[];
  getOperation: (id: string) => FileOperation | undefined;
  cancelOperation: (id: string) => Promise<boolean>;
}

// Create the context
const FileOperationsContext = createContext<FileOperationsContextType | undefined>(undefined);

// Context provider component
export const FileOperationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDirectory, setCurrentDirectory] = useState('/');
  const [selectedItems, setSelectedItems] = useState<FileItem[]>([]);
  const [clipboard, setClipboard] = useState<ClipboardState>({ operationType: null, items: [], sourceDirectory: '' });
  const [operations, setOperations] = useState<FileOperation[]>([]);
  const [fileTemplates, setFileTemplates] = useState<FileTemplate[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  
  // Initial load
  useEffect(() => {
    // Load templates
    setFileTemplates(fileOperationsService.getFileTemplates());
    
    // Load initial directory
    listFiles(currentDirectory)
      .then(items => setFiles(items))
      .catch(error => console.error('Error loading files:', error));
    
    // Set up intervals to update operations and undo/redo state
    const interval = setInterval(() => {
      setOperations(fileOperationsService.getOperations());
      setCanUndo(fileOperationsService.canUndo());
      setCanRedo(fileOperationsService.canRedo());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // List files in a directory
  const listFiles = async (path: string): Promise<FileItem[]> => {
    try {
      const items = await fileOperationsService.listFiles(path);
      return items;
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  };
  
  // Refresh current directory
  const refreshCurrentDirectory = async (): Promise<void> => {
    try {
      const items = await fileOperationsService.listFiles(currentDirectory);
      setFiles(items);
    } catch (error) {
      console.error('Error refreshing directory:', error);
    }
  };
  
  // Selection management
  const selectItem = (item: FileItem, isMultiSelect = false): void => {
    if (isMultiSelect) {
      // Check if already selected
      const isSelected = selectedItems.some(i => i.id === item.id);
      if (isSelected) {
        deselectItem(item);
      } else {
        setSelectedItems(prev => [...prev, item]);
      }
    } else {
      setSelectedItems([item]);
    }
  };
  
  const deselectItem = (item: FileItem): void => {
    setSelectedItems(prev => prev.filter(i => i.id !== item.id));
  };
  
  const selectAll = (): void => {
    setSelectedItems(files);
  };
  
  const deselectAll = (): void => {
    setSelectedItems([]);
  };
  
  // File operations
  const uploadFiles = async (files: File[], options?: any): Promise<any[]> => {
    try {
      const result = await fileOperationsService.uploadFiles(files, currentDirectory, options);
      refreshCurrentDirectory();
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };
  
  const downloadFile = async (file: FileItem, options?: any): Promise<any> => {
    try {
      return await fileOperationsService.downloadFile(file, options);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  };
  
  const downloadFiles = async (files: FileItem[], options?: any): Promise<any[]> => {
    try {
      return await fileOperationsService.downloadFiles(files, options);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  };
  
  const createFolder = async (name: string, options?: any): Promise<any> => {
    try {
      const result = await fileOperationsService.createFolder(currentDirectory, name, options);
      refreshCurrentDirectory();
      return result;
    } catch (error) {
      console.error('Create folder error:', error);
      throw error;
    }
  };
  
  const createFile = async (name: string, templateId?: string, options?: any): Promise<any> => {
    try {
      const result = await fileOperationsService.createFile(currentDirectory, name, templateId, options);
      refreshCurrentDirectory();
      return result;
    } catch (error) {
      console.error('Create file error:', error);
      throw error;
    }
  };
  
  const renameItem = async (item: FileItem, newName: string, options?: any): Promise<any> => {
    try {
      const result = await fileOperationsService.rename(item, newName, options);
      refreshCurrentDirectory();
      return result;
    } catch (error) {
      console.error('Rename error:', error);
      throw error;
    }
  };
  
  const moveItems = async (items: FileItem[], destination: string, options?: any): Promise<any> => {
    try {
      const result = await fileOperationsService.move(items, destination, options);
      refreshCurrentDirectory();
      return result;
    } catch (error) {
      console.error('Move error:', error);
      throw error;
    }
  };
  
  const copyItems = async (items: FileItem[], destination: string, options?: any): Promise<any> => {
    try {
      const result = await fileOperationsService.copy(items, destination, options);
      refreshCurrentDirectory();
      return result;
    } catch (error) {
      console.error('Copy error:', error);
      throw error;
    }
  };
  
  const deleteItems = async (items: FileItem[], toTrash = true, options?: any): Promise<any> => {
    try {
      const result = await fileOperationsService.delete(items, toTrash, options);
      refreshCurrentDirectory();
      return result;
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  };
  
  const restoreItems = async (items: FileItem[], options?: any): Promise<any> => {
    try {
      const result = await fileOperationsService.restoreFromTrash(items, options);
      refreshCurrentDirectory();
      return result;
    } catch (error) {
      console.error('Restore error:', error);
      throw error;
    }
  };
  
  const emptyTrash = async (options?: any): Promise<any> => {
    try {
      const result = await fileOperationsService.emptyTrash(options);
      if (currentDirectory === '/Trash') {
        refreshCurrentDirectory();
      }
      return result;
    } catch (error) {
      console.error('Empty trash error:', error);
      throw error;
    }
  };
  
  // Clipboard operations
  const cutToClipboard = (items: FileItem[]): void => {
    fileOperationsService.cutToClipboard(items, currentDirectory);
    setClipboard({
      operationType: 'cut',
      items,
      sourceDirectory: currentDirectory
    });
  };
  
  const copyToClipboard = (items: FileItem[]): void => {
    fileOperationsService.copyToClipboard(items, currentDirectory);
    setClipboard({
      operationType: 'copy',
      items,
      sourceDirectory: currentDirectory
    });
  };
  
  const pasteFromClipboard = async (): Promise<any> => {
    try {
      const result = await fileOperationsService.pasteFromClipboard(currentDirectory);
      refreshCurrentDirectory();
      
      // Clear clipboard if it was a cut operation
      if (clipboard.operationType === 'cut') {
        clearClipboard();
      }
      
      return result;
    } catch (error) {
      console.error('Paste error:', error);
      throw error;
    }
  };
  
  const clearClipboard = (): void => {
    fileOperationsService.clearClipboard();
    setClipboard({ operationType: null, items: [], sourceDirectory: '' });
  };
  
  // Undo/Redo
  const undo = async (): Promise<boolean> => {
    try {
      const result = await fileOperationsService.undo();
      if (result) {
        refreshCurrentDirectory();
      }
      return result;
    } catch (error) {
      console.error('Undo error:', error);
      return false;
    }
  };
  
  const redo = async (): Promise<boolean> => {
    try {
      const result = await fileOperationsService.redo();
      if (result) {
        refreshCurrentDirectory();
      }
      return result;
    } catch (error) {
      console.error('Redo error:', error);
      return false;
    }
  };
  
  // Operations tracking
  const getOperation = (id: string): FileOperation | undefined => {
    return fileOperationsService.getOperation(id);
  };
  
  const cancelOperation = async (id: string): Promise<boolean> => {
    return fileOperationsService.cancelOperation(id);
  };
  
  // Context value
  const contextValue: FileOperationsContextType = {
    currentDirectory,
    setCurrentDirectory,
    listFiles,
    refreshCurrentDirectory,
    selectedItems,
    selectItem,
    deselectItem,
    selectAll,
    deselectAll,
    uploadFiles,
    downloadFile,
    downloadFiles,
    createFolder,
    createFile,
    renameItem,
    moveItems,
    copyItems,
    deleteItems,
    restoreItems,
    emptyTrash,
    clipboard,
    cutToClipboard,
    copyToClipboard,
    pasteFromClipboard,
    clearClipboard,
    canUndo,
    canRedo,
    undo,
    redo,
    fileTemplates,
    operations,
    getOperation,
    cancelOperation
  };
  
  return (
    <FileOperationsContext.Provider value={contextValue}>
      {children}
    </FileOperationsContext.Provider>
  );
};

// Custom hook for using the context
export const useFileOperations = (): FileOperationsContextType => {
  const context = useContext(FileOperationsContext);
  if (!context) {
    throw new Error('useFileOperations must be used within a FileOperationsProvider');
  }
  return context;
};