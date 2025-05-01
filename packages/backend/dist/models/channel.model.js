"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Channel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const base_model_1 = require("./base.model");
/**
 * Channel schema definition
 */
const channelSchema = (0, base_model_1.createSchema)({
    youtubeId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        index: true,
    },
    description: {
        type: String,
    },
    customUrl: {
        type: String,
    },
    thumbnailUrl: {
        type: String,
    },
    subscriberCount: {
        type: Number,
    },
    videoCount: {
        type: Number,
    },
    country: {
        type: String,
    },
    publishedAt: {
        type: Date,
    },
    lastChecked: {
        type: Date,
    },
    isArchived: {
        type: Boolean,
        default: false,
    },
    archiveStatus: {
        type: String,
        enum: ['none', 'partial', 'complete'],
        default: 'none',
    },
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
});
// Indexes
channelSchema.index({ name: 'text', description: 'text' });
channelSchema.index({ isArchived: 1 });
channelSchema.index({ createdBy: 1 });
/**
 * Channel model
 */
exports.Channel = mongoose_1.default.model('Channel', channelSchema);
//# sourceMappingURL=channel.model.js.map