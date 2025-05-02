import React from 'react';
import { skipLinkTargets } from '@/utils/a11y';

/**
 * SkipLinks component for keyboard accessibility
 * Allows keyboard users to skip directly to main content areas
 */
export const SkipLinks: React.FC = () => {
  return (
    <div className="skip-links fixed top-0 left-0 z-50">
      {/* These links are visually hidden but become visible on focus */}
      <a 
        href={`#${skipLinkTargets.main}`}
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white dark:bg-gray-800 px-4 py-2 text-finder-blue rounded shadow-md focus:outline-none"
      >
        Skip to main content
      </a>
      
      <a 
        href={`#${skipLinkTargets.fileExplorer}`}
        className="sr-only focus:not-sr-only focus:absolute focus:top-12 focus:left-2 bg-white dark:bg-gray-800 px-4 py-2 text-finder-blue rounded shadow-md focus:outline-none"
      >
        Skip to file explorer
      </a>
      
      <a 
        href={`#${skipLinkTargets.fileOperations}`}
        className="sr-only focus:not-sr-only focus:absolute focus:top-22 focus:left-2 bg-white dark:bg-gray-800 px-4 py-2 text-finder-blue rounded shadow-md focus:outline-none"
      >
        Skip to file operations
      </a>
      
      <a 
        href={`#${skipLinkTargets.navigation}`}
        className="sr-only focus:not-sr-only focus:absolute focus:top-32 focus:left-2 bg-white dark:bg-gray-800 px-4 py-2 text-finder-blue rounded shadow-md focus:outline-none"
      >
        Skip to navigation
      </a>
    </div>
  );
};

/**
 * SkipTarget component for use as targets for skip links
 */
interface SkipTargetProps {
  id: string;
  children: React.ReactNode;
}

export const SkipTarget: React.FC<SkipTargetProps> = ({ id, children }) => {
  return (
    <div id={id} tabIndex={-1}>
      {children}
    </div>
  );
};

/**
 * Higher-order component to wrap sections with skip targets
 */
export function withSkipTarget<T extends object>(
  Component: React.ComponentType<T>,
  targetId: string
): React.FC<T> {
  return (props: T) => (
    <SkipTarget id={targetId}>
      <Component {...props} />
    </SkipTarget>
  );
}

export default SkipLinks;