import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
export type HelpTopic = {
  id: string;
  title: string;
  content: ReactNode;
  relatedTopics?: string[];
};

export type HelpContextType = {
  showHelp: (topicId: string) => void;
  hideHelp: () => void;
  isHelpVisible: boolean;
  currentTopic: HelpTopic | null;
  allTopics: HelpTopic[];
};

// Help context
const HelpContext = createContext<HelpContextType | undefined>(undefined);

// Help topics database
const helpTopics: HelpTopic[] = [
  {
    id: 'file-upload',
    title: 'Uploading Files',
    content: (
      <div>
        <h3>Uploading Files</h3>
        <p>There are several ways to upload files to AptosFS:</p>
        <ul>
          <li><strong>Drag and Drop:</strong> Drag files from your computer directly into the AptosFS window.</li>
          <li><strong>Upload Button:</strong> Click the "Upload" button in the toolbar.</li>
          <li><strong>Upload Area:</strong> Use the dedicated upload area at the bottom of the screen.</li>
          <li><strong>Right-click Menu:</strong> Right-click in empty space and select "Upload Files".</li>
        </ul>
        <p>For large files, you can track progress in the status bar. Uploads can be paused and resumed as needed.</p>
      </div>
    ),
    relatedTopics: ['file-download', 'file-management']
  },
  {
    id: 'file-download',
    title: 'Downloading Files',
    content: (
      <div>
        <h3>Downloading Files</h3>
        <p>To download files from AptosFS:</p>
        <ul>
          <li>Select one or more files you want to download.</li>
          <li>Click the "Download" button in the toolbar or press Ctrl+D (Cmd+D on Mac).</li>
          <li>Alternatively, right-click on files and select "Download".</li>
        </ul>
        <p>When downloading multiple files, they will be bundled as a ZIP archive.</p>
      </div>
    ),
    relatedTopics: ['file-upload', 'file-management']
  },
  {
    id: 'file-management',
    title: 'Managing Files',
    content: (
      <div>
        <h3>Managing Files</h3>
        <p>AptosFS provides comprehensive file management capabilities:</p>
        <h4>Selecting Files</h4>
        <ul>
          <li><strong>Single selection:</strong> Click on a file</li>
          <li><strong>Multiple selection:</strong> Ctrl+Click (Cmd+Click on Mac) for non-adjacent files</li>
          <li><strong>Range selection:</strong> Shift+Click to select a range</li>
          <li><strong>Select all:</strong> Ctrl+A (Cmd+A on Mac)</li>
        </ul>
        <h4>Moving and Copying</h4>
        <p>Use cut (Ctrl+X), copy (Ctrl+C), and paste (Ctrl+V) operations to manage files across folders.</p>
        <h4>Other Operations</h4>
        <ul>
          <li>Rename files by pressing F2 or selecting "Rename" from the context menu</li>
          <li>Delete files by pressing Delete or selecting "Delete" from the context menu</li>
          <li>View file properties by selecting "Properties" from the context menu</li>
        </ul>
      </div>
    ),
    relatedTopics: ['file-upload', 'file-download', 'file-sharing']
  },
  {
    id: 'file-sharing',
    title: 'Sharing Files',
    content: (
      <div>
        <h3>Sharing Files and Folders</h3>
        <p>To share files or folders with others:</p>
        <ol>
          <li>Select the file or folder you want to share</li>
          <li>Click the "Share" button in the toolbar or right-click and select "Share"</li>
          <li>In the sharing dialog, you can:
            <ul>
              <li>Create a public link</li>
              <li>Set permissions (view, edit, etc.)</li>
              <li>Add specific users by email or wallet address</li>
              <li>Set expiration dates for shared links</li>
              <li>Protect shared links with passwords</li>
            </ul>
          </li>
        </ol>
        <p>You can view and manage your shared items in the "Shared" section of the sidebar.</p>
      </div>
    ),
    relatedTopics: ['file-management', 'security']
  },
  {
    id: 'security',
    title: 'Security and Privacy',
    content: (
      <div>
        <h3>Security and Privacy</h3>
        <p>AptosFS prioritizes the security of your files:</p>
        <h4>Encryption</h4>
        <p>All files are encrypted by default with end-to-end encryption ensuring only you and those you share with can access content.</p>
        <h4>Blockchain Verification</h4>
        <p>Files can be verified on the Aptos blockchain to ensure authenticity and integrity.</p>
        <h4>Access Control</h4>
        <p>You can set granular permissions for shared files and folders, controlling exactly who can view or edit your content.</p>
        <h4>Security Log</h4>
        <p>View security events including login attempts, file access, and permission changes in Settings > Security.</p>
      </div>
    ),
    relatedTopics: ['file-sharing', 'blockchain-integration']
  },
  {
    id: 'blockchain-integration',
    title: 'Blockchain Integration',
    content: (
      <div>
        <h3>Blockchain Integration</h3>
        <p>AptosFS leverages the Aptos blockchain for enhanced security and verification:</p>
        <h4>File Verification</h4>
        <p>Files can be verified on the blockchain to ensure they haven't been tampered with.</p>
        <h4>Ownership Proof</h4>
        <p>Blockchain registration provides immutable proof of file ownership and creation time.</p>
        <h4>Wallet Connection</h4>
        <p>Connect your Aptos wallet for enhanced security and blockchain functionality.</p>
        <h4>Smart Contract Integration</h4>
        <p>Advanced users can interact with AptosFS smart contracts for custom integrations.</p>
      </div>
    ),
    relatedTopics: ['security', 'file-sharing']
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    content: (
      <div>
        <h3>Keyboard Shortcuts</h3>
        <h4>Navigation</h4>
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Windows/Linux</th>
              <th>macOS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Navigate up</td>
              <td>Backspace</td>
              <td>Cmd+↑</td>
            </tr>
            <tr>
              <td>Back</td>
              <td>Alt+←</td>
              <td>Cmd+[</td>
            </tr>
            <tr>
              <td>Forward</td>
              <td>Alt+→</td>
              <td>Cmd+]</td>
            </tr>
            <tr>
              <td>Refresh</td>
              <td>F5</td>
              <td>Cmd+R</td>
            </tr>
          </tbody>
        </table>
        
        <h4>File Operations</h4>
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Windows/Linux</th>
              <th>macOS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Copy</td>
              <td>Ctrl+C</td>
              <td>Cmd+C</td>
            </tr>
            <tr>
              <td>Cut</td>
              <td>Ctrl+X</td>
              <td>Cmd+X</td>
            </tr>
            <tr>
              <td>Paste</td>
              <td>Ctrl+V</td>
              <td>Cmd+V</td>
            </tr>
            <tr>
              <td>Delete</td>
              <td>Delete</td>
              <td>Delete</td>
            </tr>
            <tr>
              <td>Rename</td>
              <td>F2</td>
              <td>Enter</td>
            </tr>
            <tr>
              <td>New Folder</td>
              <td>Ctrl+Shift+N</td>
              <td>Cmd+Shift+N</td>
            </tr>
          </tbody>
        </table>
        
        <h4>View Controls</h4>
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Windows/Linux</th>
              <th>macOS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Toggle View</td>
              <td>Ctrl+Alt+1</td>
              <td>Cmd+Option+1</td>
            </tr>
            <tr>
              <td>Sort by Name</td>
              <td>Ctrl+Alt+N</td>
              <td>Cmd+Option+N</td>
            </tr>
            <tr>
              <td>Sort by Date</td>
              <td>Ctrl+Alt+D</td>
              <td>Cmd+Option+D</td>
            </tr>
            <tr>
              <td>Sort by Size</td>
              <td>Ctrl+Alt+S</td>
              <td>Cmd+Option+S</td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
    relatedTopics: ['file-management', 'navigation']
  },
  {
    id: 'navigation',
    title: 'Navigating AptosFS',
    content: (
      <div>
        <h3>Navigating AptosFS</h3>
        <p>AptosFS provides several ways to navigate through your files and folders:</p>
        <h4>Folder Navigation</h4>
        <ul>
          <li>Double-click on folders to open them</li>
          <li>Use the "Up" button in the path bar or press Backspace to go up one level</li>
          <li>Click on any segment in the path bar to jump to that location</li>
          <li>Use Back and Forward buttons to navigate through your browsing history</li>
        </ul>
        <h4>Sidebar Navigation</h4>
        <ul>
          <li>Quick access to key locations like "Home", "Recent", and "Shared"</li>
          <li>Access your starred folders for faster navigation</li>
          <li>View folder structure in the tree view</li>
        </ul>
        <h4>Search</h4>
        <p>Use the search bar (Ctrl+F / Cmd+F) to quickly find files and folders by name or content.</p>
      </div>
    ),
    relatedTopics: ['file-management', 'keyboard-shortcuts']
  }
];

interface HelpProviderProps {
  children: ReactNode;
}

export const HelpProvider: React.FC<HelpProviderProps> = ({ children }) => {
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<HelpTopic | null>(null);

  const showHelp = (topicId: string) => {
    const topic = helpTopics.find(t => t.id === topicId);
    if (topic) {
      setCurrentTopic(topic);
      setIsHelpVisible(true);
    }
  };

  const hideHelp = () => {
    setIsHelpVisible(false);
  };

  return (
    <HelpContext.Provider
      value={{
        showHelp,
        hideHelp,
        isHelpVisible,
        currentTopic,
        allTopics: helpTopics
      }}
    >
      {children}
    </HelpContext.Provider>
  );
};

export const useHelp = (): HelpContextType => {
  const context = useContext(HelpContext);
  if (context === undefined) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
};

// HelpPanel component that displays help content
export const HelpPanel: React.FC = () => {
  const { isHelpVisible, currentTopic, hideHelp, showHelp, allTopics } = useHelp();

  if (!isHelpVisible || !currentTopic) {
    return null;
  }

  return (
    <div className="help-panel">
      <div className="help-header">
        <h2>{currentTopic.title}</h2>
        <button onClick={hideHelp} aria-label="Close help">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      
      <div className="help-content">
        {currentTopic.content}
      </div>
      
      {currentTopic.relatedTopics && currentTopic.relatedTopics.length > 0 && (
        <div className="help-related">
          <h4>Related Topics</h4>
          <ul>
            {currentTopic.relatedTopics.map(topicId => {
              const topic = allTopics.find(t => t.id === topicId);
              return topic ? (
                <li key={topicId}>
                  <button onClick={() => showHelp(topicId)}>{topic.title}</button>
                </li>
              ) : null;
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

// HelpButton component that can be placed throughout the UI
interface HelpButtonProps {
  topicId: string;
  tooltip?: string;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ topicId, tooltip = 'Help' }) => {
  const { showHelp } = useHelp();
  
  return (
    <button 
      className="help-button" 
      onClick={() => showHelp(topicId)}
      aria-label={tooltip}
      title={tooltip}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 12V8M8 5V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
};

// CSS styles for the help system
export const HelpStyles = `
.help-panel {
  position: fixed;
  right: 20px;
  top: 20px;
  width: 400px;
  max-width: calc(100vw - 40px);
  max-height: calc(100vh - 40px);
  background: var(--background-secondary);
  border-radius: 8px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.help-header h2 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.help-header button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: var(--text-tertiary);
  transition: color 0.2s;
}

.help-header button:hover {
  color: var(--text-primary);
}

.help-content {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}

.help-content h3 {
  margin-top: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.help-content h4 {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-top: 16px;
  margin-bottom: 8px;
}

.help-content p {
  margin-bottom: 12px;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
}

.help-content ul, .help-content ol {
  margin-bottom: 16px;
  padding-left: 24px;
}

.help-content li {
  margin-bottom: 8px;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
}

.help-content table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
  font-size: var(--font-size-sm);
}

.help-content table th {
  text-align: left;
  padding: 8px;
  background-color: var(--background-tertiary);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.help-content table td {
  padding: 8px;
  border-top: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.help-related {
  padding: 16px;
  border-top: 1px solid var(--border-color);
  background-color: var(--background-tertiary);
}

.help-related h4 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.help-related ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.help-related li {
  margin-bottom: 4px;
}

.help-related button {
  background: transparent;
  border: none;
  color: var(--color-primary-600);
  padding: 0;
  cursor: pointer;
  font-size: var(--font-size-sm);
  text-decoration: underline;
  transition: color 0.2s;
}

.help-related button:hover {
  color: var(--color-primary-700);
}

.help-button {
  background: transparent;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-tertiary);
  transition: color 0.2s, background-color 0.2s;
}

.help-button:hover {
  color: var(--text-primary);
  background-color: var(--background-tertiary);
}
`;

// Example usage component
export const HelpSystemExample: React.FC = () => {
  return (
    <HelpProvider>
      <div>
        <style>{HelpStyles}</style>
        
        {/* Example UI with help buttons */}
        <div style={{ padding: '20px' }}>
          <h1>AptosFS
            <HelpButton topicId="navigation" tooltip="Learn about navigation" />
          </h1>
          
          <div style={{ marginBottom: '20px' }}>
            <h2>File Management
              <HelpButton topicId="file-management" tooltip="Learn about file management" />
            </h2>
            <div>
              <button>Upload Files
                <HelpButton topicId="file-upload" tooltip="Learn about uploading files" />
              </button>
              <button>Download
                <HelpButton topicId="file-download" tooltip="Learn about downloading files" />
              </button>
              <button>Share
                <HelpButton topicId="file-sharing" tooltip="Learn about sharing files" />
              </button>
            </div>
          </div>
          
          <div>
            <h2>Security
              <HelpButton topicId="security" tooltip="Learn about security features" />
            </h2>
            <div>
              <button>Blockchain Verification
                <HelpButton topicId="blockchain-integration" tooltip="Learn about blockchain integration" />
              </button>
            </div>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <button>Keyboard Shortcuts
              <HelpButton topicId="keyboard-shortcuts" tooltip="View keyboard shortcuts" />
            </button>
          </div>
        </div>
        
        {/* The help panel will appear when a help button is clicked */}
        <HelpPanel />
      </div>
    </HelpProvider>
  );
};

export default HelpSystemExample;