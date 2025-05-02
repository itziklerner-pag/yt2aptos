import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileExplorer } from '../file-explorer/FileExplorer';
import { checkA11y } from '@/utils/__tests__/a11y-utils';

// Mock contexts as needed
jest.mock('@/contexts/FileOperationsContext', () => ({
  useFileOperations: () => ({
    uploadFiles: jest.fn(),
    downloadFile: jest.fn(),
    createFolder: jest.fn(),
    deleteFile: jest.fn(),
    renameItem: jest.fn(),
    currentPath: '/Documents',
    isLoading: false,
    loadPath: jest.fn(),
    error: null,
  }),
}));

// Mock file data
const mockFiles = [
  {
    id: '1',
    name: 'file1.txt',
    path: '/Documents/file1.txt',
    type: 'text',
    size: 1024,
    modified: new Date('2025-01-01'),
    created: new Date('2025-01-01'),
    starred: false,
    shared: false,
  },
  {
    id: '2',
    name: 'folder1',
    path: '/Documents/folder1',
    type: 'folder',
    size: 0,
    modified: new Date('2025-01-01'),
    created: new Date('2025-01-01'),
    starred: true,
    shared: false,
  },
];

describe('FileExplorer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders file explorer with files', () => {
    render(<FileExplorer files={mockFiles} currentPath="/Documents" />);
    
    expect(screen.getByText('file1.txt')).toBeInTheDocument();
    expect(screen.getByText('folder1')).toBeInTheDocument();
  });

  it('renders empty state when no files', () => {
    render(<FileExplorer files={[]} currentPath="/Documents" />);
    
    expect(screen.getByText(/No files found/i)).toBeInTheDocument();
  });

  it('updates selected files when clicking on a file', () => {
    render(<FileExplorer files={mockFiles} currentPath="/Documents" />);
    
    const file1 = screen.getByText('file1.txt');
    fireEvent.click(file1);
    
    // Check if selection state updates (implementation specific)
    // This might require test IDs or other ways to check selection state
  });

  it('allows switching between grid and list views', () => {
    const { container } = render(<FileExplorer files={mockFiles} currentPath="/Documents" />);
    
    // Find view toggle buttons (assuming they exist with specific text or test IDs)
    const gridViewButton = screen.getByRole('button', { name: /grid/i });
    const listViewButton = screen.getByRole('button', { name: /list/i });
    
    // Check initial state (assuming grid is default)
    expect(container.querySelector('.grid-view')).toBeInTheDocument();
    
    // Switch to list view
    fireEvent.click(listViewButton);
    expect(container.querySelector('.list-view')).toBeInTheDocument();
    
    // Switch back to grid view
    fireEvent.click(gridViewButton);
    expect(container.querySelector('.grid-view')).toBeInTheDocument();
  });

  it('shows detailed file info in list view', () => {
    render(<FileExplorer files={mockFiles} currentPath="/Documents" initialView="list" />);
    
    // In list view, file sizes and types should be visible
    expect(screen.getByText('1.0 KB')).toBeInTheDocument();
    expect(screen.getByText('text')).toBeInTheDocument();
  });

  it('displays current path correctly', () => {
    render(<FileExplorer files={mockFiles} currentPath="/Documents/Work" />);
    
    expect(screen.getByText('/Documents/Work')).toBeInTheDocument();
  });

  it('supports keyboard navigation', async () => {
    render(<FileExplorer files={mockFiles} currentPath="/Documents" />);
    
    // First, need to focus on the file explorer
    const explorer = screen.getByRole('region', { name: /file explorer/i });
    explorer.focus();
    
    // Test arrow key navigation
    fireEvent.keyDown(explorer, { key: 'ArrowDown' });
    expect(screen.getByText('file1.txt').closest('div')).toHaveClass('selected');
    
    fireEvent.keyDown(explorer, { key: 'ArrowDown' });
    expect(screen.getByText('folder1').closest('div')).toHaveClass('selected');
    
    fireEvent.keyDown(explorer, { key: 'ArrowUp' });
    expect(screen.getByText('file1.txt').closest('div')).toHaveClass('selected');
  });

  it('meets accessibility standards', async () => {
    await checkA11y(
      <FileExplorer files={mockFiles} currentPath="/Documents" />
    );
  });

  it('has proper focus management', async () => {
    render(<FileExplorer files={mockFiles} currentPath="/Documents" />);
    
    // First file should be tabbable
    const firstFile = screen.getByText('file1.txt').closest('div');
    expect(firstFile).toHaveAttribute('tabindex', '0');
    
    // Test that focus moves appropriately
    firstFile?.focus();
    expect(document.activeElement).toBe(firstFile);
  });
});