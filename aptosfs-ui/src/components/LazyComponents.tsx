import React, { Suspense, lazy, LazyExoticComponent, ComponentType } from 'react';

// Loading components for various sizes
const SmallLoading = () => (
  <div className="p-2 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-finder-blue border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const MediumLoading = () => (
  <div className="p-4 flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-finder-blue border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const FullPageLoading = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-50">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto border-4 border-finder-blue border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
    </div>
  </div>
);

// Type definitions for component wrappers
type LazyComponentOptions = {
  fallback?: React.ReactNode;
  preload?: boolean;
  errorBoundary?: boolean;
};

/**
 * Creates a lazily loaded component with suspense and optional error boundary
 * @param importFn - Dynamic import function for the component
 * @param options - Options for lazy loading behavior
 * @returns Lazy loaded component wrapped in Suspense
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): LazyExoticComponent<T> & { preload: () => void } {
  const {
    fallback = <MediumLoading />,
    preload: shouldPreload = false,
    errorBoundary = false,
  } = options;

  // Create lazy component
  const LazyComponent = lazy(importFn);
  
  // Add preload method
  const PreloadableLazyComponent = LazyComponent as LazyExoticComponent<T> & { preload: () => void };
  PreloadableLazyComponent.preload = () => importFn();
  
  // Trigger preload if requested
  if (shouldPreload) {
    PreloadableLazyComponent.preload();
  }
  
  return PreloadableLazyComponent;
}

// Lazily loaded components
export const LazyFileOperationsToolbar = createLazyComponent(
  () => import('./file-operations/FileOperationsToolbar'),
  { fallback: <SmallLoading /> }
);

export const LazyFileUploader = createLazyComponent(
  () => import('./file-operations/FileUploader'),
  { fallback: <MediumLoading /> }
);

export const LazyFileDownloader = createLazyComponent(
  () => import('./file-operations/FileDownloader'),
  { fallback: <SmallLoading /> }
);

export const LazyQuickLook = createLazyComponent(
  () => import('./file-view/QuickLook'),
  { fallback: <FullPageLoading /> }
);

export const LazyFileContextMenu = createLazyComponent(
  () => import('./file-item/FileContextMenu'),
  { fallback: <SmallLoading /> }
);

/**
 * HOC to wrap a component with Suspense
 * @param Component - Component to wrap
 * @param fallback - Loading fallback
 * @returns Wrapped component
 */
export function withSuspense<T>(
  Component: React.ComponentType<T>,
  fallback: React.ReactNode = <MediumLoading />
): React.FC<T> {
  return (props: T) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
}