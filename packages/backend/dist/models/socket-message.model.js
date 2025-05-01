"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketMessage = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const base_model_1 = require("./base.model");
const socket_types_1 = require("../types/socket.types");
/**
 * Socket message schema definition
 */
const socketMessageSchema = (0, base_model_1.createSchema)({
    eventType: {
        type: String,
        required: true,
        enum: Object.values(socket_types_1.SocketEventType),
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
        type: mongoose_1.default.Schema.Types.Mixed,
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
exports.SocketMessage = mongoose_1.default.model('SocketMessage', socketMessageSchema);
//# sourceMappingURL=socket-message.model.js.map