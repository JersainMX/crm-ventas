import { Router } from 'express';
import * as ctrl from '../controllers/product.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createProductSchema, updateProductSchema } from '../validators/product.validator.js';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', authorize('admin', 'supervisor'), validate(createProductSchema), ctrl.create);
router.put('/:id', authorize('admin', 'supervisor'), validate(updateProductSchema), ctrl.update);
router.delete('/:id', authorize('admin', 'supervisor'), ctrl.remove);

export default router;