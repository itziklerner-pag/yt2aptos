import mongoose from 'mongoose';
/**
 * Connect to MongoDB
 */
export declare function connectDatabase(): Promise<typeof mongoose>;
