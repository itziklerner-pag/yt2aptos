"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Video = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const base_model_1 = require("./base.model");
/**
 * Video schema definition
 */
const videoSchema = (0, base_model_1.createSchema)({
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
    duration: {
        type: Number,
    },
    viewCount: {
        type: Number,
    },
    likeCount: {
        type: Number,
    },
    publishedAt: {
        type: Date,
    },
    tags: [{
            type: String,
        }],
    channelId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Channel',
        required: true,
        index: true,
    },
    playlistId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Playlist',
        index: true,
    },
    isArchived: {
        type: Boolean,
        default: false,
        index: true,
    },
    archiveStatus: {
        type: String,
        enum: ['pending', 'downloading', 'completed', 'failed'],
        default: 'pending',
        index: true,
    },
    downloadedAt: {
        type: Date,
    },
    fileSize: {
        type: Number,
    },
    filePath: {
        type: String,
    },
    fileUrl: {
        type: String,
    },
    format: {
        type: String,
    },
    quality: {
        type: String,
    },
    hasSubtitles: {
        type: Boolean,
        default: false,
    },
    subtitleLanguages: [{
            type: String,
        }],
    metadataPath: {
        type: String,
    },
    errorMessage: {
        type: String,
    },
});
// Indexes
videoSchema.index({ title: 'text', description: 'text', tags: 'text' });
videoSchema.index({ publishedAt: -1 });
videoSchema.index({ channelId: 1, playlistId: 1 });
videoSchema.index({ isArchived: 1, archiveStatus: 1 });
/**
 * Video model
 */
exports.Video = mongoose_1.default.model('Video', videoSchema);
//# sourceMappingURL=video.model.js.map