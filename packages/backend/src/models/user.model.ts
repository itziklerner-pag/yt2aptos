import mongoose from 'mongoose';
import { BaseDocument, createSchema } from './base.model';

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
  // Web3 authentication fields
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
 * User schema definition
 */
const userSchema = createSchema<UserDocument>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    select: true, // Important for tests to be able to access it
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  displayName: {
    type: String,
    trim: true,
  },
  avatarUrl: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  profile: {
    type: Object,
    default: {},
  },
  lastLogin: {
    type: Date,
  },
  walletAddress: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
  },
  nonce: {
    type: String,
  },
});

// Note: Skip adding indexes here since they're already defined in the schema properties

// Methods
userSchema.set('toJSON', {
  transform: function(doc, ret: any) {
    // We use ret directly but cast it to any to avoid TypeScript errors
    delete ret.password;
    delete ret.nonce;
    return ret;
  }
});

userSchema.methods.toPublic = function () {
  const user = this.toObject();
  delete user.password;
  delete user.nonce;
  return user;
};

userSchema.methods.toPublic = function () {
  const user = this.toObject();
  delete user.password;
  delete user.nonce;
  return user;
};

/**
 * User model
 */
export const User = mongoose.model<UserDocument>('User', userSchema);

/**
 * UserModel - alias for User model to maintain compatibility with tests
 */
export const UserModel = User;