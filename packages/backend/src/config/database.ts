import mongoose from 'mongoose';
import { env } from './env';
import { logInfo, logError } from '../utils/logger';

/**
 * Connect to MongoDB
 */
export async function connectDatabase(): Promise<typeof mongoose> {
  try {
    // Set mongoose options
    mongoose.set('strictQuery', true);
    
    // Connect to MongoDB
    logInfo(`Connecting to MongoDB: ${maskUri(env.MONGODB_URI)}`);
    await mongoose.connect(env.MONGODB_URI);
    
    logInfo('MongoDB connection established successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logError('MongoDB connection error', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logInfo('MongoDB disconnected');
    });
    
    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logInfo('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
    return mongoose;
  } catch (error) {
    logError('Failed to connect to MongoDB', error as Error);
    throw error;
  }
}

/**
 * Mask sensitive information in MongoDB URI for logging
 */
function maskUri(uri: string): string {
  try {
    const parsedUri = new URL(uri);
    
    // Mask username and password if present
    if (parsedUri.username || parsedUri.password) {
      return uri.replace(
        /\/\/(.*):(.*)@/,
        '//***:***@'
      );
    }
    
    return uri;
  } catch (error) {
    // If URI can't be parsed, just hide everything after mongodb://
    return uri.replace(/(mongodb:\/\/)(.*)/, '$1***');
  }
}