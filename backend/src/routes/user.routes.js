import { Router } from 'express';
import * as ctrl from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createUserSchema, updateUserSchema, changePasswordSchema,
} from '../validators/user.validator.js';

const router = Router();

// Todas las rutas requieren autenticación + rol admin
router.use(authenticate, authorize('admin'));

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', validate(createUserSchema), ctrl.create);
router.put('/:id', validate(updateUserSchema), ctrl.update);
router.patch('/:id/password', validate(changePasswordSchema), ctrl.changePassword);
router.patch('/:id/toggle-active', ctrl.toggleActive);
router.delete('/:id', ctrl.remove);

export default router;