# AptosFS User Guide

Welcome to AptosFS, your decentralized file system built on the Aptos blockchain. This guide will help you understand how to use AptosFS effectively to manage, store, and share your files.

## Table of Contents

- [Getting Started](#getting-started)
- [Interface Overview](#interface-overview)
- [File Management](#file-management)
- [Sharing and Collaboration](#sharing-and-collaboration)
- [Security and Privacy](#security-and-privacy)
- [Advanced Features](#advanced-features)
- [Troubleshooting](#troubleshooting)
- [Keyboard Shortcuts](#keyboard-shortcuts)

## Getting Started

### Creating an Account

1. Navigate to the AptosFS login page
2. Click on "Register" to create a new account
3. You can register using:
   - Email and password
   - Connect your Aptos wallet (recommended for enhanced security)
4. Follow the on-screen instructions to complete your registration
5. Verify your email if you registered with an email address

### Logging In

1. Navigate to the AptosFS login page
2. Enter your credentials or click "Connect Wallet"
3. If using a wallet, you'll be prompted to sign a message to verify ownership
4. Once authenticated, you'll be redirected to your AptosFS dashboard

### Initial Setup

When you first log in, we recommend:

1. Configure your profile settings
2. Set up your preferred theme (light/dark)
3. Add any favorite folders for quick access
4. Review your storage quota and usage

## Interface Overview

The AptosFS interface consists of several key areas:

### Main Layout

![AptosFS Interface Overview](../assets/interface-overview.png)

1. **Top Menu Bar**: Access global actions and settings
2. **Sidebar**: Navigation, favorites, and storage information
3. **Workspace**: Main content area showing your files and folders
4. **Status Bar**: View operations progress and system status

### View Modes

AptosFS offers two primary view modes:

#### Grid View

- Displays files and folders as thumbnail icons
- Great for visual browsing and media files
- Adjust thumbnail size with the slider in the view options

#### List View

- Displays files and folders in a detailed list format
- Shows additional metadata like size, modification date, and owner
- Allows for sorting by different columns

## File Management

### Navigating Folders

- **Open a folder**: Double-click on the folder
- **Navigate up**: Click the "Up" button in the path bar or press Backspace
- **Path bar**: Click on any segment in the path to jump to that location
- **History**: Use the back and forward buttons to navigate through your browsing history

### Creating Files and Folders

1. Click the "+" button in the toolbar or right-click in empty space
2. Select "New Folder" or the type of file you want to create
3. Enter a name for the new item
4. Press Enter or click "Create"

### Uploading Files

There are several ways to upload files:

1. **Drag and Drop**: Drag files from your computer directly into the AptosFS window
2. **Upload Button**: Click the "Upload" button in the toolbar
3. **Upload Area**: Drag files to the dedicated upload area at the bottom of the screen
4. **Right-click Menu**: Right-click in empty space and select "Upload Files"

For large files:
- Progress is shown in the status bar
- Uploads can be paused and resumed
- The application can be closed and uploads will continue in the background

### Downloading Files

To download files to your local device:

1. Select one or more files
2. Click the "Download" button in the toolbar
3. Alternatively, right-click and select "Download"
4. For multiple files, they will be bundled as a zip archive

### Managing Files

#### Selecting Files
- **Single selection**: Click on a file
- **Multiple selection**: Ctrl+Click (Cmd+Click on Mac) for non-adjacent files
- **Range selection**: Shift+Click to select a range
- **Select all**: Ctrl+A (Cmd+A on Mac)

#### Moving and Copying
1. Select the file(s) you want to move or copy
2. For **Move**: 
   - Click "Cut" in the toolbar or press Ctrl+X (Cmd+X on Mac)
   - Navigate to the destination folder
   - Click "Paste" or press Ctrl+V (Cmd+V on Mac)
3. For **Copy**:
   - Click "Copy" in the toolbar or press Ctrl+C (Cmd+C on Mac)
   - Navigate to the destination folder
   - Click "Paste" or press Ctrl+V (Cmd+V on Mac)

You can also drag and drop files to move them between folders that are visible in the interface.

#### Renaming

1. Select the file or folder
2. Press F2, click "Rename" in the toolbar, or right-click and select "Rename"
3. Enter the new name
4. Press Enter to confirm

#### Deleting

1. Select the file(s) or folder(s)
2. Press Delete or click the "Delete" button in the toolbar
3. Confirm the deletion when prompted
4. Files are moved to the Trash folder and can be recovered until the trash is emptied

#### Empty Trash

1. Click on the "Trash" folder in the sidebar
2. Click "Empty Trash" in the toolbar
3. Confirm the permanent deletion

## Sharing and Collaboration

### Sharing Files and Folders

1. Select the file or folder you want to share
2. Click the "Share" button in the toolbar or right-click and select "Share"
3. In the sharing dialog, you can:
   - Create a public link
   - Set permissions (view, edit, etc.)
   - Add specific users by email or wallet address
   - Set expiration dates for shared links

### Managing Shared Items

1. Click the "Shared" section in the sidebar
2. Here you can see:
   - Items shared with you
   - Items you've shared with others
3. For items you've shared, you can:
   - View who has access
   - Change permissions
   - Remove access
   - See access logs

### Collaborative Editing

For compatible file types:

1. Open the file by double-clicking
2. Multiple users with edit permissions can work on the file simultaneously
3. Changes are synced in real-time
4. User avatars show who is currently viewing or editing

## Security and Privacy

### Encryption

- All files are encrypted by default
- End-to-end encryption ensures only you and those you share with can access content
- Blockchain-based verification ensures file integrity

### Access Control

1. Click on a file or folder and select "Properties"
2. Navigate to the "Permissions" tab
3. Here you can set:
   - Owner-only access
   - Specific user access
   - Public access (with various permission levels)
   - Password protection for shared links

### Security Log

1. Go to "Settings" in the top menu bar
2. Select "Security" from the sidebar
3. View a complete log of:
   - Login attempts
   - File access events
   - Permission changes
   - Security-related notifications

## Advanced Features

### Versioning

AptosFS maintains version history for your files:

1. Right-click on a file and select "Version History"
2. View all previous versions with timestamps and authors
3. Preview any version
4. Restore a previous version if needed
5. Compare different versions

### Tags and Metadata

Organize your files with custom tags and metadata:

1. Select a file or multiple files
2. Click "Tags" in the toolbar or right-click and select "Tags"
3. Add existing tags or create new ones
4. Add custom metadata fields like:
   - Categories
   - Projects
   - Status
   - Custom attributes

### Smart Folders

Create dynamic folders based on search criteria:

1. Click "New" in the toolbar and select "Smart Folder"
2. Define search criteria like:
   - File type
   - Date modified
   - Tags
   - Content
3. Name your Smart Folder
4. The folder will automatically update to include all files matching your criteria

### Automation

Set up automated workflows:

1. Go to "Settings" > "Automation"
2. Create rules for events like:
   - File uploads
   - Tag assignments
   - Sharing events
3. Configure actions such as:
   - Moving files to specific folders
   - Adding tags
   - Sending notifications
   - Converting file formats

## Troubleshooting

### Common Issues

#### Upload Failures

If your uploads are failing:

1. Check your internet connection
2. Verify the file isn't too large (current limit is 5GB per file)
3. Try breaking large uploads into smaller files
4. Use the desktop app for more reliable large uploads

#### Missing Files

If files appear to be missing:

1. Check the Trash folder
2. Use the search function with filename or content
3. Check the version history to see if it was modified
4. Review the access logs to see if anyone else modified it

#### Performance Issues

If AptosFS is running slowly:

1. Close unnecessary browser tabs
2. Clear your browser cache
3. Try using a different browser
4. Check your internet connection speed
5. For large file collections, use the desktop app for better performance

### Getting Help

If you encounter any issues:

1. Click the "Help" icon in the top menu bar
2. Check the knowledge base for solutions
3. Use the in-app chat support (available during business hours)
4. Contact support at support@aptosfs.com

## Keyboard Shortcuts

AptosFS supports many keyboard shortcuts to improve your productivity:

### Navigation

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Navigate up one level | Backspace | Cmd+↑ |
| Back to previous folder | Alt+← | Cmd+[ |
| Forward to next folder | Alt+→ | Cmd+] |
| Open selected item | Enter | Enter |
| Refresh | F5 | Cmd+R |

### Selection

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Select all | Ctrl+A | Cmd+A |
| Invert selection | Ctrl+I | Cmd+I |
| Select multiple items | Ctrl+Click | Cmd+Click |
| Range select | Shift+Click | Shift+Click |

### File Operations

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Copy | Ctrl+C | Cmd+C |
| Cut | Ctrl+X | Cmd+X |
| Paste | Ctrl+V | Cmd+V |
| Delete | Delete | Delete |
| Rename | F2 | Enter |
| Create new folder | Ctrl+Shift+N | Cmd+Shift+N |
| Upload files | Ctrl+U | Cmd+U |
| Download selected | Ctrl+D | Cmd+D |
| Search | Ctrl+F | Cmd+F |

### View

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Toggle view mode | Ctrl+Alt+1 | Cmd+Option+1 |
| Sort by name | Ctrl+Alt+N | Cmd+Option+N |
| Sort by date | Ctrl+Alt+D | Cmd+Option+D |
| Sort by size | Ctrl+Alt+S | Cmd+Option+S |
| Show/hide hidden files | Ctrl+H | Cmd+H |