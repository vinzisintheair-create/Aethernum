import { Router } from 'express';
import { createSpace, getSpace, createInvitation, updateSpace } from '../controllers/space';
import { getMemories, createMemory, getEvents, createUploadTicket } from '../controllers/memory';
import { createAlbum, getAlbums, getAlbumDetails } from '../controllers/album';
import { authenticate } from '../middleware/auth';
import { requireTenantAccess } from '../middleware/tenant';

const router = Router();

// Create Space endpoint - open to any authenticated member
router.post('/', authenticate, createSpace);

// Scoped tenant endpoints
router.get('/:spaceId', authenticate, requireTenantAccess, getSpace);
router.patch('/:spaceId', authenticate, requireTenantAccess, updateSpace);
router.post('/:spaceId/invitations', authenticate, requireTenantAccess, createInvitation);
router.get('/:spaceId/memories', authenticate, requireTenantAccess, getMemories);
router.post('/:spaceId/memories', authenticate, requireTenantAccess, createMemory);
router.get('/:spaceId/events', authenticate, requireTenantAccess, getEvents);
router.post('/:spaceId/media/upload-ticket', authenticate, requireTenantAccess, createUploadTicket);

// Albums endpoints
router.get('/:spaceId/albums', authenticate, requireTenantAccess, getAlbums);
router.post('/:spaceId/albums', authenticate, requireTenantAccess, createAlbum);
router.get('/:spaceId/albums/:albumId', authenticate, requireTenantAccess, getAlbumDetails);

export default router;
