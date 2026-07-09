import { Router } from 'express';
import { register, login, logout, me, resetPassword } from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.post('/reset-password', authenticate, resetPassword);

export default router;
