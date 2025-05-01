import express from 'express';
import youtubeRoutes from './youtube.routes';
import authRoutes from './auth.routes';
import downloadRoutes from './download.routes';

const router = express.Router();

// Register all routes
router.use('/youtube', youtubeRoutes);
router.use('/auth', authRoutes);
router.use('/downloads', downloadRoutes);

// Add more route groups here as they are created
// router.use('/users', userRoutes);

export default router;