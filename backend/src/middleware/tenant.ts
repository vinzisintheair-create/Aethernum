import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export const requireTenantAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required before tenant check.' });
    }

    // Extract space ID from header 'x-space-id' or path params 'spaceId'
    const spaceIdHeader = req.headers['x-space-id'];
    const spaceIdParam = req.params.spaceId;
    const familySpaceId = (spaceIdHeader as string) || spaceIdParam;

    if (!familySpaceId) {
      return res.status(400).json({ error: 'Family Space ID context is missing.' });
    }

    // Query space membership database record
    const membership = await prisma.spaceMembership.findUnique({
      where: {
        memberId_familySpaceId: {
          memberId: userId,
          familySpaceId: familySpaceId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this Friend Space.' });
    }

    // Bind parameters to request context for downstream routing
    req.currentSpaceId = familySpaceId;
    req.userRoleInSpace = membership.role as 'ADMIN' | 'MEMBER';

    next();
  } catch (error) {
    console.error('[Tenant Middleware Error]:', error);
    return res.status(500).json({ error: 'Internal server error validating tenant isolation.' });
  }
};
