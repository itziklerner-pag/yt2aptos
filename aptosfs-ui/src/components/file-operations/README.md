# AptosFS File Operations

This directory contains components and services for handling file operations in the AptosFS decentralized file system.

## Components Overview

### FileOperationsToolbar
The main toolbar that provides access to file operations including:
- Creating new files and folders
- Cut, copy, paste operations
- Delete operations
- Undo/redo functionality

### FileUploader
A component with advanced file upload capabilities:
- Drag-and-drop support
- Multi-file upload
- Progress tracking
- Support for cancellation and resumable uploads
- File validation (size, type)
- Error handling

### FileDownloader
A component for downloading files:
- Single and batch file downloads
- Progress tracking
- Support for cancellation and resumable downloads
- Error handling

### ProgressBar
A visual component for displaying operation progress:
- Status-based coloring (in-progress, completed, error, cancelled)
- Animated transitions
- Customizable appearance

### CreateFileFolder
A component for creating new files and folders:
- Template-based file creation
- Name validation
- Location selection (current directory)

### ClipboardOperations
A component for managing clipboard operations:
- Cut, copy operations for selected files
- Paste operations to current directory
- Clipboard state visualization

## Usage Examples

### File Upload
```tsx
import { FileUploader } from '@/components/file-operations';

<FileUploader 
  currentDirectory="/Documents"
  onUploadComplete={() => console.log('Upload complete')}
  maxFileSize={1024 * 1024 * 100} // 100MB
  allowMultiple={true}
/>
```

### File Download
```tsx
import { FileDownloader } from '@/components/file-operations';

<FileDownloader 
  file={fileItem}
  onDownloadComplete={() => console.log('Download complete')}
>
  <button>Download File</button>
</FileDownloader>
```

### Create File/Folder
```tsx
import { CreateFileFolder } from '@/components/file-operations';

<CreateFileFolder 
  defaultIsFolder={true}
  onSuccess={(name, isFolder) => console.log(`Created ${isFolder ? 'folder' : 'file'}: ${name}`)}
  onCancel={() => console.log('Operation cancelled')}
/>
```

### File Operations Toolbar
```tsx
import { FileOperationsToolbar } from '@/components/file-operations';

<FileOperationsToolbar 
  onOperationComplete={() => console.log('Operation complete')}
/>
```

## Integration with Context

All file operations are managed through the `FileOperationsContext` which provides:
- State management for file operations
- Clipboard state management
- Operation tracking and progress updates
- Error handling and recovery mechanisms

```tsx
import { useFileOperations } from '@/contexts/FileOperationsContext';

function MyComponent() {
  const { 
    uploadFiles, 
    downloadFile, 
    createFolder,
    renameItem,
    cutToClipboard,
    copyToClipboard,
    pasteFromClipboard
  } = useFileOperations();
  
  // Use operations as needed
}
```

## Service Interface

The file operations are defined by the `IFileOperationsService` interface, which can be implemented for different backends:
- `MockFileOperationsService`: For development and testing
- `AptosFileOperationsService`: For production (connects to blockchain)

The service provides methods for:
- File uploads and downloads
- File and folder creation
- File modification (rename, move, copy, delete)
- Clipboard operations
- Undo/redo functionality

## Error Handling

All operations include built-in error handling with:
- Operation-specific error types
- Recoverable vs. non-recoverable errors
- Error status visualization
- Retry mechanisms where appropriate

## Progress Tracking

Long-running operations include progress tracking with:
- Percentage-based progress indicators
- Bytes processed tracking
- Time remaining estimates
- Cancellation support