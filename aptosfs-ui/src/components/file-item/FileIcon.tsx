import React from 'react';
import { FileType } from '@/types';

interface FileIconProps {
  fileType: FileType;
  size?: 'small' | 'medium' | 'large';
}

const FileIcon: React.FC<FileIconProps> = ({ fileType, size = 'medium' }) => {
  // Determine icon size based on prop
  const iconSize = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-12 h-12',
  };
  
  // Default icon styles
  const defaultStyles = 'text-gray-500 dark:text-gray-400';

  // Custom colors for different file types
  const iconColor = {
    folder: 'text-blue-500 dark:text-blue-400',
    image: 'text-green-500 dark:text-green-400',
    video: 'text-purple-500 dark:text-purple-400',
    audio: 'text-pink-500 dark:text-pink-400',
    document: 'text-orange-500 dark:text-orange-400',
    pdf: 'text-red-500 dark:text-red-400',
    archive: 'text-yellow-500 dark:text-yellow-400',
    code: 'text-indigo-500 dark:text-indigo-400',
    unknown: defaultStyles,
  };

  // Render the appropriate icon based on file type
  const renderIcon = () => {
    switch (fileType) {
      case 'folder':
        return (
          <svg className={`${iconSize[size]} ${iconColor.folder}`} fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'image':
        return (
          <svg className={`${iconSize[size]} ${iconColor.image}`} fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'video':
        return (
          <svg className={`${iconSize[size]} ${iconColor.video}`} fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
            />
            <path
              d="M14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"
            />
          </svg>
        );
      case 'audio':
        return (
          <svg className={`${iconSize[size]} ${iconColor.audio}`} fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'document':
        return (
          <svg className={`${iconSize[size]} ${iconColor.document}`} fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'pdf':
        return (
          <svg className={`${iconSize[size]} ${iconColor.pdf}`} fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
              clipRule="evenodd"
            />
            <path
              fillRule="evenodd"
              d="M8.5 9.5a1 1 0 011-1H10a2 2 0 012 2v1a2 2 0 01-2 2H9.5a1 1 0 010-2H10a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5H9.5a1 1 0 01-1-1zM7 12a1 1 0 110-2h.01a1 1 0 110 2H7zm4 0a1 1 0 110-2h.01a1 1 0 110 2H11z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'archive':
        return (
          <svg className={`${iconSize[size]} ${iconColor.archive}`} fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"
            />
            <path
              fillRule="evenodd"
              d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'code':
        return (
          <svg className={`${iconSize[size]} ${iconColor.code}`} fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg className={`${iconSize[size]} ${iconColor.unknown}`} fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  return renderIcon();
};

export default FileIcon;