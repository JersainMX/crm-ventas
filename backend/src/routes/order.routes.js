import { Router } from 'express';
import * as ctrl from '../controllers/order.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createOrderSchema,
  changeOrderStatusSchema,
} from '../validators/order.validator.js';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', validate(createOrderSchema), ctrl.create);
router.patch('/:id/status', validate(changeOrderStatusSchema), ctrl.changeStatus);
router.delete('/:id', authorize('admin', 'supervisor'), ctrl.remove);

export default router;