"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const youtube_routes_1 = __importDefault(require("./youtube.routes"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const download_routes_1 = __importDefault(require("./download.routes"));
const router = express_1.default.Router();
// Register all routes
router.use('/youtube', youtube_routes_1.default);
router.use('/auth', auth_routes_1.default);
router.use('/downloads', download_routes_1.default);
// Add more route groups here as they are created
// router.use('/users', userRoutes);
exports.default = router;
//# sourceMappingURL=index.js.map