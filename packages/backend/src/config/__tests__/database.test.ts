import mongoose from 'mongoose';
import { env } from '../env';
import { connectDatabase } from '../database';
import * as logger from '../../utils/logger';
// Since maskUri is a private function, we'll test it indirectly

// Mock mongoose and logger
jest.mock('mongoose', () => {
  const mConnectionOn = jest.fn();
  const mConnect = jest.fn();
  const mClose = jest.fn();
  
  return {
    connect: mConnect,
    connection: {
      on: mConnectionOn,
      close: mClose,
    },
    set: jest.fn(),
  };
});

jest.mock('../../utils/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
}));

jest.mock('../env', () => ({
  env: {
    MONGODB_URI: 'mongodb://localhost:27017/test-db',
  },
}));

describe('Database Configuration', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock process.on to avoid side effects
    jest.spyOn(process, 'on').mockImplementation(jest.fn());
  });

  describe('connectDatabase', () => {
    it('should connect to MongoDB successfully', async () => {
      // Mock successful connection
      (mongoose.connect as jest.Mock).mockResolvedValue(mongoose);
      
      const result = await connectDatabase();
      
      // Check if mongoose.connect was called with the correct URI
      expect(mongoose.connect).toHaveBeenCalledWith(env.MONGODB_URI);
      
      // Check if strict query option was set
      expect(mongoose.set).toHaveBeenCalledWith('strictQuery', true);
      
      // Check if connection event handlers were registered
      expect(mongoose.connection.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mongoose.connection.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
      
      // Check if process termination handler was registered
      expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      
      // Check if successful connection was logged
      expect(logger.logInfo).toHaveBeenCalledWith('MongoDB connection established successfully');
      
      // Check return value
      expect(result).toBe(mongoose);
    });

    it('should handle connection errors', async () => {
      // Mock connection error
      const connectionError = new Error('Connection error');
      (mongoose.connect as jest.Mock).mockRejectedValue(connectionError);
      
      // Expect the function to throw
      await expect(connectDatabase()).rejects.toThrow(connectionError);
      
      // Check if error was logged
      expect(logger.logError).toHaveBeenCalledWith('Failed to connect to MongoDB', connectionError);
    });

    it('should handle connection events', async () => {
      // Mock successful connection
      (mongoose.connect as jest.Mock).mockResolvedValue(mongoose);
      
      await connectDatabase();
      
      // Get the error event handler
      const [[, errorHandler]] = (mongoose.connection.on as jest.Mock).mock.calls.filter(
        call => call[0] === 'error'
      );
      
      // Get the disconnected event handler
      const [[, disconnectHandler]] = (mongoose.connection.on as jest.Mock).mock.calls.filter(
        call => call[0] === 'disconnected'
      );
      
      // Simulate error event
      const connectionError = new Error('Connection dropped');
      errorHandler(connectionError);
      
      // Check if error was logged
      expect(logger.logError).toHaveBeenCalledWith('MongoDB connection error', connectionError);
      
      // Simulate disconnected event
      disconnectHandler();
      
      // Check if disconnection was logged
      expect(logger.logInfo).toHaveBeenCalledWith('MongoDB disconnected');
    });

    it('should handle process termination', async () => {
      // Mock successful connection
      (mongoose.connect as jest.Mock).mockResolvedValue(mongoose);
      (mongoose.connection.close as jest.Mock).mockResolvedValue(undefined);
      
      const originalExit = process.exit;
      process.exit = jest.fn() as any;
      
      await connectDatabase();
      
      // Get the SIGINT event handler
      const [[, sigintHandler]] = (process.on as jest.Mock).mock.calls.filter(
        call => call[0] === 'SIGINT'
      );
      
      // Simulate SIGINT event
      await sigintHandler();
      
      // Check if connection was closed
      expect(mongoose.connection.close).toHaveBeenCalled();
      
      // Check if termination was logged
      expect(logger.logInfo).toHaveBeenCalledWith('MongoDB connection closed due to app termination');
      
      // Check if process.exit was called
      expect(process.exit).toHaveBeenCalledWith(0);
      
      // Restore original process.exit
      process.exit = originalExit;
    });
  });

  describe('URI masking functionality', () => {
    // We'll test the maskUri function indirectly through the logging done during connection
    
    it('should mask username and password in MongoDB URI during connection', async () => {
      // Set a URI with credentials
      (env.MONGODB_URI as string) = 'mongodb://username:password@localhost:27017/db';
      
      // Mock successful connection
      (mongoose.connect as jest.Mock).mockResolvedValue(mongoose);
      
      await connectDatabase();
      
      // Check if the logged URI has credentials masked
      expect(logger.logInfo).toHaveBeenCalledWith(
        expect.stringContaining('mongodb://***:***@localhost:27017/db')
      );
      
      // Ensure original credentials are not logged
      expect(logger.logInfo).not.toHaveBeenCalledWith(
        expect.stringContaining('username:password')
      );
    });
    
    it('should not mask MongoDB URI without credentials', async () => {
      // Set a URI without credentials
      (env.MONGODB_URI as string) = 'mongodb://localhost:27017/db';
      
      // Mock successful connection
      (mongoose.connect as jest.Mock).mockResolvedValue(mongoose);
      
      await connectDatabase();
      
      // Check if the logged URI remains unchanged
      expect(logger.logInfo).toHaveBeenCalledWith(
        expect.stringContaining('mongodb://localhost:27017/db')
      );
    });
    
    it('should handle invalid MongoDB URIs', async () => {
      // Set an invalid URI
      (env.MONGODB_URI as string) = 'mongodb:invalid-uri';
      
      // Mock successful connection (even though in reality it would fail)
      (mongoose.connect as jest.Mock).mockResolvedValue(mongoose);
      
      await connectDatabase();
      
      // Check if the logged URI is masked appropriately
      expect(logger.logInfo).toHaveBeenCalledWith(
        expect.stringContaining('mongodb:***')
      );
    });
  });
});