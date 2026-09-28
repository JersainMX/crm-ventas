import { Router } from 'express';
import * as ctrl from '../controllers/invoice.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createInvoiceSchema,
  registerPaymentSchema,
  voidInvoiceSchema,
} from '../validators/invoice.validator.js';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.get('/:id/payments', ctrl.listPayments);

router.post('/', validate(createInvoiceSchema), ctrl.createFromOrder);
router.post('/:id/payments', validate(registerPaymentSchema), ctrl.registerPayment);
router.patch('/:id/void', authorize('admin', 'supervisor'),
  validate(voidInvoiceSchema), ctrl.voidInvoice);

export default router;