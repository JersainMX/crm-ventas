import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import clientRoutes from './client.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import quoteRoutes from './quote.routes.js';
import orderRoutes from './order.routes.js';
import invoiceRoutes from './invoice.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/clients', clientRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/quotes', quoteRoutes);
router.use('/orders', orderRoutes);
router.use('/invoices', invoiceRoutes);

export default router;