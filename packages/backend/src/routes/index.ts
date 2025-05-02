import express from 'express';
import youtubeRoutes from './youtube.routes';
import authRoutes from './auth.routes';
import downloadRoutes from './download.routes';
import monitoringRoutes from './monitoring.routes';
import externalApiRoutes from './external-api.routes';

const router = express.Router();

// API version constants
const V1 = 'v1';
const CURRENT_VERSION = V1;

// Register all routes
router.use('/youtube', youtubeRoutes);
router.use('/auth', authRoutes);
router.use('/downloads', downloadRoutes);
router.use('/stats', monitoringRoutes);

// External API routes with versioning
router.use(`/${CURRENT_VERSION}/external`, externalApiRoutes);
// For backward compatibility, also expose without version prefix
router.use('/external', externalApiRoutes);

// Add more route groups here as they are created
// router.use('/users', userRoutes);

export default router;