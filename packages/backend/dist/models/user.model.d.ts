import mongoose from 'mongoose';
import { BaseDocument } from './base.model';
/**
 * User document interface
 */
export interface UserDocument extends BaseDocument {
    username: string;
    email: string;
    password?: string;
    isEmailVerified: boolean;
    displayName?: string;
    avatarUrl?: string;
    role: 'user' | 'admin';
    isAdmin: boolean;
    profile: {
        displayName?: string;
        bio?: string;
        [key: string]: any;
    };
    lastLogin?: Date;
    walletAddress?: string;
    nonce?: string;
}
/**
 * User interface for creating new users
 */
export interface User {
    username: string;
    email: string;
    password: string;
    isAdmin?: boolean;
    profile?: {
        displayName?: string;
        bio?: string;
        [key: string]: any;
    };
}
/**
 * User model
 */
export declare const User: mongoose.Model<UserDocument, {}, {}, {}, mongoose.Document<unknown, {}, UserDocument, {}> & UserDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
/**
 * UserModel - alias for User model to maintain compatibility with tests
 */
export declare const UserModel: mongoose.Model<UserDocument, {}, {}, {}, mongoose.Document<unknown, {}, UserDocument, {}> & UserDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
