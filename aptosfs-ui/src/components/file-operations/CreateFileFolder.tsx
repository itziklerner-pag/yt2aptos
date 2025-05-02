import React, { useState, useEffect } from 'react';
import { useFileOperations } from '@/contexts/FileOperationsContext';
import { FileTemplate } from '@/types/file-operations.types';

interface CreateFileFolderProps {
  defaultIsFolder?: boolean;
  onSuccess?: (name: string, isFolder: boolean) => void;
  onCancel?: () => void;
  className?: string;
}

const CreateFileFolder: React.FC<CreateFileFolderProps> = ({
  defaultIsFolder = true,
  onSuccess,
  onCancel,
  className = '',
}) => {
  const [isFolder, setIsFolder] = useState(defaultIsFolder);
  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>(undefined);
  const [templates, setTemplates] = useState<FileTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { createFolder, createFile, fileTemplates, currentDirectory } = useFileOperations();
  
  // Load templates when component mounts
  useEffect(() => {
    setTemplates(fileTemplates);
    // If templates are available and we're creating a file, select the first one
    if (fileTemplates.length > 0 && !isFolder && !selectedTemplate) {
      setSelectedTemplate(fileTemplates[0].id);
    }
  }, [fileTemplates, isFolder, selectedTemplate]);
  
  // Reset selectedTemplate when switching between file and folder
  useEffect(() => {
    if (isFolder) {
      setSelectedTemplate(undefined);
    } else if (templates.length > 0 && !selectedTemplate) {
      setSelectedTemplate(templates[0].id);
    }
  }, [isFolder, selectedTemplate, templates]);
  
  // Validate name
  const validateName = (name: string): boolean => {
    // Disallowed characters in filenames (common restrictions across file systems)
    const disallowedChars = /[<>:"\/\\|?*\x00-\x1F]/;
    
    if (!name || name.trim() === '') {
      setError('Name cannot be empty');
      return false;
    }
    
    if (name.length > 255) {
      setError('Name is too long (maximum 255 characters)');
      return false;
    }
    
    if (disallowedChars.test(name)) {
      setError('Name contains invalid characters');
      return false;
    }
    
    setError(null);
    return true;
  };
  
  // Handle tab click
  const handleTabClick = (folder: boolean) => {
    setIsFolder(folder);
    setError(null);
  };
  
  // Handle name input change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (e.target.value) {
      validateName(e.target.value);
    } else {
      setError(null);
    }
  };
  
  // Handle template change
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplate(e.target.value);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateName(name)) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      if (isFolder) {
        // Create folder
        const operation = await createFolder(name);
        
        if (operation) {
          if (onSuccess) {
            onSuccess(name, true);
          }
        }
      } else {
        // Create file
        const operation = await createFile(name, selectedTemplate);
        
        if (operation) {
          if (onSuccess) {
            onSuccess(name, false);
          }
        }
      }
    } catch (error) {
      setError(`Error creating ${isFolder ? 'folder' : 'file'}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className={`create-file-folder ${className}`}>
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        <button
          type="button"
          className={`py-2 px-4 text-sm font-medium ${
            isFolder
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => handleTabClick(true)}
        >
          Folder
        </button>
        <button
          type="button"
          className={`py-2 px-4 text-sm font-medium ${
            !isFolder
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => handleTabClick(false)}
        >
          File
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Current directory */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Location
          </label>
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {currentDirectory}
          </div>
        </div>
        
        {/* Name input */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={handleNameChange}
            placeholder={isFolder ? 'New Folder' : 'New File'}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            autoFocus
            required
          />
        </div>
        
        {/* Template selection (for files only) */}
        {!isFolder && (
          <div className="mb-4">
            <label htmlFor="template" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Template
            </label>
            <select
              id="template"
              name="template"
              value={selectedTemplate}
              onChange={handleTemplateChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} (.{template.extension})
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="mb-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            disabled={!name || !!error || isProcessing}
          >
            {isProcessing && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Create {isFolder ? 'Folder' : 'File'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateFileFolder;