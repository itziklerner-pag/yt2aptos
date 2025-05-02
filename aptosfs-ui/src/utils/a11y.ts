/**
 * Accessibility utilities for AptosFS components
 */

/**
 * Generate standardized ARIA attributes for file items
 * @param file - The file or folder item
 * @param isSelected - Whether the item is selected
 * @param isFocused - Whether the item has keyboard focus
 * @returns Object with ARIA attributes
 */
export function getFileItemAriaAttributes(
  file: any,
  isSelected: boolean = false, 
  isFocused: boolean = false
) {
  const fileType = file.type === 'folder' ? 'folder' : 'file';
  const ariaLabel = `${file.name}, ${fileType}${file.starred ? ', starred' : ''}${file.shared ? ', shared' : ''}`;
  
  return {
    role: 'listitem',
    'aria-label': ariaLabel,
    'aria-selected': isSelected,
    'aria-grabbed': false, // Used for drag operations
    'aria-roledescription': fileType,
    'aria-busy': false, // Set to true when file operations are in progress
  };
}

/**
 * Generate standardized ARIA attributes for file explorer
 * @param currentPath - Current directory path
 * @param numberOfItems - Number of items in the current directory
 * @param selectedItems - Number of selected items
 * @returns Object with ARIA attributes
 */
export function getFileExplorerAriaAttributes(
  currentPath: string,
  numberOfItems: number,
  selectedItems: number = 0
) {
  return {
    role: 'region',
    'aria-label': `File explorer, ${currentPath}`,
    'aria-description': `Contains ${numberOfItems} items${selectedItems > 0 ? `, ${selectedItems} selected` : ''}`,
    'aria-busy': false, // Set to true when loading or performing operations
  };
}

/**
 * Generate ARIA attributes for file operations
 * @param operation - Type of operation
 * @param isInProgress - Whether the operation is in progress
 * @param completionPercentage - Completion percentage for progress bars
 * @returns Object with ARIA attributes
 */
export function getOperationAriaAttributes(
  operation: 'upload' | 'download' | 'delete' | 'create' | 'rename' | 'move' | 'copy',
  isInProgress: boolean = false,
  completionPercentage?: number
) {
  let ariaLabel = `${operation} operation`;
  
  if (isInProgress && completionPercentage !== undefined) {
    ariaLabel += `, ${completionPercentage}% complete`;
  } else if (isInProgress) {
    ariaLabel += ', in progress';
  }
  
  return {
    'aria-label': ariaLabel,
    'aria-live': isInProgress ? 'polite' : 'off',
    'aria-busy': isInProgress,
    ...(completionPercentage !== undefined && {
      'aria-valuenow': completionPercentage,
      'aria-valuemin': 0,
      'aria-valuemax': 100,
    }),
  };
}

/**
 * Create skip link target IDs for main regions of the application
 */
export const skipLinkTargets = {
  main: 'main-content',
  fileExplorer: 'file-explorer',
  fileOperations: 'file-operations',
  navigation: 'main-navigation',
};

/**
 * Create focus trap utility for modal dialogs
 * @param ref - Ref to the dialog container
 */
export function useFocusTrap(ref: React.RefObject<HTMLElement>) {
  const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  
  function handleKeyDown(e: KeyboardEvent) {
    // Only process if the focus trap is active
    if (!ref.current || !document.contains(ref.current)) {
      return;
    }
    
    // Find all focusable elements in the ref
    const focusableElements = Array.from(ref.current.querySelectorAll(focusableSelector));
    
    if (focusableElements.length === 0) {
      return;
    }
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    // Handle Tab key to trap focus
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }
  
  // Attach/detach event listener for key events
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref.current]);
  
  // On mount, focus the first element
  React.useEffect(() => {
    if (ref.current) {
      const firstFocusableElement = ref.current.querySelector(focusableSelector) as HTMLElement;
      if (firstFocusableElement) {
        firstFocusableElement.focus();
      }
    }
  }, [ref.current]);
}