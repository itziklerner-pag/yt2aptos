"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const download_controller_1 = require("../controllers/download.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const shared_1 = require("@yt2aptos/shared");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/downloads
 * @desc    Get all download jobs for the current user
 * @access  Private
 */
router.get('/', auth_middleware_1.authMiddleware.authenticate, auth_middleware_1.authMiddleware.hasPermission(shared_1.Permission.VIEW_DOWNLOADS), download_controller_1.downloadController.getUserJobs);
/**
 * @route   GET /api/downloads/queue/stats
 * @desc    Get download queue statistics
 * @access  Private
 */
router.get('/queue/stats', auth_middleware_1.authMiddleware.authenticate, download_controller_1.downloadController.getQueueStats);
/**
 * @route   GET /api/downloads/active
 * @desc    Get active downloads
 * @access  Private
 */
router.get('/active', auth_middleware_1.authMiddleware.authenticate, download_controller_1.downloadController.getActiveDownloads);
/**
 * @route   GET /api/downloads/profiles
 * @desc    Get available quality profiles
 * @access  Private
 */
router.get('/profiles', auth_middleware_1.authMiddleware.authenticate, download_controller_1.downloadController.getQualityProfiles);
/**
 * @route   GET /api/downloads/formats
 * @desc    Get available formats for a YouTube URL
 * @access  Private
 */
router.get('/formats', auth_middleware_1.authMiddleware.authenticate, download_controller_1.downloadController.getAvailableFormats);
/**
 * @route   GET /api/downloads/info
 * @desc    Get video info without downloading
 * @access  Private
 */
router.get('/info', auth_middleware_1.authMiddleware.authenticate, download_controller_1.downloadController.getVideoInfo);
/**
 * @route   GET /api/downloads/:id
 * @desc    Get a specific download job
 * @access  Private
 */
router.get('/:id', auth_middleware_1.authMiddleware.authenticate, download_controller_1.downloadController.getJob);
/**
 * @route   POST /api/downloads
 * @desc    Create a new download job
 * @access  Private
 */
router.post('/', auth_middleware_1.authMiddleware.authenticate, auth_middleware_1.authMiddleware.hasPermission(shared_1.Permission.CREATE_DOWNLOAD), download_controller_1.downloadController.createJob);
/**
 * @route   POST /api/downloads/:id/pause
 * @desc    Pause a download job
 * @access  Private
 */
router.post('/:id/pause', auth_middleware_1.authMiddleware.authenticate, auth_middleware_1.authMiddleware.hasPermission(shared_1.Permission.MANAGE_DOWNLOADS), download_controller_1.downloadController.pauseJob);
/**
 * @route   POST /api/downloads/:id/resume
 * @desc    Resume a paused download job
 * @access  Private
 */
router.post('/:id/resume', auth_middleware_1.authMiddleware.authenticate, auth_middleware_1.authMiddleware.hasPermission(shared_1.Permission.MANAGE_DOWNLOADS), download_controller_1.downloadController.resumeJob);
/**
 * @route   POST /api/downloads/:id/cancel
 * @desc    Cancel a download job
 * @access  Private
 */
router.post('/:id/cancel', auth_middleware_1.authMiddleware.authenticate, auth_middleware_1.authMiddleware.hasPermission(shared_1.Permission.MANAGE_DOWNLOADS), download_controller_1.downloadController.cancelJob);
/**
 * @route   POST /api/downloads/:id/retry
 * @desc    Retry a failed download job
 * @access  Private
 */
router.post('/:id/retry', auth_middleware_1.authMiddleware.authenticate, auth_middleware_1.authMiddleware.hasPermission(shared_1.Permission.MANAGE_DOWNLOADS), download_controller_1.downloadController.retryJob);
/**
 * @route   POST /api/downloads/:id/priority
 * @desc    Update a job's priority
 * @access  Private
 */
router.post('/:id/priority', auth_middleware_1.authMiddleware.authenticate, auth_middleware_1.authMiddleware.hasPermission(shared_1.Permission.MANAGE_DOWNLOADS), download_controller_1.downloadController.updateJobPriority);
/**
 * @route   POST /api/downloads/:jobId/process
 * @desc    Process a downloaded file
 * @access  Private
 */
router.post('/:jobId/process', auth_middleware_1.authMiddleware.authenticate, auth_middleware_1.authMiddleware.hasPermission(shared_1.Permission.MANAGE_DOWNLOADS), download_controller_1.downloadController.processFile);
exports.default = router;
//# sourceMappingURL=download.routes.js.map