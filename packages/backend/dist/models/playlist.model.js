"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Playlist = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const base_model_1 = require("./base.model");
/**
 * Playlist schema definition
 */
const playlistSchema = (0, base_model_1.createSchema)({
    youtubeId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        index: true,
    },
    description: {
        type: String,
    },
    thumbnailUrl: {
        type: String,
    },
    itemCount: {
        type: Number,
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
    channelId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Channel',
        required: true,
        index: true,
    },
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
});
// Indexes
playlistSchema.index({ title: 'text', description: 'text' });
playlistSchema.index({ isArchived: 1 });
playlistSchema.index({ channelId: 1, createdBy: 1 });
/**
 * Playlist model
 */
exports.Playlist = mongoose_1.default.model('Playlist', playlistSchema);
//# sourceMappingURL=playlist.model.js.map