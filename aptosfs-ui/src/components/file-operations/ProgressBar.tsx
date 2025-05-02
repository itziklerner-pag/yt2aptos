import React from 'react';
import { OperationStatus } from '@/types/file-operations.types';

interface ProgressBarProps {
  progress: number;
  status?: OperationStatus;
  height?: number;
  animated?: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  status = 'in-progress',
  height = 4,
  animated = true,
  className = '',
}) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  
  // Determine the color based on status
  let progressColor = 'bg-blue-500';
  if (status === 'completed') progressColor = 'bg-green-500';
  if (status === 'error') progressColor = 'bg-red-500';
  if (status === 'cancelled') progressColor = 'bg-gray-500';
  
  return (
    <div 
      className={`w-full bg-gray-200 dark:bg-gray-700 rounded overflow-hidden ${className}`}
      style={{ height: `${height}px` }}
    >
      <div
        className={`
          ${progressColor} 
          ${animated && status === 'in-progress' ? 'transition-all duration-300 ease-out' : ''}
          ${status === 'completed' ? 'transition-all duration-500 ease-out' : ''}
        `}
        style={{ 
          width: `${normalizedProgress}%`,
          height: '100%'
        }}
      />
    </div>
  );
};

export default ProgressBar;