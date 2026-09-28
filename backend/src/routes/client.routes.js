import { Router } from 'express';
import * as ctrl from '../controllers/client.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createClientSchema, updateClientSchema, contactSchema,
} from '../validators/client.validator.js';

const router = Router();
router.use(authenticate);

// Clientes
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', validate(createClientSchema), ctrl.create);
router.put('/:id', validate(updateClientSchema), ctrl.update);
router.delete('/:id', authorize('admin', 'supervisor'), ctrl.remove);

// Contactos anidados
router.get('/:id/contacts', ctrl.listContacts);
router.post('/:id/contacts', validate(contactSchema), ctrl.createContact);
router.put('/:id/contacts/:contactId', validate(contactSchema), ctrl.updateContact);
router.delete('/:id/contacts/:contactId', ctrl.deleteContact);

export default router;