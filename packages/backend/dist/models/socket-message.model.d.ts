import mongoose from 'mongoose';
import { BaseDocument } from './base.model';
import { SocketEventType } from '../types/socket.types';
/**
 * Socket message delivery status
 */
export type SocketMessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
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
 * Socket message model
 */
export declare const SocketMessage: mongoose.Model<SocketMessageDocument, {}, {}, {}, mongoose.Document<unknown, {}, SocketMessageDocument, {}> & SocketMessageDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
