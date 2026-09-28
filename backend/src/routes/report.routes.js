import { Router } from 'express';
import * as ctrl from '../controllers/report.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';

const router = Router();
router.use(authenticate);

// Todos los roles pueden ver reportes
// (filtrados automáticamente por seller_id si es seller)
router.get('/dashboard', ctrl.dashboard);
router.get('/sales-by-period', ctrl.salesByPeriod);
router.get('/sales-by-seller', authorize('admin', 'supervisor'), ctrl.salesBySeller);
router.get('/sales-by-client', ctrl.salesByClient);
router.get('/top-products', ctrl.topProducts);
router.get('/pipeline', ctrl.pipelineSummary);
router.get('/accounts-receivable', authorize('admin', 'supervisor'), ctrl.accountsReceivable);
router.get('/financial-summary', authorize('admin', 'supervisor'), ctrl.financialSummary);

export default router;