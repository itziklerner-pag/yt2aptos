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
export const baseSchemaOptions: mongoose.SchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (_, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
};

/**
 * Create a schema with base options
 * @param definition Schema definition
 * @param options Additional schema options
 * @returns Mongoose schema with base options
 */
export function createSchema<T = any>(
  definition: Record<string, any>,
  options?: mongoose.SchemaOptions
): Schema<T> {
  return new Schema(definition, {
    ...baseSchemaOptions,
    ...options,
  });
}