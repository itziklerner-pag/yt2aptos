# AptosFS Integration Guide

This guide provides comprehensive information for developers who want to integrate with AptosFS. It covers authentication methods, API endpoints, storage provider configuration, and blockchain integration.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [REST API Integration](#rest-api-integration)
- [Storage Provider Integration](#storage-provider-integration)
- [Blockchain Integration](#blockchain-integration)
- [Webhooks and Events](#webhooks-and-events)
- [Security Best Practices](#security-best-practices)
- [Rate Limiting and Quotas](#rate-limiting-and-quotas)
- [SDKs and Libraries](#sdks-and-libraries)
- [Examples](#examples)

## Overview

AptosFS provides several integration points:

1. **REST API**: HTTP-based API for file operations and management
2. **Storage Providers**: Interfaces for implementing custom storage backends
3. **Blockchain Integration**: Direct interaction with Aptos blockchain for advanced use cases
4. **Webhooks**: Event subscription system for real-time updates

## Authentication

AptosFS supports multiple authentication methods:

### API Key Authentication

For server-to-server integration:

```bash
# Example API request with key authentication
curl -X GET https://api.aptosfs.com/v1/files \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

To obtain an API key:
1. Log in to your AptosFS account
2. Navigate to Settings > Developer
3. Generate a new API key
4. Set appropriate permissions and expiration

### OAuth 2.0

For applications acting on behalf of users:

1. Register your application in the AptosFS Developer Portal
2. Implement the OAuth 2.0 authorization flow:

```javascript
// Example OAuth 2.0 authorization flow
const authUrl = 'https://aptosfs.com/oauth/authorize';
const tokenUrl = 'https://aptosfs.com/oauth/token';

// Step 1: Redirect user to authorization page
const authRedirect = `${authUrl}?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=files.read files.write`;

// Step 2: Exchange authorization code for access token
async function getToken(authorizationCode) {
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: authorizationCode,
      client_id: 'YOUR_CLIENT_ID',
      client_secret: 'YOUR_CLIENT_SECRET',
      redirect_uri: 'YOUR_REDIRECT_URI'
    })
  });
  
  return await response.json();
  // Returns: { access_token, refresh_token, expires_in, token_type, scope }
}
```

### Wallet Authentication

For dApps and blockchain-focused integrations:

```javascript
// Example of wallet authentication
async function connectWallet() {
  // Check if AptosWallet is available
  if (window.aptosWallet) {
    try {
      // Request account access
      const accounts = await window.aptosWallet.connect();
      const address = accounts[0];
      
      // Get authentication challenge
      const response = await fetch('https://api.aptosfs.com/v1/auth/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });
      
      const { challenge } = await response.json();
      
      // Sign the challenge
      const signature = await window.aptosWallet.signMessage({
        address,
        message: challenge
      });
      
      // Verify signature and get token
      const authResponse = await fetch('https://api.aptosfs.com/v1/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature })
      });
      
      const { token } = await authResponse.json();
      
      return token;
    } catch (error) {
      console.error('Wallet authentication failed:', error);
    }
  }
}
```

## REST API Integration

AptosFS provides a comprehensive REST API for file operations.

### Base URL

```
https://api.aptosfs.com/v1
```

### Endpoints

#### File Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/files` | List files in a directory |
| GET | `/files/{id}` | Get file metadata |
| POST | `/files` | Upload a new file |
| PUT | `/files/{id}` | Update file content or metadata |
| DELETE | `/files/{id}` | Delete a file |
| POST | `/files/{id}/copy` | Copy a file |
| POST | `/files/{id}/move` | Move a file |

#### Folder Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/folders` | List root folders |
| GET | `/folders/{id}` | Get folder contents |
| POST | `/folders` | Create a new folder |
| PUT | `/folders/{id}` | Update folder metadata |
| DELETE | `/folders/{id}` | Delete a folder |

#### Sharing and Permissions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/shares` | List shared items |
| POST | `/shares` | Create a new share |
| GET | `/shares/{id}` | Get share details |
| PUT | `/shares/{id}` | Update share settings |
| DELETE | `/shares/{id}` | Delete a share |

### Example Requests

#### Listing Files

```javascript
// Example: Listing files in a directory
async function listFiles(folderId = 'root', options = {}) {
  const queryParams = new URLSearchParams({
    limit: options.limit || 100,
    offset: options.offset || 0,
    sort: options.sort || 'name',
    order: options.order || 'asc',
    ...options.filters
  });
  
  const response = await fetch(`https://api.aptosfs.com/v1/folders/${folderId}?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
}
```

#### Uploading Files

```javascript
// Example: Uploading a file
async function uploadFile(file, folderId = 'root', options = {}) {
  // For small files: direct upload
  if (file.size < 10 * 1024 * 1024) { // Less than 10MB
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder_id', folderId);
    
    if (options.name) formData.append('name', options.name);
    if (options.description) formData.append('description', options.description);
    
    const response = await fetch('https://api.aptosfs.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: formData
    });
    
    return await response.json();
  } 
  // For large files: chunked upload
  else {
    // Step 1: Initialize chunked upload
    const initResponse = await fetch('https://api.aptosfs.com/v1/files/chunked', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        folder_id: folderId,
        name: options.name || file.name,
        size: file.size,
        description: options.description || ''
      })
    });
    
    const { upload_id, chunk_size } = await initResponse.json();
    
    // Step 2: Upload chunks
    const chunks = Math.ceil(file.size / chunk_size);
    for (let i = 0; i < chunks; i++) {
      const start = i * chunk_size;
      const end = Math.min(file.size, start + chunk_size);
      const chunk = file.slice(start, end);
      
      const chunkFormData = new FormData();
      chunkFormData.append('file', chunk, 'chunk');
      
      await fetch(`https://api.aptosfs.com/v1/files/chunked/${upload_id}/${i}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: chunkFormData
      });
    }
    
    // Step 3: Complete upload
    const completeResponse = await fetch(`https://api.aptosfs.com/v1/files/chunked/${upload_id}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    return await completeResponse.json();
  }
}
```

## Storage Provider Integration

AptosFS supports custom storage provider integration.

### Storage Provider Interface

To implement a custom storage provider, you must implement the `StorageProvider` interface:

```typescript
interface StorageProvider {
  // Provider information
  getId(): string;
  getName(): string;
  getType(): string;
  
  // Core operations
  initialize(config: ProviderConfig): Promise<boolean>;
  uploadFile(file: File | Buffer, path: string, options?: UploadOptions): Promise<FileUploadResult>;
  downloadFile(filePath: string, options?: DownloadOptions): Promise<Blob | Buffer>;
  deleteFile(filePath: string): Promise<boolean>;
  
  // Directory operations
  createDirectory(path: string): Promise<boolean>;
  listDirectory(path: string): Promise<FileItem[]>;
  deleteDirectory(path: string, recursive?: boolean): Promise<boolean>;
  
  // Metadata operations
  getMetadata(path: string): Promise<FileMetadata>;
  updateMetadata(path: string, metadata: Partial<FileMetadata>): Promise<FileMetadata>;
  
  // Advanced operations
  moveFile(sourcePath: string, destinationPath: string): Promise<boolean>;
  copyFile(sourcePath: string, destinationPath: string): Promise<boolean>;
  getPublicUrl(path: string, expiration?: number): Promise<string>;
}
```

### Registering a Custom Provider

Once implemented, register your provider with the AptosFS provider factory:

```typescript
import { StorageProviderFactory } from '@aptosfs/core';
import { MyCustomProvider } from './my-custom-provider';

// Register the provider
StorageProviderFactory.registerProvider('custom-provider', MyCustomProvider);

// Initialize the provider with configuration
const providerConfig = {
  credentials: {
    apiKey: 'YOUR_API_KEY',
    // Other credentials as needed
  },
  region: 'us-west-2',
  bucket: 'my-storage-bucket',
  // Other configuration options
};

const provider = await StorageProviderFactory.createProvider('custom-provider', providerConfig);
```

### Example: S3-Compatible Provider

```typescript
import { StorageProvider, ProviderConfig, FileItem, FileMetadata } from '@aptosfs/core';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export class S3Provider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private baseDirectory: string;
  
  async initialize(config: ProviderConfig): Promise<boolean> {
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.credentials.accessKey,
        secretAccessKey: config.credentials.secretKey
      }
    });
    
    this.bucket = config.bucket;
    this.baseDirectory = config.baseDirectory || '';
    
    // Validate connection and bucket existence
    try {
      await this.client.send(/* ... */);
      return true;
    } catch (error) {
      console.error('Failed to initialize S3 provider:', error);
      return false;
    }
  }
  
  async uploadFile(file: File | Buffer, path: string, options?: UploadOptions): Promise<FileUploadResult> {
    const fullPath = this.getFullPath(path);
    
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fullPath,
        Body: file,
        ContentType: options?.contentType || 'application/octet-stream',
        Metadata: options?.metadata
      });
      
      await this.client.send(command);
      
      return {
        success: true,
        path: path,
        size: file instanceof File ? file.size : Buffer.byteLength(file),
        metadata: {
          contentType: options?.contentType || 'application/octet-stream',
          ...options?.metadata
        }
      };
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }
  
  // Implement remaining methods...
}
```

## Blockchain Integration

AptosFS integrates with the Aptos blockchain for secure content verification and ownership.

### Smart Contract Interfaces

AptosFS uses several smart contracts for blockchain integration:

#### File Registry Contract

```move
module AptosFS::Registry {
  struct FileRecord has key, store {
    owner: address,
    file_hash: vector<u8>,
    metadata_hash: vector<u8>,
    creation_time: u64,
    update_time: u64,
    is_deleted: bool,
  }
  
  public entry fun register_file(
    account: &signer,
    file_hash: vector<u8>,
    metadata_hash: vector<u8>,
  ) {
    // Implementation details
  }
  
  public entry fun update_file(
    account: &signer,
    file_id: u64,
    file_hash: vector<u8>,
    metadata_hash: vector<u8>,
  ) {
    // Implementation details
  }
  
  public entry fun delete_file(
    account: &signer,
    file_id: u64,
  ) {
    // Implementation details
  }
  
  // Other methods...
}
```

### Interacting with Blockchain

```javascript
// Example of registering a file on the blockchain
import { AptosClient, AptosAccount, HexString, Types } from "aptos";

async function registerFileOnBlockchain(account, fileHash, metadataHash) {
  const client = new AptosClient("https://fullnode.mainnet.aptoslabs.com/v1");
  
  const transaction = {
    function: "0x1::aptosfs_registry::register_file",
    type_arguments: [],
    arguments: [
      fileHash, // Hex string of file hash
      metadataHash // Hex string of metadata hash
    ]
  };
  
  const rawTx = await client.generateTransaction(account.address(), transaction);
  const signedTx = await client.signTransaction(account, rawTx);
  const pendingTx = await client.submitTransaction(signedTx);
  
  return await client.waitForTransaction(pendingTx.hash);
}
```

### Verifying File Authenticity

```javascript
// Example of verifying file authenticity
async function verifyFile(fileId, fileHash) {
  const client = new AptosClient("https://fullnode.mainnet.aptoslabs.com/v1");
  
  // Retrieve file record from blockchain
  const resource = await client.getAccountResource(
    "0x1", // Registry contract address
    "0x1::aptosfs_registry::FileRegistry"
  );
  
  const fileRecords = resource.data.file_records;
  const record = fileRecords.find(r => r.id === fileId);
  
  if (!record) {
    return { verified: false, reason: "File not found on blockchain" };
  }
  
  // Verify file hash matches
  if (record.file_hash !== fileHash) {
    return { verified: false, reason: "File hash mismatch" };
  }
  
  return {
    verified: true,
    owner: record.owner,
    creationTime: record.creation_time,
    updateTime: record.update_time
  };
}
```

## Webhooks and Events

AptosFS provides a webhook system for real-time event notifications.

### Available Events

| Event Type | Description |
|------------|-------------|
| `file.created` | A new file has been created |
| `file.updated` | A file's content or metadata has been updated |
| `file.deleted` | A file has been deleted |
| `folder.created` | A new folder has been created |
| `folder.updated` | A folder's metadata has been updated |
| `folder.deleted` | A folder has been deleted |
| `share.created` | A new share has been created |
| `share.updated` | A share's settings have been updated |
| `share.deleted` | A share has been deleted |

### Registering Webhooks

```javascript
// Example of registering a webhook
async function registerWebhook(eventTypes, url, secret) {
  const response = await fetch('https://api.aptosfs.com/v1/webhooks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      event_types: eventTypes, // Array of event types to subscribe to
      target_url: url, // Your endpoint to receive webhook events
      secret: secret, // Secret for verifying webhook payload
      description: 'File update notifications'
    })
  });
  
  return await response.json();
}
```

### Webhook Payload Example

```json
{
  "id": "evt_1234567890",
  "type": "file.updated",
  "created": "2025-05-01T13:45:30Z",
  "data": {
    "file_id": "file_9876543210",
    "name": "important-document.pdf",
    "path": "/Documents/Projects/",
    "size": 1258000,
    "updated_by": "user_1122334455",
    "previous_version_id": "ver_1234567890"
  }
}
```

### Verifying Webhooks

```javascript
// Example of verifying webhook signature
import crypto from 'crypto';

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

## Security Best Practices

When integrating with AptosFS, follow these security best practices:

### API Key Management

- Store API keys securely, never in client-side code
- Use environment variables or secure key management services
- Implement key rotation policies
- Set appropriate permissions for each key

### Secure Communications

- Always use HTTPS for API communication
- Validate SSL certificates
- Implement certificate pinning in mobile apps

### Data Validation

- Validate all input data before sending to the API
- Implement proper error handling for API responses
- Never trust client-side data validation

### User Authentication

- Use OAuth 2.0 with PKCE for public clients
- Implement proper token storage
- Refresh tokens securely
- Log out users properly by revoking tokens

## Rate Limiting and Quotas

AptosFS implements rate limiting and usage quotas:

### Rate Limits

| API Endpoint | Rate Limit |
|--------------|------------|
| Authentication | 10 requests per minute |
| File operations | 100 requests per minute |
| Reading operations | 300 requests per minute |
| List operations | 50 requests per minute |

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1619194322
```

### Storage Quotas

Storage limits depend on your subscription:

| Plan | Storage Limit | File Size Limit | API Requests |
|------|--------------|----------------|--------------|
| Free | 5 GB | 100 MB | 1,000 / day |
| Basic | 100 GB | 1 GB | 10,000 / day |
| Pro | 1 TB | 10 GB | 100,000 / day |
| Enterprise | Custom | Custom | Custom |

## SDKs and Libraries

AptosFS provides official SDKs for various platforms:

### JavaScript/TypeScript SDK

```bash
npm install @aptosfs/sdk
```

```javascript
import { AptosFS } from '@aptosfs/sdk';

// Initialize with API key
const aptosfs = new AptosFS({
  apiKey: 'YOUR_API_KEY'
});

// Or initialize with OAuth token
const aptosfs = new AptosFS({
  accessToken: 'USER_ACCESS_TOKEN'
});

// Use the SDK
async function example() {
  // List files
  const files = await aptosfs.files.list({
    folderId: 'folder_123',
    limit: 100
  });
  
  // Upload a file
  const uploadResult = await aptosfs.files.upload(fileObject, {
    folderId: 'folder_123',
    name: 'document.pdf',
    onProgress: (progress) => console.log(`${progress}% complete`)
  });
  
  // Download a file
  const fileBlob = await aptosfs.files.download('file_456');
}
```

### Other SDKs

- [Python SDK](https://github.com/aptosfs/python-sdk)
- [Java SDK](https://github.com/aptosfs/java-sdk)
- [Go SDK](https://github.com/aptosfs/go-sdk)
- [Swift SDK](https://github.com/aptosfs/swift-sdk)

## Examples

### Basic File Manager

```javascript
import { AptosFS } from '@aptosfs/sdk';

class SimpleFileManager {
  constructor(apiKey) {
    this.client = new AptosFS({ apiKey });
  }
  
  async listFolder(folderId = 'root') {
    try {
      const result = await this.client.folders.list(folderId);
      return {
        folders: result.folders,
        files: result.files
      };
    } catch (error) {
      console.error('Failed to list folder:', error);
      throw error;
    }
  }
  
  async uploadFile(file, folderId = 'root', onProgress) {
    try {
      return await this.client.files.upload(file, {
        folderId,
        onProgress
      });
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }
  
  async downloadFile(fileId) {
    try {
      const file = await this.client.files.download(fileId);
      return file;
    } catch (error) {
      console.error('Failed to download file:', error);
      throw error;
    }
  }
  
  async deleteItem(id, isFolder = false) {
    try {
      if (isFolder) {
        return await this.client.folders.delete(id);
      } else {
        return await this.client.files.delete(id);
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      throw error;
    }
  }
  
  async createFolder(name, parentId = 'root') {
    try {
      return await this.client.folders.create({
        name,
        parentId
      });
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  }
  
  async shareItem(id, isFolder = false, options = {}) {
    try {
      const shareOptions = {
        itemId: id,
        itemType: isFolder ? 'folder' : 'file',
        permission: options.permission || 'view',
        expirationDays: options.expirationDays
      };
      
      if (options.email) {
        shareOptions.email = options.email;
      } else {
        shareOptions.public = true;
      }
      
      return await this.client.shares.create(shareOptions);
    } catch (error) {
      console.error('Failed to share item:', error);
      throw error;
    }
  }
}

// Usage
const fileManager = new SimpleFileManager('YOUR_API_KEY');

// List root folder
const rootContents = await fileManager.listFolder();
console.log('Files:', rootContents.files);

// Upload a file with progress tracking
const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    await fileManager.uploadFile(
      file, 
      'folder_123',
      (progress) => {
        console.log(`Upload progress: ${progress}%`);
      }
    );
  }
});
```

### Blockchain Verification Tool

```javascript
import { AptosFS } from '@aptosfs/sdk';
import { AptosClient } from 'aptos';

class BlockchainVerifier {
  constructor(apiKey, aptosNodeUrl = 'https://fullnode.mainnet.aptoslabs.com/v1') {
    this.client = new AptosFS({ apiKey });
    this.aptosClient = new AptosClient(aptosNodeUrl);
  }
  
  async verifyFile(fileId) {
    try {
      // Step 1: Get file metadata from AptosFS
      const file = await this.client.files.get(fileId);
      
      // Step 2: Get blockchain record
      const result = await this.aptosClient.view({
        function: '0x1::aptosfs_registry::get_file_record',
        type_arguments: [],
        arguments: [file.blockchain_id]
      });
      
      // Step 3: Compare hashes
      if (!result || !result.file_hash) {
        return {
          verified: false,
          reason: 'File not found on blockchain'
        };
      }
      
      if (result.file_hash !== file.hash) {
        return {
          verified: false,
          reason: 'File hash mismatch'
        };
      }
      
      // Step 4: Return verification result
      return {
        verified: true,
        registeredBy: result.owner,
        registeredAt: new Date(Number(result.creation_time) * 1000),
        lastUpdated: new Date(Number(result.update_time) * 1000),
        transactionId: result.transaction_id
      };
    } catch (error) {
      console.error('Verification failed:', error);
      return {
        verified: false,
        reason: `Verification error: ${error.message}`
      };
    }
  }
}