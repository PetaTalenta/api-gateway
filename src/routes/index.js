const express = require('express');
const { verifyToken, verifyInternalService, verifyAdmin } = require('../middleware/auth');
const { authLimiter, assessmentLimiter, adminLimiter, archiveLimiter, chatLimiter } = require('../middleware/rateLimiter');
const { authServiceProxy, authV2ServiceProxy, archiveServiceProxy, assessmentServiceProxy, notificationServiceProxy, socketIOProxy, chatbotServiceProxy } = require('../middleware/proxy');
const { adminServiceProxy } = require('../middleware/adminServiceProxy');

const router = express.Router();

/**
 * API Gateway Routes Configuration
 *
 * Route Structure:
 * /api/auth/* -> Auth Service
 * /api/admin/* -> Auth Service (Admin endpoints)
 * /api/archive/* -> Archive Service
 * /api/assessment/* -> Assessment Service
 * /api/notifications/* -> Notification Service
 * /api/chatbot/* -> Chatbot Service
 * /socket.io/* -> Notification Service (WebSocket)
 */

// ===== AUTH SERVICE ROUTES =====

// Public auth endpoints (no authentication required)
router.use('/auth/register', authLimiter, authServiceProxy);
router.use('/auth/register/batch', authLimiter, authServiceProxy);
router.use('/auth/login', authLimiter, authServiceProxy);

// Internal service endpoints
router.use('/auth/verify-token', verifyInternalService, authServiceProxy);

// Internal token balance endpoint (for service-to-service communication)
router.put('/auth/token-balance', verifyInternalService, authServiceProxy);

// Protected user endpoints
router.use('/auth/logout', verifyToken, authServiceProxy);
router.use('/auth/change-password', verifyToken, authServiceProxy);

// Profile endpoints (all HTTP methods)
router.get('/auth/profile', verifyToken, authServiceProxy);
router.put('/auth/profile', verifyToken, authServiceProxy);
router.delete('/auth/profile', verifyToken, authServiceProxy);

// Account deletion endpoint (self-deletion)
router.delete('/auth/account', verifyToken, authServiceProxy);

// User token balance endpoint (for user queries)
router.get('/auth/token-balance', verifyToken, authServiceProxy);

// School endpoints (protected)
router.get('/auth/schools', verifyToken, authServiceProxy);
router.post('/auth/schools', verifyToken, authServiceProxy);

// Specific school endpoints (must come before general /auth/schools/* pattern)
router.get('/auth/schools/by-location', verifyToken, authServiceProxy);
router.get('/auth/schools/location-stats', verifyToken, authServiceProxy);
router.get('/auth/schools/distribution', verifyToken, authServiceProxy);

// School users endpoint (with parameter)
router.get('/auth/schools/:schoolId/users', verifyToken, authServiceProxy);

// ===== AUTH V2 SERVICE ROUTES (Firebase-based) =====

// Public auth v2 endpoints (no authentication required)
router.post('/auth/v2/register', authLimiter, authV2ServiceProxy);
router.post('/auth/v2/login', authLimiter, authV2ServiceProxy);
router.post('/auth/v2/refresh', authLimiter, authV2ServiceProxy);
router.post('/auth/v2/forgot-password', authLimiter, authV2ServiceProxy);
router.post('/auth/v2/reset-password', authLimiter, authV2ServiceProxy);

// Protected auth v2 endpoints (Firebase token required)
// Note: These endpoints use Firebase token validation, not JWT
router.post('/auth/v2/logout', authV2ServiceProxy);
router.patch('/auth/v2/profile', authV2ServiceProxy);
router.delete('/auth/v2/user', authV2ServiceProxy);

// Health endpoint for auth v2
router.get('/auth/v2/health', authV2ServiceProxy);

// ===== ADMIN ROUTES =====

// Admin authentication (public)
router.post('/admin/login', authLimiter, adminServiceProxy);

// Protected admin endpoints
router.get('/admin/profile', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);
router.put('/admin/profile', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);
router.post('/admin/logout', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);

// Superadmin only endpoints

// User management endpoints
router.get('/admin/users', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);
router.get('/admin/users/:userId', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);
router.put('/admin/users/:userId/profile', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);
router.delete('/admin/users/:userId', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);

// Token balance management
router.post('/admin/users/:userId/token-balance', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);
router.put('/admin/users/:userId/token-balance/archive', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);

// System monitoring endpoints
router.get('/admin/stats/global', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);
router.get('/admin/jobs/monitor', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);
router.get('/admin/jobs/queue', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);
router.get('/admin/jobs/all', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);

// Analytics endpoints
router.get('/admin/analytics/daily', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);
router.get('/admin/assessments/:resultId/details', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);
router.get('/admin/assessments/search', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);

// Job management endpoints
router.post('/admin/jobs/:jobId/cancel', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);
router.post('/admin/jobs/:jobId/retry', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);
router.post('/admin/jobs/bulk', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);

// Performance and security endpoints
router.get('/admin/performance/report', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);
router.post('/admin/performance/optimize', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);
router.get('/admin/security/audit', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);
router.post('/admin/security/anonymize/:userId', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);

// ===== ADMIN DIRECT DATABASE ROUTES =====
// New direct database access endpoints (Phase 1, 2, 3 implementation)
// Note: Admin service handles its own authentication for direct endpoints

// Public admin direct authentication (no middleware needed)
router.post('/admin/direct/login', authLimiter, adminServiceProxy);

// Protected admin direct endpoints (admin service handles auth internally)
// Phase 1: Core Admin Endpoints
router.get('/admin/direct/profile', adminLimiter, adminServiceProxy);
router.put('/admin/direct/profile', adminLimiter, adminServiceProxy);
router.post('/admin/direct/logout', adminLimiter, adminServiceProxy);
router.get('/admin/direct/health/db', adminServiceProxy); // Public health check

// User Management
router.get('/admin/direct/users', adminLimiter, adminServiceProxy);
router.get('/admin/direct/users/:userId', adminLimiter, adminServiceProxy);
router.put('/admin/direct/users/:userId/profile', adminLimiter, adminServiceProxy);
router.post('/admin/direct/users/:userId/tokens/add', adminLimiter, adminServiceProxy);
router.post('/admin/direct/users/:userId/tokens/deduct', adminLimiter, adminServiceProxy);
router.get('/admin/direct/users/:userId/tokens/history', adminLimiter, adminServiceProxy);

// Phase 2: Analytics & Advanced Features
// User Analytics
router.get('/admin/direct/analytics/users/overview', adminLimiter, adminServiceProxy);
router.get('/admin/direct/analytics/users/activity', adminLimiter, adminServiceProxy);
router.get('/admin/direct/analytics/users/demographics', adminLimiter, adminServiceProxy);
router.get('/admin/direct/analytics/users/retention', adminLimiter, adminServiceProxy);

// Assessment Management
router.get('/admin/direct/assessments/overview', adminLimiter, adminServiceProxy);
router.get('/admin/direct/assessments/:resultId/details', adminLimiter, adminServiceProxy);
router.get('/admin/direct/assessments/raw-analysis', adminLimiter, adminServiceProxy);
router.get('/admin/direct/assessments/performance', adminLimiter, adminServiceProxy);
router.get('/admin/direct/assessments/trends', adminLimiter, adminServiceProxy);

// Token Management
router.get('/admin/direct/tokens/overview', adminLimiter, adminServiceProxy);
router.get('/admin/direct/tokens/transactions', adminLimiter, adminServiceProxy);
router.get('/admin/direct/tokens/analytics', adminLimiter, adminServiceProxy);
router.post('/admin/direct/tokens/bulk-operations', adminLimiter, adminServiceProxy);

// Job Monitoring
router.get('/admin/direct/jobs/monitor', adminLimiter, adminServiceProxy);
router.get('/admin/direct/jobs/queue/status', adminLimiter, adminServiceProxy);
router.get('/admin/direct/jobs/analytics', adminLimiter, adminServiceProxy);
router.post('/admin/direct/jobs/:jobId/retry', adminLimiter, adminServiceProxy);
router.delete('/admin/direct/jobs/:jobId', adminLimiter, adminServiceProxy);

// System Performance
router.get('/admin/direct/system/metrics', adminLimiter, adminServiceProxy);
router.get('/admin/direct/system/health', adminLimiter, adminServiceProxy);
router.get('/admin/direct/system/database/stats', adminLimiter, adminServiceProxy);
router.get('/admin/direct/system/errors', adminLimiter, adminServiceProxy);

// Phase 3: Security & Monitoring Features
// Security Features
router.get('/admin/direct/security/audit', adminLimiter, adminServiceProxy);
router.get('/admin/direct/security/suspicious-activities', adminLimiter, adminServiceProxy);
router.get('/admin/direct/security/login-patterns', adminLimiter, adminServiceProxy);
router.post('/admin/direct/security/user/:userId/suspend', adminLimiter, adminServiceProxy);
router.post('/admin/direct/security/user/:userId/activate', adminLimiter, adminServiceProxy);

// Audit Logging
router.get('/admin/direct/audit/activities', adminLimiter, adminServiceProxy);
router.get('/admin/direct/audit/user/:userId/history', adminLimiter, adminServiceProxy);
router.get('/admin/direct/audit/data-access', adminLimiter, adminServiceProxy);
router.get('/admin/direct/audit/exports', adminLimiter, adminServiceProxy);

// Data Analytics & Insights
router.get('/admin/direct/insights/user-behavior', adminLimiter, adminServiceProxy);
router.get('/admin/direct/insights/assessment-effectiveness', adminLimiter, adminServiceProxy);
router.get('/admin/direct/insights/business-metrics', adminLimiter, adminServiceProxy);
router.get('/admin/direct/insights/predictive-analytics', adminLimiter, adminServiceProxy);

// Advanced Data Management
router.post('/admin/direct/data/export', adminLimiter, adminServiceProxy);
router.post('/admin/direct/data/backup', adminLimiter, adminServiceProxy);
router.post('/admin/direct/data/anonymize/:userId', adminLimiter, adminServiceProxy);
router.get('/admin/direct/data/integrity-check', adminLimiter, adminServiceProxy);

// Real-time Dashboard Features
router.get('/admin/direct/dashboard/realtime', adminLimiter, adminServiceProxy);
router.get('/admin/direct/dashboard/alerts', adminLimiter, adminServiceProxy);
router.get('/admin/direct/dashboard/kpis', adminLimiter, adminServiceProxy);
router.get('/admin/direct/dashboard/live', adminLimiter, adminServiceProxy); // WebSocket endpoint

// ===== ARCHIVE SERVICE ROUTES =====

// Specific endpoints first (most specific to least specific)

// Analysis Results endpoints - specific routes first
router.post('/archive/results/batch', verifyInternalService, archiveServiceProxy);
router.get('/archive/results/:id', archiveLimiter, archiveServiceProxy); // Made public - no auth required
router.put('/archive/results/:id', verifyToken, archiveLimiter, archiveServiceProxy); // Can be user or service
router.delete('/archive/results/:id', verifyToken, archiveLimiter, archiveServiceProxy);
router.get('/archive/results', verifyToken, archiveLimiter, archiveServiceProxy); // Still requires auth (user-specific)
router.post('/archive/results', verifyInternalService, archiveServiceProxy);

// Analysis Jobs endpoints - specific routes first
router.get('/archive/jobs/stats', (req, res, next) => {
  // Allow both user tokens and internal service authentication
  const isInternalService = req.headers['x-internal-service'] === 'true';
  if (isInternalService) {
    return verifyInternalService(req, res, next);
  } else {
    return verifyToken(req, res, () => {
      archiveLimiter(req, res, next);
    });
  }
}, archiveServiceProxy);
router.put('/archive/jobs/:jobId/status', verifyInternalService, archiveServiceProxy);
router.get('/archive/jobs/:jobId', verifyToken, archiveLimiter, archiveServiceProxy);
router.delete('/archive/jobs/:jobId', verifyToken, archiveLimiter, archiveServiceProxy);
router.get('/archive/jobs', verifyToken, archiveLimiter, archiveServiceProxy);
router.post('/archive/jobs', verifyInternalService, archiveServiceProxy);

// Batch processing endpoints (internal service only)
router.get('/archive/batch/stats', verifyInternalService, archiveServiceProxy);
router.post('/archive/batch/process', verifyInternalService, archiveServiceProxy);
router.post('/archive/batch/clear', verifyInternalService, archiveServiceProxy);

// Statistics endpoints
router.get('/archive/stats/summary', verifyInternalService, archiveServiceProxy);
router.get('/archive/stats/overview', verifyToken, archiveLimiter, archiveServiceProxy);
router.get('/archive/stats', verifyToken, archiveLimiter, archiveServiceProxy);

// Demographics endpoints (internal service only)
router.get('/archive/demographics/overview', verifyInternalService, archiveServiceProxy);
router.get('/archive/demographics/archetype/:archetype', verifyInternalService, archiveServiceProxy);
router.get('/archive/demographics/schools', verifyInternalService, archiveServiceProxy);
router.get('/archive/demographics/optimized', verifyInternalService, archiveServiceProxy);
router.get('/archive/demographics/trends', verifyInternalService, archiveServiceProxy);
router.get('/archive/demographics/performance', verifyInternalService, archiveServiceProxy);

// Metrics endpoints (internal service only)
router.get('/archive/metrics/health', archiveServiceProxy); // No auth required
router.get('/archive/metrics/database', verifyInternalService, archiveServiceProxy);
router.get('/archive/metrics/cache', verifyInternalService, archiveServiceProxy);
router.get('/archive/metrics/performance', verifyInternalService, archiveServiceProxy);
router.post('/archive/metrics/reset', verifyInternalService, archiveServiceProxy);
router.post('/archive/metrics/cache/invalidate', verifyInternalService, archiveServiceProxy);
router.get('/archive/metrics', verifyInternalService, archiveServiceProxy);

// Admin endpoints for archive service (admin authentication required)
router.get('/archive/admin/users/:userId', verifyToken, verifyAdmin, adminLimiter, archiveServiceProxy);
router.put('/archive/admin/users/:userId/profile', verifyToken, verifyAdmin, adminLimiter, archiveServiceProxy);
router.put('/archive/admin/users/:userId/token-balance', verifyToken, verifyAdmin, adminLimiter, archiveServiceProxy);
router.delete('/archive/admin/users/:userId', verifyToken, verifyAdmin, adminLimiter, archiveServiceProxy);
router.get('/archive/admin/users', verifyToken, verifyAdmin, adminLimiter, archiveServiceProxy);

// Phase 2: System monitoring and analytics endpoints
router.get('/archive/admin/stats/global', verifyToken, verifyAdmin, adminLimiter, archiveServiceProxy);
router.get('/archive/admin/jobs/monitor', verifyToken, verifyAdmin, adminLimiter, archiveServiceProxy);
router.get('/archive/admin/jobs/queue', verifyToken, verifyAdmin, adminLimiter, archiveServiceProxy);

// Phase 3: Deep analytics and assessment details endpoints
router.get('/archive/admin/analytics/daily', verifyToken, verifyAdmin, adminLimiter, archiveServiceProxy);
router.get('/archive/admin/assessments/:resultId/details', verifyToken, verifyAdmin, adminLimiter, archiveServiceProxy);
router.get('/archive/admin/assessments/search', verifyToken, verifyAdmin, adminLimiter, archiveServiceProxy);

// Phase 4: Advanced job management endpoints
router.post('/archive/admin/jobs/:jobId/cancel', verifyToken, verifyAdmin, adminLimiter, archiveServiceProxy);
router.post('/archive/admin/jobs/:jobId/retry', verifyToken, verifyAdmin, adminLimiter, archiveServiceProxy);
router.post('/archive/admin/jobs/bulk', verifyToken, verifyAdmin, adminLimiter, archiveServiceProxy);

// Phase 4: Performance optimization endpoints
router.get('/archive/admin/performance/report', verifyToken, verifyAdmin, adminLimiter, archiveServiceProxy);
router.post('/archive/admin/performance/optimize', verifyToken, verifyAdmin, adminLimiter, archiveServiceProxy);

// Phase 4: Security enhancement endpoints
router.get('/archive/admin/security/audit', verifyToken, verifyAdmin, adminLimiter, archiveServiceProxy);
router.post('/archive/admin/security/anonymize/:userId', verifyToken, verifyAdmin, adminLimiter, archiveServiceProxy);

// Unified API v1 endpoints
router.get('/archive/v1/stats', (req, res, next) => {
  // Flexible authentication based on type parameter
  const type = req.query.type || 'user';
  if (['system', 'demographic', 'performance'].includes(type)) {
    return verifyInternalService(req, res, next);
  } else {
    return verifyToken(req, res, () => {
      archiveLimiter(req, res, next);
    });
  }
}, archiveServiceProxy);

router.get('/archive/v1/analytics', verifyInternalService, archiveServiceProxy);
router.get('/archive/v1/data/:type', verifyToken, archiveLimiter, archiveServiceProxy);
router.post('/archive/v1/batch/:operation', verifyInternalService, archiveServiceProxy);
router.get('/archive/v1/health/:component?', archiveServiceProxy);

// Health endpoints (no authentication required)
router.get('/archive/health/detailed', archiveServiceProxy);
router.get('/archive/health', archiveServiceProxy);

// Development endpoints (if enabled)
if (process.env.NODE_ENV === 'development') {
  router.post('/archive/dev/create-user', verifyInternalService, archiveServiceProxy);
  router.use('/archive/dev', verifyInternalService, archiveServiceProxy);
}

// Note: Direct access routes removed - all routes now use /archive prefix for consistency

// ===== ASSESSMENT SERVICE ROUTES =====

// Root endpoint (service information)
router.get('/assessment', assessmentServiceProxy);

// Health endpoints (public)
router.get('/assessment/health', assessmentServiceProxy);
router.get('/assessment/health/ready', assessmentServiceProxy);
router.get('/assessment/health/live', assessmentServiceProxy);
router.get('/assessment/health/queue', assessmentServiceProxy);

// Assessment submission (protected + rate limited)
router.use('/assessment/submit', verifyToken, assessmentLimiter, assessmentServiceProxy);

// Assessment retry (protected + rate limited) - forward to assessment service
router.use('/assessment/retry', verifyToken, assessmentLimiter, assessmentServiceProxy);

// Assessment status check (protected)
router.use('/assessment/status', verifyToken, assessmentServiceProxy);

// Queue monitoring (protected)
router.use('/assessment/queue/status', verifyToken, assessmentServiceProxy);

// ===== CHATBOT SERVICE ROUTES =====

// Health endpoints (public)
router.get('/chatbot/health', chatbotServiceProxy);
router.get('/chatbot/health/ready', chatbotServiceProxy);
router.get('/chatbot/health/live', chatbotServiceProxy);
router.get('/chatbot/health/metrics', chatbotServiceProxy);

// Assessment Integration endpoints removed - no longer available in chatbot service

// Conversation endpoints (protected) - must come after specific routes
router.use('/chatbot/conversations', verifyToken, chatLimiter, chatbotServiceProxy);

// Root endpoint (service information)
router.get('/chatbot', chatbotServiceProxy);

// ===== NOTIFICATION SERVICE ROUTES =====

// Health endpoints (public)
router.get('/notifications/health', notificationServiceProxy);

// Debug endpoints (public for development)
router.use('/notifications/debug', notificationServiceProxy);

// Other notification endpoints (protected)
router.use('/notifications', verifyToken, notificationServiceProxy);

// Idempotency endpoints (protected)
router.use('/assessment/idempotency/health', verifyToken, assessmentServiceProxy);
router.use('/assessment/idempotency/cleanup', verifyToken, assessmentServiceProxy);

// Internal callback endpoints
router.use('/assessment/callback/completed', verifyInternalService, assessmentServiceProxy);
router.use('/assessment/callback/failed', verifyInternalService, assessmentServiceProxy);
router.use('/assessment/callback', verifyInternalService, assessmentServiceProxy);

// Development endpoints (if enabled)
if (process.env.NODE_ENV === 'development') {
  router.post('/assessment/test/submit', assessmentServiceProxy);
  router.get('/assessment/test/status', assessmentServiceProxy);
  router.use('/assessment/test', assessmentServiceProxy); // Fallback for other test endpoints
}

// ===== HEALTH CHECK ROUTES =====

// Global health endpoints (no authentication required)
router.get('/health', authServiceProxy); // Main health check
router.get('/health/metrics', authServiceProxy); // Metrics endpoint
router.get('/health/ready', authServiceProxy); // Readiness probe
router.get('/health/live', authServiceProxy); // Liveness probe

// ===== CATCH-ALL ROUTES =====

// Health endpoints for individual services (these are already handled above, but kept for compatibility)
router.use('/auth/health', authServiceProxy);
router.use('/archive/health', archiveServiceProxy);
router.use('/chatbot/health', chatbotServiceProxy);
// Assessment health endpoints are handled specifically above

// Fallback for any other routes to respective services
router.use('/auth/*', authServiceProxy);
router.use('/archive/*', archiveServiceProxy);
router.use('/assessment/*', assessmentServiceProxy);
router.use('/notifications/*', notificationServiceProxy);
router.use('/chatbot/*', chatbotServiceProxy);

// ===== ADMIN-SERVICE ROUTES =====
// Public admin login via admin-service
// router.post('/admin/login', (req, res) => res.json({test: true}));
// Protected admin-service routes
router.use('/admin', verifyToken, verifyAdmin, adminLimiter, adminServiceProxy);

module.exports = router;
