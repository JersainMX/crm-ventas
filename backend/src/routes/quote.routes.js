import { Router } from 'express';
import * as ctrl from '../controllers/quote.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createQuoteSchema,
  updateQuoteSchema,
  changeQuoteStatusSchema,
} from '../validators/quote.validator.js';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', validate(createQuoteSchema), ctrl.create);
router.put('/:id', validate(updateQuoteSchema), ctrl.update);
router.patch('/:id/status', validate(changeQuoteStatusSchema), ctrl.changeStatus);
router.post('/:id/convert', authorize('admin', 'supervisor', 'seller'), ctrl.convertToOrder);
router.delete('/:id', ctrl.remove);

export default router;