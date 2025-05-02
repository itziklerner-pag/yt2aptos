# YouTube Content Archiving System API Reference

This document provides a detailed reference for all implemented and working API endpoints in the YouTube Content Archiving System.

## Base URL

All API endpoints are relative to the base URL:

```
/api
```

## Authentication

Most endpoints require authentication using a JWT token. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication API

Endpoints for user registration, login, and account management.

### 1.1. Register a new user

Create a new user account.

- **URL**: `/auth/register`
- **Method**: `POST`
- **Auth required**: No
- **Rate limited**: Yes

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name"
}
```

**Success Response**:
- **Code**: 201 Created
- **Content**:
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name"
  },
  "token": "jwt_token"
}
```

### 1.2. Login

Authenticate and receive a JWT token.

- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth required**: No
- **Rate limited**: Yes

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name"
  },
  "token": "jwt_token",
  "refreshToken": "refresh_token"
}
```

### 1.3. Logout

Invalidate the current session token.

- **URL**: `/auth/logout`
- **Method**: `POST`
- **Auth required**: Yes

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

### 1.4. Refresh Token

Get a new access token using a refresh token.

- **URL**: `/auth/refresh-token`
- **Method**: `POST`
- **Auth required**: No

**Request Body**:
```json
{
  "refreshToken": "refresh_token"
}
```

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "token": "new_jwt_token",
  "refreshToken": "new_refresh_token"
}
```

### 1.5. Get Current User

Retrieve details of the currently authenticated user.

- **URL**: `/auth/me`
- **Method**: `GET`
- **Auth required**: Yes

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "permissions": ["VIEW_DOWNLOADS", "CREATE_DOWNLOAD"]
}
```

### 1.6. Request Password Reset

Request a password reset link.

- **URL**: `/auth/password-reset/request`
- **Method**: `POST`
- **Auth required**: No

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### 1.7. Reset Password with Token

Reset password using a token received via email.

- **URL**: `/auth/password-reset/reset`
- **Method**: `POST`
- **Auth required**: No

**Request Body**:
```json
{
  "token": "reset_token",
  "password": "new_password"
}
```

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "success": true,
  "message": "Password successfully reset"
}
```

### 1.8. Generate Wallet Nonce

Generate a nonce for wallet authentication.

- **URL**: `/auth/wallet/nonce`
- **Method**: `POST`
- **Auth required**: No

**Request Body**:
```json
{
  "walletAddress": "0x..."
}
```

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "nonce": "random_nonce_string"
}
```

### 1.9. Authenticate with Wallet

Authenticate using a wallet signature.

- **URL**: `/auth/wallet/auth`
- **Method**: `POST`
- **Auth required**: No

**Request Body**:
```json
{
  "walletAddress": "0x...",
  "signature": "signed_message"
}
```

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "user": {
    "id": "user_id",
    "walletAddress": "0x..."
  },
  "token": "jwt_token"
}
```

### 1.10. Link Wallet to Account

Link a wallet address to an existing account.

- **URL**: `/auth/wallet/link`
- **Method**: `POST`
- **Auth required**: Yes

**Request Body**:
```json
{
  "walletAddress": "0x...",
  "signature": "signed_message"
}
```

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "success": true,
  "message": "Wallet linked to account"
}
```

---

## 2. YouTube API

Endpoints for interacting with YouTube data.

### 2.1. Search Channels

Search for YouTube channels.

- **URL**: `/youtube/channels/search`
- **Method**: `GET`
- **Auth required**: Yes
- **Query Parameters**:
  - `query` (required): Search term
  - `maxResults` (optional): Maximum number of results to return (default: 10)
  - `pageToken` (optional): Token for pagination

**Success Response**:
- **Code**: 200 OK
- **Content**: YouTube API search results for channels

### 2.2. Get Channel Details

Get detailed information about a specific YouTube channel.

- **URL**: `/youtube/channels/:id`
- **Method**: `GET`
- **Auth required**: Yes
- **URL Parameters**:
  - `id`: YouTube channel ID

**Success Response**:
- **Code**: 200 OK
- **Content**: YouTube API channel resource

### 2.3. Add Channel to Track

Add a YouTube channel to the system for tracking.

- **URL**: `/youtube/channels`
- **Method**: `POST`
- **Auth required**: Yes

**Request Body**:
```json
{
  "channelId": "UC..."
}
```

**Success Response**:
- **Code**: 201 Created
- **Content**:
```json
{
  "message": "Channel added successfully",
  "channel": {
    "id": "db_id",
    "youtubeId": "UC...",
    "name": "Channel Name",
    "thumbnailUrl": "https://...",
    "subscriberCount": 1000000,
    "videoCount": 500
  }
}
```

### 2.4. Get Channel Playlists

Get playlists for a specific YouTube channel.

- **URL**: `/youtube/channels/:channelId/playlists`
- **Method**: `GET`
- **Auth required**: Yes
- **URL Parameters**:
  - `channelId`: YouTube channel ID
- **Query Parameters**:
  - `maxResults` (optional): Maximum number of results to return (default: 10)
  - `pageToken` (optional): Token for pagination

**Success Response**:
- **Code**: 200 OK
- **Content**: List of YouTube playlists

### 2.5. Get Popular Channels

Get channels that are popular among users in the system.

- **URL**: `/youtube/channels/discover/popular`
- **Method**: `GET`
- **Auth required**: Yes
- **Query Parameters**:
  - `limit` (optional): Maximum number of channels to return (default: 10)

**Success Response**:
- **Code**: 200 OK
- **Content**: List of popular channels with tracking counts

### 2.6. Get Playlist Details

Get detailed information about a specific YouTube playlist.

- **URL**: `/youtube/playlists/:id`
- **Method**: `GET`
- **Auth required**: Yes
- **URL Parameters**:
  - `id`: YouTube playlist ID

**Success Response**:
- **Code**: 200 OK
- **Content**: YouTube API playlist resource

### 2.7. Add Playlist to Track

Add a YouTube playlist to the system for tracking.

- **URL**: `/youtube/playlists`
- **Method**: `POST`
- **Auth required**: Yes

**Request Body**:
```json
{
  "playlistId": "PL...",
  "channelId": "UC..."
}
```

**Success Response**:
- **Code**: 201 Created
- **Content**:
```json
{
  "message": "Playlist added successfully",
  "playlist": {
    "id": "db_id",
    "youtubeId": "PL...",
    "title": "Playlist Title",
    "thumbnailUrl": "https://...",
    "itemCount": 50
  }
}
```

### 2.8. Get Playlist Videos

Get videos in a specific YouTube playlist.

- **URL**: `/youtube/playlists/:playlistId/videos`
- **Method**: `GET`
- **Auth required**: Yes
- **URL Parameters**:
  - `playlistId`: YouTube playlist ID
- **Query Parameters**:
  - `maxResults` (optional): Maximum number of results to return (default: 10)
  - `pageToken` (optional): Token for pagination

**Success Response**:
- **Code**: 200 OK
- **Content**: List of YouTube videos in the playlist

### 2.9. Get Video Details

Get detailed information about a specific YouTube video.

- **URL**: `/youtube/videos/:id`
- **Method**: `GET`
- **Auth required**: Yes
- **URL Parameters**:
  - `id`: YouTube video ID

**Success Response**:
- **Code**: 200 OK
- **Content**: YouTube API video resource

### 2.10. Search YouTube Content

Search for YouTube content (videos, channels, playlists).

- **URL**: `/youtube/search`
- **Method**: `GET`
- **Auth required**: Yes
- **Query Parameters**:
  - `query` (required): Search term
  - `maxResults` (optional): Maximum number of results to return (default: 10)
  - `pageToken` (optional): Token for pagination
  - `type` (optional): Type of content to search for ('video', 'channel', 'playlist')
  - `order` (optional): Order of results (default: 'relevance')
  - `publishedAfter` (optional): Only return content published after this date
  - `publishedBefore` (optional): Only return content published before this date
  - `channelId` (optional): Only return content from this channel

**Success Response**:
- **Code**: 200 OK
- **Content**: YouTube API search results

### 2.11. Get Trending Videos

Get trending videos from YouTube.

- **URL**: `/youtube/discover/trending`
- **Method**: `GET`
- **Auth required**: Yes
- **Query Parameters**:
  - `maxResults` (optional): Maximum number of results to return (default: 10)
  - `pageToken` (optional): Token for pagination

**Success Response**:
- **Code**: 200 OK
- **Content**: List of trending YouTube videos

### 2.12. Get Personalized Recommendations

Get personalized video recommendations based on user history.

- **URL**: `/youtube/discover/recommendations/:userId?`
- **Method**: `GET`
- **Auth required**: Yes
- **URL Parameters**:
  - `userId` (optional): User ID to get recommendations for (defaults to current user)

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "baseChannelName": "Channel used for recommendations",
  "recommendations": [
    {
      "id": {
        "channelId": "UC..."
      },
      "snippet": {
        "title": "Recommended Channel",
        "description": "Channel description",
        "thumbnails": {}
      }
    }
  ]
}
```

### 2.13. Get API Quota Usage

Get YouTube API quota usage information.

- **URL**: `/youtube/quota`
- **Method**: `GET`
- **Auth required**: Yes

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "dailyQuota": 10000,
  "used": 350,
  "remaining": 9650,
  "resetTime": "2025-05-02T07:00:00Z"
}
```

---

## 3. Download API

Endpoints for managing download jobs and processing files.

### 3.1. Get User's Download Jobs

Get all download jobs for the current user.

- **URL**: `/downloads`
- **Method**: `GET`
- **Auth required**: Yes
- **Permissions required**: VIEW_DOWNLOADS

**Success Response**:
- **Code**: 200 OK
- **Content**: Array of download job objects

### 3.2. Get Download Queue Statistics

Get statistics about the download queue.

- **URL**: `/downloads/queue/stats`
- **Method**: `GET`
- **Auth required**: Yes

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "queued": 5,
  "processing": 2,
  "completed": 10,
  "failed": 1,
  "paused": 3,
  "total": 21,
  "estimatedCompletionTime": "2h 30m"
}
```

### 3.3. Get Active Downloads

Get currently active downloads.

- **URL**: `/downloads/active`
- **Method**: `GET`
- **Auth required**: Yes

**Success Response**:
- **Code**: 200 OK
- **Content**: Array of active download jobs with progress information

### 3.4. Get Quality Profiles

Get available download quality profiles.

- **URL**: `/downloads/profiles`
- **Method**: `GET`
- **Auth required**: Yes

**Success Response**:
- **Code**: 200 OK
- **Content**: Array of available quality profiles

### 3.5. Get Available Formats

Get available formats for a YouTube URL.

- **URL**: `/downloads/formats`
- **Method**: `GET`
- **Auth required**: Yes
- **Query Parameters**:
  - `url` (required): YouTube URL

**Success Response**:
- **Code**: 200 OK
- **Content**: Array of available formats for the video

### 3.6. Get Video Info

Get information about a YouTube video without downloading.

- **URL**: `/downloads/info`
- **Method**: `GET`
- **Auth required**: Yes
- **Query Parameters**:
  - `url` (required): YouTube URL

**Success Response**:
- **Code**: 200 OK
- **Content**: Video metadata from YouTube

### 3.7. Get Specific Download Job

Get details about a specific download job.

- **URL**: `/downloads/:id`
- **Method**: `GET`
- **Auth required**: Yes
- **URL Parameters**:
  - `id`: Download job ID

**Success Response**:
- **Code**: 200 OK
- **Content**: Download job object

### 3.8. Create Download Job

Create a new download job.

- **URL**: `/downloads`
- **Method**: `POST`
- **Auth required**: Yes
- **Permissions required**: CREATE_DOWNLOAD

**Request Body**:
```json
{
  "videoId": "video_db_id",
  "priority": 2,
  "profileName": "hd",
  "options": {
    "format": "bestvideo[height<=1080]+bestaudio/best[height<=1080]"
  }
}
```

**Success Response**:
- **Code**: 201 Created
- **Content**: Created download job object

### 3.9. Pause Download Job

Pause a download job.

- **URL**: `/downloads/:id/pause`
- **Method**: `POST`
- **Auth required**: Yes
- **Permissions required**: MANAGE_DOWNLOADS
- **URL Parameters**:
  - `id`: Download job ID

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "success": true,
  "status": "paused"
}
```

### 3.10. Resume Download Job

Resume a paused download job.

- **URL**: `/downloads/:id/resume`
- **Method**: `POST`
- **Auth required**: Yes
- **Permissions required**: MANAGE_DOWNLOADS
- **URL Parameters**:
  - `id`: Download job ID

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "success": true,
  "status": "queued"
}
```

### 3.11. Cancel Download Job

Cancel a download job.

- **URL**: `/downloads/:id/cancel`
- **Method**: `POST`
- **Auth required**: Yes
- **Permissions required**: MANAGE_DOWNLOADS
- **URL Parameters**:
  - `id`: Download job ID

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "success": true,
  "status": "canceled"
}
```

### 3.12. Retry Failed Download Job

Retry a failed download job.

- **URL**: `/downloads/:id/retry`
- **Method**: `POST`
- **Auth required**: Yes
- **Permissions required**: MANAGE_DOWNLOADS
- **URL Parameters**:
  - `id`: Download job ID

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "success": true,
  "status": "queued"
}
```

### 3.13. Update Job Priority

Update a download job's priority.

- **URL**: `/downloads/:id/priority`
- **Method**: `POST`
- **Auth required**: Yes
- **Permissions required**: MANAGE_DOWNLOADS
- **URL Parameters**:
  - `id`: Download job ID

**Request Body**:
```json
{
  "priority": 1
}
```

**Success Response**:
- **Code**: 200 OK
- **Content**:
```json
{
  "success": true,
  "priority": 1
}
```

### 3.14. Process Downloaded File

Process a downloaded file (e.g., extract chapters, create thumbnails).

- **URL**: `/downloads/:jobId/process`
- **Method**: `POST`
- **Auth required**: Yes
- **Permissions required**: MANAGE_DOWNLOADS
- **URL Parameters**:
  - `jobId`: Download job ID

**Request Body**:
```json
{
  "extractChapters": true,
  "generateThumbnails": true,
  "transcribe": false
}
```

**Success Response**:
- **Code**: 200 OK
- **Content**: Processing result object

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "message": "Invalid request parameters",
  "error": "Detailed error message"
}
```

### 401 Unauthorized
```json
{
  "message": "Authentication required",
  "error": "Token is missing or invalid"
}
```

### 403 Forbidden
```json
{
  "message": "Insufficient permissions",
  "error": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found",
  "error": "The requested resource does not exist"
}
```

### 409 Conflict
```json
{
  "message": "Resource conflict",
  "error": "The resource already exists"
}
```

### 500 Internal Server Error
```json
{
  "message": "Server error",
  "error": "An unexpected error occurred"
}