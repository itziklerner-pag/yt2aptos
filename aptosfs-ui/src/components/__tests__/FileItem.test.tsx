import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileItem from '../file-item/FileItem';
import { checkA11y } from '@/utils/__tests__/a11y-utils';

// Mock file type for tests
const mockFile = {
  id: '123',
  name: 'test-file.txt',
  path: '/test-file.txt',
  type: 'text',
  size: 1024,
  modified: new Date('2025-01-01'),
  created: new Date('2025-01-01'),
  starred: false,
  shared: false,
};

describe('FileItem Component', () => {
  const onSelectMock = jest.fn();
  const onDoubleClickMock = jest.fn();
  const onContextMenuMock = jest.fn();
  const onRenameMock = jest.fn();
  const onDragStartMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders in grid view correctly', () => {
    render(
      <FileItem
        file={mockFile}
        selected={false}
        onSelect={onSelectMock}
        onDoubleClick={onDoubleClickMock}
        onContextMenu={onContextMenuMock}
        onRename={onRenameMock}
        onDragStart={onDragStartMock}
        view="grid"
      />
    );

    expect(screen.getByText('test-file.txt')).toBeInTheDocument();
  });

  it('renders in list view correctly', () => {
    render(
      <FileItem
        file={mockFile}
        selected={false}
        onSelect={onSelectMock}
        onDoubleClick={onDoubleClickMock}
        onContextMenu={onContextMenuMock}
        onRename={onRenameMock}
        onDragStart={onDragStartMock}
        view="list"
      />
    );

    expect(screen.getByText('test-file.txt')).toBeInTheDocument();
    expect(screen.getByText('1.0 KB')).toBeInTheDocument(); // Formatted size
    expect(screen.getByText('text')).toBeInTheDocument(); // File type
  });

  it('shows selected state correctly', () => {
    const { rerender } = render(
      <FileItem
        file={mockFile}
        selected={false}
        onSelect={onSelectMock}
        view="grid"
      />
    );

    const fileItem = screen.getByText('test-file.txt').closest('.file-item');
    expect(fileItem).not.toHaveClass('bg-finder-blue/20');

    // Rerender with selected=true
    rerender(
      <FileItem
        file={mockFile}
        selected={true}
        onSelect={onSelectMock}
        view="grid"
      />
    );

    expect(fileItem).toHaveClass('bg-finder-blue/20');
  });

  it('calls onSelect when clicked', () => {
    render(
      <FileItem
        file={mockFile}
        selected={false}
        onSelect={onSelectMock}
        view="grid"
      />
    );

    const fileItem = screen.getByText('test-file.txt').closest('.file-item');
    fireEvent.click(fileItem!);

    expect(onSelectMock).toHaveBeenCalledTimes(1);
    expect(onSelectMock).toHaveBeenCalledWith(mockFile, expect.anything());
  });

  it('calls onDoubleClick when double-clicked', () => {
    render(
      <FileItem
        file={mockFile}
        selected={false}
        onSelect={onSelectMock}
        onDoubleClick={onDoubleClickMock}
        view="grid"
      />
    );

    const fileItem = screen.getByText('test-file.txt').closest('.file-item');
    fireEvent.doubleClick(fileItem!);

    expect(onDoubleClickMock).toHaveBeenCalledTimes(1);
    expect(onDoubleClickMock).toHaveBeenCalledWith(mockFile);
  });

  it('allows renaming the file when double clicking the name', async () => {
    render(
      <FileItem
        file={mockFile}
        selected={false}
        onSelect={onSelectMock}
        onRename={onRenameMock}
        view="grid"
      />
    );

    // Double click on the name to start renaming
    const fileName = screen.getByText('test-file.txt');
    fireEvent.doubleClick(fileName);

    // Check if input field appears
    const inputField = screen.getByDisplayValue('test-file.txt');
    expect(inputField).toBeInTheDocument();

    // Change the file name
    await userEvent.clear(inputField);
    await userEvent.type(inputField, 'new-file-name.txt');
    
    // Confirm by pressing Enter
    fireEvent.keyDown(inputField, { key: 'Enter' });

    // Check if onRename was called with correct parameters
    expect(onRenameMock).toHaveBeenCalledWith(mockFile, 'new-file-name.txt');
  });

  it('calls onContextMenu when right-clicked', () => {
    render(
      <FileItem
        file={mockFile}
        selected={false}
        onSelect={onSelectMock}
        onContextMenu={onContextMenuMock}
        view="grid"
      />
    );

    const fileItem = screen.getByText('test-file.txt').closest('.file-item');
    fireEvent.contextMenu(fileItem!);

    expect(onContextMenuMock).toHaveBeenCalledTimes(1);
    expect(onContextMenuMock).toHaveBeenCalledWith(expect.anything(), mockFile);
  });

  it('has appropriate ARIA attributes for accessibility', async () => {
    await checkA11y(
      <FileItem
        file={mockFile}
        selected={false}
        onSelect={onSelectMock}
        view="grid"
      />
    );
  });
});