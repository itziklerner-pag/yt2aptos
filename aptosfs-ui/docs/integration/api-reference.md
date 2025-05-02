# AptosFS API Reference

This document provides detailed specifications for all AptosFS REST API endpoints, including request and response formats, authentication requirements, and error codes.

## Base URL

All API endpoints are relative to:
```
https://api.aptosfs.com/v1
```

## Authentication

Most API requests require authentication. AptosFS supports the following authentication methods:

### API Key Authentication
```
Authorization: Bearer YOUR_API_KEY
```

### OAuth 2.0 Token
```
Authorization: Bearer YOUR_OAUTH_TOKEN
```

## Rate Limiting

Rate limits are indicated in the response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1619194322
```

## Error Responses

Error responses follow a consistent format:

```json
{
  "error": {
    "code": "invalid_request",
    "message": "A human-readable error message",
    "details": {
      // Additional error information (optional)
    }
  }
}
```

### Common Error Codes

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | `invalid_request` | The request was malformed or invalid |
| 401 | `unauthorized` | Authentication is required or failed |
| 403 | `forbidden` | Authenticated user lacks permission |
| 404 | `not_found` | The requested resource was not found |
| 409 | `conflict` | The request conflicts with the current state |
| 429 | `rate_limited` | Request exceeded rate limit |
| 500 | `server_error` | An internal server error occurred |

## Files API

### List Files

Retrieves a list of files, optionally filtered by folder.

**Request:**
```
GET /files
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `folder_id` | string | Optional. ID of the folder to list files from. Default: root folder |
| `limit` | integer | Optional. Maximum number of files to return. Default: 100, Max: 1000 |
| `offset` | integer | Optional. Number of files to skip. Default: 0 |
| `sort` | string | Optional. Field to sort by: name, created, modified, size. Default: name |
| `order` | string | Optional. Sort order: asc, desc. Default: asc |
| `query` | string | Optional. Search query to filter files |
| `type` | string | Optional. Filter by file type |

**Response:**
```json
{
  "items": [
    {
      "id": "file_abc123",
      "name": "document.pdf",
      "type": "pdf",
      "size": 1258000,
      "created": "2025-01-15T12:30:45Z",
      "modified": "2025-01-15T12:30:45Z",
      "owner": "user_xyz789",
      "path": "/Documents/",
      "starred": false,
      "shared": false,
      "thumbnail_url": "https://api.aptosfs.com/v1/files/file_abc123/thumbnail"
    },
    // Additional files...
  ],
  "total": 157,
  "has_more": true
}
```

### Get File Metadata

Retrieves metadata for a specific file.

**Request:**
```
GET /files/{file_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `file_id` | string | Required. The ID of the file |

**Response:**
```json
{
  "id": "file_abc123",
  "name": "document.pdf",
  "type": "pdf",
  "size": 1258000,
  "created": "2025-01-15T12:30:45Z",
  "modified": "2025-01-15T12:30:45Z",
  "owner": "user_xyz789",
  "path": "/Documents/",
  "folder_id": "folder_def456",
  "starred": false,
  "shared": false,
  "thumbnail_url": "https://api.aptosfs.com/v1/files/file_abc123/thumbnail",
  "hash": "sha256:8a1e2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f",
  "blockchain_id": "0x1a2b3c4d5e6f",
  "metadata": {
    "description": "Financial report for Q1 2025",
    "tags": ["finance", "report", "2025"],
    "custom_field": "custom value"
  }
}
```

### Upload File

Uploads a new file.

**Request:**
```
POST /files
Content-Type: multipart/form-data
```

**Form Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | file | Required. The file to upload |
| `folder_id` | string | Optional. The folder to upload to. Default: root folder |
| `name` | string | Optional. Override the file name. Default: original filename |
| `description` | string | Optional. File description |
| `tags` | string[] | Optional. Array of tags |
| `metadata` | object | Optional. Additional metadata as JSON string |

**Response:**
```json
{
  "id": "file_abc123",
  "name": "document.pdf",
  "type": "pdf",
  "size": 1258000,
  "created": "2025-05-01T15:45:30Z",
  "modified": "2025-05-01T15:45:30Z",
  "owner": "user_xyz789",
  "path": "/Documents/",
  "folder_id": "folder_def456",
  "hash": "sha256:8a1e2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f",
  "blockchain_id": "0x1a2b3c4d5e6f"
}
```

### Initialize Chunked Upload

Initializes a chunked upload for large files.

**Request:**
```
POST /files/chunked
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "large-video.mp4",
  "size": 1073741824,
  "folder_id": "folder_def456",
  "description": "Company training video",
  "tags": ["training", "video"],
  "metadata": {
    "duration": "35:42",
    "resolution": "1920x1080"
  }
}
```

**Response:**
```json
{
  "upload_id": "upload_ghi789",
  "chunk_size": 8388608,
  "expires_at": "2025-05-01T17:45:30Z"
}
```

### Upload Chunk

Uploads a single chunk of a chunked upload.

**Request:**
```
PUT /files/chunked/{upload_id}/{chunk_index}
Content-Type: multipart/form-data
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `upload_id` | string | Required. The upload ID returned from initialization |
| `chunk_index` | integer | Required. Zero-based index of the chunk |

**Form Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | file | Required. The chunk data |

**Response:**
```json
{
  "chunk_index": 0,
  "received_size": 8388608,
  "success": true
}
```

### Complete Chunked Upload

Completes a chunked upload after all chunks have been uploaded.

**Request:**
```
POST /files/chunked/{upload_id}/complete
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `upload_id` | string | Required. The upload ID returned from initialization |

**Response:**
```json
{
  "id": "file_jkl012",
  "name": "large-video.mp4",
  "type": "video",
  "size": 1073741824,
  "created": "2025-05-01T16:00:00Z",
  "modified": "2025-05-01T16:00:00Z",
  "owner": "user_xyz789",
  "path": "/Documents/",
  "folder_id": "folder_def456",
  "hash": "sha256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1",
  "blockchain_id": "0x2b3c4d5e6f7a"
}
```

### Download File

Downloads a file.

**Request:**
```
GET /files/{file_id}/content
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `file_id` | string | Required. The ID of the file to download |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `download` | boolean | Optional. Set to `true` to force download as attachment. Default: false |
| `version_id` | string | Optional. Download a specific version of the file |

**Response:**
Binary file content with appropriate Content-Type header

### Update File Metadata

Updates a file's metadata without changing its content.

**Request:**
```
PATCH /files/{file_id}
Content-Type: application/json
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `file_id` | string | Required. The ID of the file to update |

**Request Body:**
```json
{
  "name": "updated-document.pdf",
  "description": "Updated financial report for Q1 2025",
  "tags": ["finance", "report", "2025", "updated"],
  "starred": true,
  "metadata": {
    "status": "approved",
    "reviewer": "John Doe"
  }
}
```

**Response:**
```json
{
  "id": "file_abc123",
  "name": "updated-document.pdf",
  "type": "pdf",
  "size": 1258000,
  "created": "2025-01-15T12:30:45Z",
  "modified": "2025-05-01T16:15:00Z",
  "owner": "user_xyz789",
  "path": "/Documents/",
  "folder_id": "folder_def456",
  "starred": true,
  "shared": false,
  "metadata": {
    "description": "Updated financial report for Q1 2025",
    "tags": ["finance", "report", "2025", "updated"],
    "status": "approved",
    "reviewer": "John Doe"
  }
}
```

### Replace File Content

Replaces a file's content, preserving its ID and path.

**Request:**
```
PUT /files/{file_id}/content
Content-Type: multipart/form-data
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `file_id` | string | Required. The ID of the file to replace |

**Form Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | file | Required. The new file content |
| `keep_original_name` | boolean | Optional. Whether to keep original filename regardless of new file name. Default: true |

**Response:**
```json
{
  "id": "file_abc123",
  "name": "document.pdf",
  "type": "pdf",
  "size": 1458000,
  "created": "2025-01-15T12:30:45Z",
  "modified": "2025-05-01T16:30:00Z",
  "owner": "user_xyz789",
  "path": "/Documents/",
  "folder_id": "folder_def456",
  "version_id": "ver_234567",
  "previous_version_id": "ver_123456",
  "hash": "sha256:9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a",
  "blockchain_id": "0x3c4d5e6f7a8b"
}
```

### Delete File

Deletes a file, optionally moving it to trash instead of permanent deletion.

**Request:**
```
DELETE /files/{file_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `file_id` | string | Required. The ID of the file to delete |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `permanent` | boolean | Optional. Whether to permanently delete the file. Default: false (moves to trash) |

**Response:**
```json
{
  "success": true,
  "id": "file_abc123",
  "deleted_at": "2025-05-01T16:45:00Z"
}
```

### Restore File from Trash

Restores a file from trash.

**Request:**
```
POST /files/{file_id}/restore
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `file_id` | string | Required. The ID of the file to restore |

**Response:**
```json
{
  "success": true,
  "id": "file_abc123",
  "restored_at": "2025-05-01T17:00:00Z",
  "path": "/Documents/",
  "folder_id": "folder_def456"
}
```

### Get File Versions

Retrieves version history for a file.

**Request:**
```
GET /files/{file_id}/versions
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `file_id` | string | Required. The ID of the file |

**Response:**
```json
{
  "versions": [
    {
      "version_id": "ver_234567",
      "size": 1458000,
      "modified": "2025-05-01T16:30:00Z",
      "modified_by": "user_xyz789",
      "hash": "sha256:9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a",
      "blockchain_id": "0x3c4d5e6f7a8b",
      "is_current": true
    },
    {
      "version_id": "ver_123456",
      "size": 1258000,
      "modified": "2025-01-15T12:30:45Z",
      "modified_by": "user_xyz789",
      "hash": "sha256:8a1e2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f",
      "blockchain_id": "0x1a2b3c4d5e6f",
      "is_current": false
    }
  ],
  "total": 2
}
```

## Folders API

### List Folders

Retrieves a list of folders, optionally filtered by parent folder.

**Request:**
```
GET /folders
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `parent_id` | string | Optional. ID of the parent folder. Default: root folder |
| `limit` | integer | Optional. Maximum number of folders to return. Default: 100, Max: 1000 |
| `offset` | integer | Optional. Number of folders to skip. Default: 0 |
| `sort` | string | Optional. Field to sort by: name, created, modified. Default: name |
| `order` | string | Optional. Sort order: asc, desc. Default: asc |
| `query` | string | Optional. Search query to filter folders |

**Response:**
```json
{
  "items": [
    {
      "id": "folder_def456",
      "name": "Documents",
      "created": "2025-01-01T10:00:00Z",
      "modified": "2025-01-15T12:30:45Z",
      "owner": "user_xyz789",
      "path": "/",
      "parent_id": "root",
      "item_count": 15,
      "starred": true,
      "shared": false
    },
    // Additional folders...
  ],
  "total": 5,
  "has_more": false
}
```

### Create Folder

Creates a new folder.

**Request:**
```
POST /folders
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Project X",
  "parent_id": "folder_def456",
  "description": "Files related to Project X"
}
```

**Response:**
```json
{
  "id": "folder_mno345",
  "name": "Project X",
  "created": "2025-05-01T17:15:00Z",
  "modified": "2025-05-01T17:15:00Z",
  "owner": "user_xyz789",
  "path": "/Documents/",
  "parent_id": "folder_def456",
  "item_count": 0,
  "description": "Files related to Project X"
}
```

### Get Folder Content

Retrieves the contents of a folder, including both files and subfolders.

**Request:**
```
GET /folders/{folder_id}/content
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `folder_id` | string | Required. The ID of the folder |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Optional. Maximum number of items to return. Default: 100, Max: 1000 |
| `offset` | integer | Optional. Number of items to skip. Default: 0 |
| `sort` | string | Optional. Field to sort by: name, created, modified, size, type. Default: name |
| `order` | string | Optional. Sort order: asc, desc. Default: asc |
| `query` | string | Optional. Search query to filter items |
| `type` | string | Optional. Filter by file type |

**Response:**
```json
{
  "folder": {
    "id": "folder_def456",
    "name": "Documents",
    "created": "2025-01-01T10:00:00Z",
    "modified": "2025-01-15T12:30:45Z",
    "owner": "user_xyz789",
    "path": "/",
    "parent_id": "root",
    "description": "General documents"
  },
  "items": {
    "folders": [
      {
        "id": "folder_mno345",
        "name": "Project X",
        "created": "2025-05-01T17:15:00Z",
        "modified": "2025-05-01T17:15:00Z",
        "owner": "user_xyz789",
        "item_count": 0
      }
    ],
    "files": [
      {
        "id": "file_abc123",
        "name": "document.pdf",
        "type": "pdf",
        "size": 1458000,
        "created": "2025-01-15T12:30:45Z",
        "modified": "2025-05-01T16:30:00Z",
        "owner": "user_xyz789"
      }
    ]
  },
  "total": {
    "folders": 1,
    "files": 1
  },
  "has_more": false
}
```

### Update Folder

Updates a folder's metadata.

**Request:**
```
PATCH /folders/{folder_id}
Content-Type: application/json
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `folder_id` | string | Required. The ID of the folder to update |

**Request Body:**
```json
{
  "name": "Project X - 2025",
  "description": "Files related to Project X for 2025",
  "starred": true
}
```

**Response:**
```json
{
  "id": "folder_mno345",
  "name": "Project X - 2025",
  "created": "2025-05-01T17:15:00Z",
  "modified": "2025-05-01T17:30:00Z",
  "owner": "user_xyz789",
  "path": "/Documents/",
  "parent_id": "folder_def456",
  "item_count": 0,
  "description": "Files related to Project X for 2025",
  "starred": true
}
```

### Delete Folder

Deletes a folder and optionally its contents.

**Request:**
```
DELETE /folders/{folder_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `folder_id` | string | Required. The ID of the folder to delete |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `recursive` | boolean | Optional. Whether to delete contents recursively. Default: false |
| `permanent` | boolean | Optional. Whether to permanently delete. Default: false (moves to trash) |

**Response:**
```json
{
  "success": true,
  "id": "folder_mno345",
  "deleted_at": "2025-05-01T17:45:00Z"
}
```

## Shares API

### Create Share

Creates a share for a file or folder.

**Request:**
```
POST /shares
Content-Type: application/json
```

**Request Body:**
```json
{
  "item_id": "file_abc123",
  "item_type": "file",
  "permission": "view",
  "expires_at": "2025-06-01T00:00:00Z",
  "password": "optional-password",
  "recipients": [
    {
      "email": "user@example.com",
      "name": "John Doe",
      "message": "Here's the document we discussed"
    }
  ],
  "public": true
}
```

**Response:**
```json
{
  "id": "share_pqr678",
  "item_id": "file_abc123",
  "item_type": "file",
  "item_name": "document.pdf",
  "permission": "view",
  "created": "2025-05-01T18:00:00Z",
  "created_by": "user_xyz789",
  "expires_at": "2025-06-01T00:00:00Z",
  "has_password": true,
  "access_count": 0,
  "public": true,
  "share_url": "https://aptosfs.com/s/abc123def456",
  "recipients": [
    {
      "email": "user@example.com",
      "name": "John Doe",
      "status": "pending"
    }
  ]
}
```

### List Shares

Lists all shares created by the authenticated user.

**Request:**
```
GET /shares
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `item_id` | string | Optional. Filter by specific item ID |
| `item_type` | string | Optional. Filter by item type: file, folder |
| `limit` | integer | Optional. Maximum number of items to return. Default: 100, Max: 1000 |
| `offset` | integer | Optional. Number of items to skip. Default: 0 |

**Response:**
```json
{
  "items": [
    {
      "id": "share_pqr678",
      "item_id": "file_abc123",
      "item_type": "file",
      "item_name": "document.pdf",
      "permission": "view",
      "created": "2025-05-01T18:00:00Z",
      "expires_at": "2025-06-01T00:00:00Z",
      "has_password": true,
      "access_count": 0,
      "public": true,
      "share_url": "https://aptosfs.com/s/abc123def456"
    },
    // Additional shares...
  ],
  "total": 1,
  "has_more": false
}
```

### Get Share

Gets details about a specific share.

**Request:**
```
GET /shares/{share_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `share_id` | string | Required. The ID of the share |

**Response:**
```json
{
  "id": "share_pqr678",
  "item_id": "file_abc123",
  "item_type": "file",
  "item_name": "document.pdf",
  "permission": "view",
  "created": "2025-05-01T18:00:00Z",
  "created_by": "user_xyz789",
  "expires_at": "2025-06-01T00:00:00Z",
  "has_password": true,
  "access_count": 2,
  "public": true,
  "share_url": "https://aptosfs.com/s/abc123def456",
  "recipients": [
    {
      "email": "user@example.com",
      "name": "John Doe",
      "status": "accessed",
      "last_accessed": "2025-05-02T10:15:30Z"
    }
  ],
  "access_logs": [
    {
      "accessed_at": "2025-05-02T10:15:30Z",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "recipient": "user@example.com"
    },
    {
      "accessed_at": "2025-05-02T14:30:00Z",
      "ip_address": "192.168.1.2",
      "user_agent": "Mozilla/5.0..."
    }
  ]
}
```

### Update Share

Updates a share's settings.

**Request:**
```
PATCH /shares/{share_id}
Content-Type: application/json
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `share_id` | string | Required. The ID of the share to update |

**Request Body:**
```json
{
  "permission": "edit",
  "expires_at": "2025-07-01T00:00:00Z",
  "password": "new-password",
  "public": false
}
```

**Response:**
```json
{
  "id": "share_pqr678",
  "item_id": "file_abc123",
  "item_type": "file",
  "item_name": "document.pdf",
  "permission": "edit",
  "created": "2025-05-01T18:00:00Z",
  "updated": "2025-05-02T15:00:00Z",
  "created_by": "user_xyz789",
  "expires_at": "2025-07-01T00:00:00Z",
  "has_password": true,
  "access_count": 2,
  "public": false,
  "share_url": "https://aptosfs.com/s/abc123def456"
}
```

### Delete Share

Deletes a share.

**Request:**
```
DELETE /shares/{share_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `share_id` | string | Required. The ID of the share to delete |

**Response:**
```json
{
  "success": true,
  "id": "share_pqr678",
  "deleted_at": "2025-05-02T15:15:00Z"
}
```

## User API

### Get Current User

Gets information about the currently authenticated user.

**Request:**
```
GET /user
```

**Response:**
```json
{
  "id": "user_xyz789",
  "email": "you@example.com",
  "name": "Your Name",
  "created": "2025-01-01T00:00:00Z",
  "storage": {
    "used": 2500000000,
    "total": 10737418240,
    "percent_used": 23.28
  },
  "wallet_address": "0x4d5e6f7a8b9c",
  "plan": {
    "name": "Pro",
    "storage_limit": 10737418240,
    "file_size_limit": 10737418240,
    "api_requests_limit": 100000
  }
}
```

### Get User Storage Usage

Gets detailed storage usage information.

**Request:**
```
GET /user/storage
```

**Response:**
```json
{
  "total": {
    "used": 2500000000,
    "total": 10737418240,
    "percent_used": 23.28
  },
  "by_type": {
    "document": 500000000,
    "image": 800000000,
    "video": 1000000000,
    "audio": 200000000,
    "other": 0
  },
  "by_folder": [
    {
      "id": "folder_def456",
      "name": "Documents",
      "size": 1500000000
    },
    {
      "id": "folder_mno345",
      "name": "Project X - 2025",
      "size": 1000000000
    }
  ]
}
```

## Webhook API

### Create Webhook

Creates a new webhook subscription.

**Request:**
```
POST /webhooks
Content-Type: application/json
```

**Request Body:**
```json
{
  "event_types": ["file.created", "file.updated", "file.deleted"],
  "target_url": "https://your-server.com/webhook",
  "secret": "your-webhook-secret",
  "description": "File change notifications"
}
```

**Response:**
```json
{
  "id": "webhook_stu901",
  "event_types": ["file.created", "file.updated", "file.deleted"],
  "target_url": "https://your-server.com/webhook",
  "description": "File change notifications",
  "created": "2025-05-02T16:00:00Z",
  "status": "active"
}
```

### List Webhooks

Lists all webhooks for the authenticated user or application.

**Request:**
```
GET /webhooks
```

**Response:**
```json
{
  "items": [
    {
      "id": "webhook_stu901",
      "event_types": ["file.created", "file.updated", "file.deleted"],
      "target_url": "https://your-server.com/webhook",
      "description": "File change notifications",
      "created": "2025-05-02T16:00:00Z",
      "status": "active"
    },
    // Additional webhooks...
  ],
  "total": 1
}
```

### Get Webhook

Gets details about a specific webhook.

**Request:**
```
GET /webhooks/{webhook_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `webhook_id` | string | Required. The ID of the webhook |

**Response:**
```json
{
  "id": "webhook_stu901",
  "event_types": ["file.created", "file.updated", "file.deleted"],
  "target_url": "https://your-server.com/webhook",
  "description": "File change notifications",
  "created": "2025-05-02T16:00:00Z",
  "status": "active",
  "statistics": {
    "total_attempts": 15,
    "successful_attempts": 15,
    "failed_attempts": 0,
    "last_triggered": "2025-05-02T16:30:00Z"
  }
}
```

### Update Webhook

Updates a webhook subscription.

**Request:**
```
PATCH /webhooks/{webhook_id}
Content-Type: application/json
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `webhook_id` | string | Required. The ID of the webhook to update |

**Request Body:**
```json
{
  "event_types": ["file.created", "file.updated", "file.deleted", "folder.created"],
  "target_url": "https://your-new-server.com/webhook",
  "secret": "your-new-webhook-secret",
  "description": "Updated file and folder notifications"
}
```

**Response:**
```json
{
  "id": "webhook_stu901",
  "event_types": ["file.created", "file.updated", "file.deleted", "folder.created"],
  "target_url": "https://your-new-server.com/webhook",
  "description": "Updated file and folder notifications",
  "created": "2025-05-02T16:00:00Z",
  "updated": "2025-05-02T17:00:00Z",
  "status": "active"
}
```

### Delete Webhook

Deletes a webhook subscription.

**Request:**
```
DELETE /webhooks/{webhook_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `webhook_id` | string | Required. The ID of the webhook to delete |

**Response:**
```json
{
  "success": true,
  "id": "webhook_stu901",
  "deleted_at": "2025-05-02T17:15:00Z"
}
```

## Blockchain API

### Register File on Blockchain

Registers a file's hash on the Aptos blockchain.

**Request:**
```
POST /blockchain/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "file_id": "file_abc123"
}
```

**Response:**
```json
{
  "file_id": "file_abc123",
  "blockchain_id": "0x5e6f7a8b9c0d",
  "transaction_hash": "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
  "registered_at": "2025-05-02T18:00:00Z",
  "status": "confirmed"
}
```

### Verify File on Blockchain

Verifies a file's authenticity against the blockchain record.

**Request:**
```
GET /blockchain/verify/{file_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `file_id` | string | Required. The ID of the file to verify |

**Response:**
```json
{
  "file_id": "file_abc123",
  "file_name": "document.pdf",
  "verified": true,
  "blockchain_id": "0x5e6f7a8b9c0d",
  "transaction_hash": "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
  "registered_at": "2025-05-02T18:00:00Z",
  "registered_by": "0x4d5e6f7a8b9c",
  "verification_details": {
    "file_hash_match": true,
    "metadata_hash_match": true,
    "blockchain_status": "confirmed"
  }
}
```

## Authentication API

### Request Challenge

Requests a challenge for wallet-based authentication.

**Request:**
```
POST /auth/challenge
Content-Type: application/json
```

**Request Body:**
```json
{
  "address": "0x4d5e6f7a8b9c"
}
```

**Response:**
```json
{
  "challenge": "Sign this message to authenticate with AptosFS: 1a2b3c4d5e6f7a8b9c0d",
  "expires_at": "2025-05-02T18:15:00Z"
}
```

### Verify Signature

Verifies a signature for wallet-based authentication.

**Request:**
```
POST /auth/verify
Content-Type: application/json
```

**Request Body:**
```json
{
  "address": "0x4d5e6f7a8b9c",
  "signature": "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2025-05-03T18:00:00Z",
  "user": {
    "id": "user_xyz789",
    "address": "0x4d5e6f7a8b9c",
    "name": "Your Name"
  }
}