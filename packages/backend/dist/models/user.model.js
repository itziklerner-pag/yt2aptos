"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const base_model_1 = require("./base.model");
/**
 * User schema definition
 */
const userSchema = (0, base_model_1.createSchema)({
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
    transform: function (doc, ret) {
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
exports.User = mongoose_1.default.model('User', userSchema);
/**
 * UserModel - alias for User model to maintain compatibility with tests
 */
exports.UserModel = exports.User;
//# sourceMappingURL=user.model.js.map