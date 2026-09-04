"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const searchController_1 = require("../controllers/searchController");
const router = (0, express_1.Router)();
// GET /api/search?q=...
// Protected route ensuring caller identity and RBAC
router.get('/', authMiddleware_1.authenticateJwt, searchController_1.searchGlobal);
exports.default = router;
