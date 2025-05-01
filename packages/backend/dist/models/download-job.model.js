"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadJob = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const base_model_1 = require("./base.model");
/**
 * Download job schema definition
 */
const downloadJobSchema = (0, base_model_1.createSchema)({
    videoId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Video',
        required: true,
        index: true,
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: ['queued', 'processing', 'completed', 'failed', 'paused', 'canceled'],
        default: 'queued',
        index: true,
    },
    priority: {
        type: Number,
        default: 0,
        index: true,
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    startedAt: {
        type: Date,
    },
    completedAt: {
        type: Date,
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
    ytdlpOptions: {
        type: mongoose_1.default.Schema.Types.Mixed,
    },
    outputPath: {
        type: String,
    },
    metadata: {
        type: mongoose_1.default.Schema.Types.Mixed,
    },
});
// Indexes
downloadJobSchema.index({ status: 1, priority: -1, createdAt: 1 });
downloadJobSchema.index({ userId: 1, status: 1 });
downloadJobSchema.index({ videoId: 1, status: 1 });
downloadJobSchema.index({ startedAt: 1 }, { sparse: true });
/**
 * Download job model
 */
exports.DownloadJob = mongoose_1.default.model('DownloadJob', downloadJobSchema);
//# sourceMappingURL=download-job.model.js.map