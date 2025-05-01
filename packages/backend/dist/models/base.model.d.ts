import mongoose, { Document, Schema } from 'mongoose';
/**
 * Base document interface with common fields for all models
 */
export interface BaseDocument extends Document {
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Base schema options with common settings for all models
 */
export declare const baseSchemaOptions: mongoose.SchemaOptions;
/**
 * Create a schema with base options
 * @param definition Schema definition
 * @param options Additional schema options
 * @returns Mongoose schema with base options
 */
export declare function createSchema<T = any>(definition: Record<string, any>, options?: mongoose.SchemaOptions): Schema<T>;
