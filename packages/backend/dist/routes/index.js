"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const youtube_routes_1 = __importDefault(require("./youtube.routes"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const download_routes_1 = __importDefault(require("./download.routes"));
const monitoring_routes_1 = __importDefault(require("./monitoring.routes"));
const external_api_routes_1 = __importDefault(require("./external-api.routes"));
const router = express_1.default.Router();
// API version constants
const V1 = 'v1';
const CURRENT_VERSION = V1;
// Register all routes
router.use('/youtube', youtube_routes_1.default);
router.use('/auth', auth_routes_1.default);
router.use('/downloads', download_routes_1.default);
router.use('/stats', monitoring_routes_1.default);
// External API routes with versioning
router.use(`/${CURRENT_VERSION}/external`, external_api_routes_1.default);
// For backward compatibility, also expose without version prefix
router.use('/external', external_api_routes_1.default);
// Add more route groups here as they are created
// router.use('/users', userRoutes);
exports.default = router;
//# sourceMappingURL=index.js.map