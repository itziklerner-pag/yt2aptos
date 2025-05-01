import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium' }) => {
  // Map size to pixel values
  const sizeMap = {
    small: {
      container: '24px',
      border: '3px'
    },
    medium: {
      container: '40px',
      border: '4px'
    },
    large: {
      container: '60px',
      border: '6px'
    }
  };
  
  const { container, border } = sizeMap[size];
  
  // Define CSS as an object
  const spinnerStyle = {
    width: container,
    height: container,
    borderWidth: border,
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: '50%',
    borderTopColor: '#007bff', // Primary color fallback
    animation: 'spin 1s ease-in-out infinite'
  };
  
  return (
    <div className="loading-container">
      <div className="spinner" style={spinnerStyle} />
      <style>
        {`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingSpinner;