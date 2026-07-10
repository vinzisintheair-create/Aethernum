import { Router } from 'express';
import { addAnnotation, verifyMemory, unverifyMemory } from '../controllers/collaboration';
import { authenticate } from '../middleware/auth';
import { requireTenantAccess } from '../middleware/tenant';

const router = Router({ mergeParams: true });

router.post('/:memoryId/annotations', authenticate, requireTenantAccess, addAnnotation);
router.post('/:memoryId/verify', authenticate, requireTenantAccess, verifyMemory);
router.post('/:memoryId/unverify', authenticate, requireTenantAccess, unverifyMemory);

export default router;
