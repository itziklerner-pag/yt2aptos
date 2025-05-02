import { 
  getFileItemAriaAttributes,
  getFileExplorerAriaAttributes,
  getOperationAriaAttributes,
  skipLinkTargets
} from '../a11y';

describe('Accessibility Utilities', () => {
  describe('getFileItemAriaAttributes', () => {
    it('generates correct attributes for a file', () => {
      const file = {
        name: 'test.txt',
        type: 'text',
        starred: false,
        shared: false
      };
      
      const attrs = getFileItemAriaAttributes(file, true, false);
      
      expect(attrs).toEqual({
        role: 'listitem',
        'aria-label': 'test.txt, file',
        'aria-selected': true,
        'aria-grabbed': false,
        'aria-roledescription': 'file',
        'aria-busy': false
      });
    });
    
    it('generates correct attributes for a folder', () => {
      const folder = {
        name: 'Documents',
        type: 'folder',
        starred: true,
        shared: true
      };
      
      const attrs = getFileItemAriaAttributes(folder);
      
      expect(attrs).toEqual({
        role: 'listitem',
        'aria-label': 'Documents, folder, starred, shared',
        'aria-selected': false,
        'aria-grabbed': false,
        'aria-roledescription': 'folder',
        'aria-busy': false
      });
    });
  });
  
  describe('getFileExplorerAriaAttributes', () => {
    it('generates correct attributes with no selections', () => {
      const attrs = getFileExplorerAriaAttributes('/Documents', 5);
      
      expect(attrs).toEqual({
        role: 'region',
        'aria-label': 'File explorer, /Documents',
        'aria-description': 'Contains 5 items',
        'aria-busy': false
      });
    });
    
    it('generates correct attributes with selections', () => {
      const attrs = getFileExplorerAriaAttributes('/Documents/Work', 10, 3);
      
      expect(attrs).toEqual({
        role: 'region',
        'aria-label': 'File explorer, /Documents/Work',
        'aria-description': 'Contains 10 items, 3 selected',
        'aria-busy': false
      });
    });
  });
  
  describe('getOperationAriaAttributes', () => {
    it('generates basic attributes for an operation', () => {
      const attrs = getOperationAriaAttributes('upload');
      
      expect(attrs).toEqual({
        'aria-label': 'upload operation',
        'aria-live': 'off',
        'aria-busy': false
      });
    });
    
    it('generates attributes for an in-progress operation', () => {
      const attrs = getOperationAriaAttributes('download', true);
      
      expect(attrs).toEqual({
        'aria-label': 'download operation, in progress',
        'aria-live': 'polite',
        'aria-busy': true
      });
    });
    
    it('generates attributes for an operation with progress', () => {
      const attrs = getOperationAriaAttributes('copy', true, 75);
      
      expect(attrs).toEqual({
        'aria-label': 'copy operation, 75% complete',
        'aria-live': 'polite',
        'aria-busy': true,
        'aria-valuenow': 75,
        'aria-valuemin': 0,
        'aria-valuemax': 100
      });
    });
  });
  
  describe('skipLinkTargets', () => {
    it('defines all necessary targets for keyboard navigation', () => {
      expect(skipLinkTargets).toHaveProperty('main');
      expect(skipLinkTargets).toHaveProperty('fileExplorer');
      expect(skipLinkTargets).toHaveProperty('fileOperations');
      expect(skipLinkTargets).toHaveProperty('navigation');
    });
  });
});