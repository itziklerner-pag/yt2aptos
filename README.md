# YT2Aptos: YouTube Content Archiving System

A robust system for archiving and preserving YouTube content with multiple storage options and Web3 authentication capabilities.

## Project Structure

This project uses a monorepo structure with three main packages:

- **shared**: Common types, interfaces, and utilities used across packages
- **backend**: Express API server, database models, and core services
- **frontend**: React web application for user interaction

## Features

- YouTube channel and playlist archiving
- Local file system storage with extensible provider system
- Metadata extraction and organization
- MongoDB integration for data persistence
- Docker support for development and production environments

## Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- Docker and Docker Compose (for containerized setup)
- MongoDB (if running without Docker)

## Getting Started

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/yt2aptos.git
   cd yt2aptos
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on the `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Build the packages:
   ```bash
   npm run build
   ```

5. Start the development servers:
   ```bash
   npm run dev
   ```

   This will start both the backend and frontend development servers:
   - Backend: http://localhost:3000
   - Frontend: http://localhost:3001

### Docker Setup

To run the entire stack using Docker:

1. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

2. Access the application:
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3000

## Project Structure

```
yt2aptos/
├── packages/
│   ├── shared/              # Shared code and utilities
│   │   ├── src/
│   │   │   ├── storage/     # Storage abstraction layer
│   │   │   └── index.ts
│   │
│   ├── backend/             # Server-side code
│   │   ├── src/
│   │   │   ├── config/      # Configuration files
│   │   │   ├── controllers/ # API controllers
│   │   │   ├── middleware/  # Express middleware
│   │   │   ├── models/      # Database models
│   │   │   ├── routes/      # API routes
│   │   │   ├── services/    # Business logic
│   │   │   ├── utils/       # Utilities
│   │   │   └── index.ts     # Entry point
│   │   └── Dockerfile
│   │
│   └── frontend/            # Client-side code
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── pages/       # Page components
│       │   ├── services/    # API services
│       │   ├── hooks/       # Custom hooks
│       │   ├── utils/       # Utilities
│       │   ├── styles/      # CSS styles
│       │   └── main.tsx     # Entry point
│       ├── public/          # Static assets
│       └── Dockerfile
│
├── docker-compose.yml       # Docker Compose configuration
└── package.json             # Root package.json
```

## Key Components

### Storage Provider System

The system uses a modular storage provider interface that enables storing content on different storage backends:

- **LocalFileSystem**: Store files on the local filesystem
- Future providers can be implemented (S3, Azure Blob Storage, etc.)

### Database Models

- **User**: User accounts and authentication
- **Channel**: YouTube channel metadata
- **Playlist**: YouTube playlist metadata
- **Video**: YouTube video metadata and storage information
- **DownloadJob**: Download queue and status tracking

## Development

### Adding a New Storage Provider

1. Implement the `StorageProvider` interface from the shared package
2. Register the provider in the `StorageProviderFactory`

### Adding New API Endpoints

1. Create a new controller in the `controllers` directory
2. Define routes in the `routes` directory
3. Register routes in the API setup

## License

MIT