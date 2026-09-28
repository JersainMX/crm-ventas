import { Router } from 'express';
import * as ctrl from '../controllers/category.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { categorySchema, updateCategorySchema } from '../validators/category.validator.js';

const router = Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', authorize('admin', 'supervisor'), validate(categorySchema), ctrl.create);
router.put('/:id', authorize('admin', 'supervisor'), validate(updateCategorySchema), ctrl.update);
router.delete('/:id', authorize('admin', 'supervisor'), ctrl.remove);

export default router;