import { Router } from 'express';
import { downloadController } from '../controllers/download.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { Permission } from '@yt2aptos/shared';

const router = Router();

/**
 * @route   GET /api/downloads
 * @desc    Get all download jobs for the current user
 * @access  Private
 */
router.get('/', 
  authMiddleware.authenticate,
  authMiddleware.hasPermission(Permission.VIEW_DOWNLOADS),
  downloadController.getUserJobs
);

/**
 * @route   GET /api/downloads/queue/stats
 * @desc    Get download queue statistics
 * @access  Private
 */
router.get('/queue/stats',
  authMiddleware.authenticate,
  downloadController.getQueueStats
);

/**
 * @route   GET /api/downloads/active
 * @desc    Get active downloads
 * @access  Private
 */
router.get('/active',
  authMiddleware.authenticate,
  downloadController.getActiveDownloads
);

/**
 * @route   GET /api/downloads/profiles
 * @desc    Get available quality profiles
 * @access  Private
 */
router.get('/profiles',
  authMiddleware.authenticate,
  downloadController.getQualityProfiles
);

/**
 * @route   GET /api/downloads/formats
 * @desc    Get available formats for a YouTube URL
 * @access  Private
 */
router.get('/formats',
  authMiddleware.authenticate,
  downloadController.getAvailableFormats
);

/**
 * @route   GET /api/downloads/info
 * @desc    Get video info without downloading
 * @access  Private
 */
router.get('/info',
  authMiddleware.authenticate,
  downloadController.getVideoInfo
);

/**
 * @route   GET /api/downloads/:id
 * @desc    Get a specific download job
 * @access  Private
 */
router.get('/:id',
  authMiddleware.authenticate,
  downloadController.getJob
);

/**
 * @route   POST /api/downloads
 * @desc    Create a new download job
 * @access  Private
 */
router.post('/',
  authMiddleware.authenticate,
  authMiddleware.hasPermission(Permission.CREATE_DOWNLOAD),
  downloadController.createJob
);

/**
 * @route   POST /api/downloads/:id/pause
 * @desc    Pause a download job
 * @access  Private
 */
router.post('/:id/pause',
  authMiddleware.authenticate,
  authMiddleware.hasPermission(Permission.MANAGE_DOWNLOADS),
  downloadController.pauseJob
);

/**
 * @route   POST /api/downloads/:id/resume
 * @desc    Resume a paused download job
 * @access  Private
 */
router.post('/:id/resume',
  authMiddleware.authenticate,
  authMiddleware.hasPermission(Permission.MANAGE_DOWNLOADS),
  downloadController.resumeJob
);

/**
 * @route   POST /api/downloads/:id/cancel
 * @desc    Cancel a download job
 * @access  Private
 */
router.post('/:id/cancel',
  authMiddleware.authenticate,
  authMiddleware.hasPermission(Permission.MANAGE_DOWNLOADS),
  downloadController.cancelJob
);

/**
 * @route   POST /api/downloads/:id/retry
 * @desc    Retry a failed download job
 * @access  Private
 */
router.post('/:id/retry',
  authMiddleware.authenticate,
  authMiddleware.hasPermission(Permission.MANAGE_DOWNLOADS),
  downloadController.retryJob
);

/**
 * @route   POST /api/downloads/:id/priority
 * @desc    Update a job's priority
 * @access  Private
 */
router.post('/:id/priority',
  authMiddleware.authenticate,
  authMiddleware.hasPermission(Permission.MANAGE_DOWNLOADS),
  downloadController.updateJobPriority
);

/**
 * @route   POST /api/downloads/:jobId/process
 * @desc    Process a downloaded file
 * @access  Private
 */
router.post('/:jobId/process',
  authMiddleware.authenticate,
  authMiddleware.hasPermission(Permission.MANAGE_DOWNLOADS),
  downloadController.processFile
);

export default router;