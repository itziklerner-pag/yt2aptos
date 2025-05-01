import mongoose from 'mongoose';
import { BaseDocument, createSchema } from './base.model';
import { SocketEventType } from '../types/socket.types';

/**
 * Socket message delivery status
 */
export type SocketMessageStatus = 
  | 'queued'    // Message is queued for delivery
  | 'sent'      // Message was sent to the client
  | 'delivered' // Message was delivered and acknowledged by client
  | 'read'      // Message was read by the client
  | 'failed';   // Message failed to deliver

/**
 * Socket message document interface
 */
export interface SocketMessageDocument extends BaseDocument {
  eventType: SocketEventType;
  roomId?: string;
  userId?: string;
  payload: any;
  status: SocketMessageStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  expiresAt: Date;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
}

/**
 * Socket message schema definition
 */
const socketMessageSchema = createSchema<SocketMessageDocument>({
  eventType: {
    type: String,
    required: true,
    enum: Object.values(SocketEventType),
    index: true,
  },
  roomId: {
    type: String,
    index: true,
  },
  userId: {
    type: String,
    index: true,
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  status: {
    type: String,
    enum: ['queued', 'sent', 'delivered', 'read', 'failed'],
    default: 'queued',
    index: true,
  },
  sentAt: {
    type: Date,
  },
  deliveredAt: {
    type: Date,
  },
  readAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  errorMessage: {
    type: String,
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  maxRetries: {
    type: Number,
    default: 3,
  },
});

// Indexes
socketMessageSchema.index({ userId: 1, status: 1, eventType: 1 });
socketMessageSchema.index({ roomId: 1, status: 1, eventType: 1 });
socketMessageSchema.index({ status: 1, expiresAt: 1 });

// Automatically delete expired messages
socketMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Socket message model
 */
export const SocketMessage = mongoose.model<SocketMessageDocument>('SocketMessage', socketMessageSchema);