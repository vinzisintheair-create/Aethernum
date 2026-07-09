import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../prisma';

export const createSpace = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Family Space name is required.' });
    }

    // Execute in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the family space
      const space = await tx.familySpace.create({
        data: {
          name: name.trim()
        }
      });

      // 2. Associate the creator as ADMIN
      const membership = await tx.spaceMembership.create({
        data: {
          memberId: userId,
          familySpaceId: space.id,
          role: 'ADMIN'
        }
      });

      return { space, membership };
    });

    // BigInt needs serialization helper or converting to String
    return res.status(201).json({
      message: 'Family Space created successfully.',
      space: {
        id: result.space.id,
        name: result.space.name,
        storageLimit: result.space.storageLimit.toString(),
        storageUsed: result.space.storageUsed.toString(),
        createdAt: result.space.createdAt,
        updatedAt: result.space.updatedAt
      }
    });
  } catch (error) {
    console.error('[Create Space Error]:', error);
    return res.status(500).json({ error: 'Internal server error creating Family Space.' });
  }
};

export const getSpace = async (req: Request, res: Response) => {
  try {
    const spaceId = req.currentSpaceId;

    if (!spaceId) {
      return res.status(400).json({ error: 'Family Space context is missing.' });
    }

    // Fetch space details and its member profiles
    const space = await prisma.familySpace.findUnique({
      where: { id: spaceId },
      include: {
        memberships: {
          include: {
            member: {
              select: {
                id: true,
                email: true,
                profilePictureUrl: true,
                bio: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    if (!space) {
      return res.status(404).json({ error: 'Family Space not found.' });
    }

    // Map memberships structure into custom list response
    const members = space.memberships.map((m) => ({
      id: m.member.id,
      email: m.member.email,
      profilePictureUrl: m.member.profilePictureUrl,
      bio: m.member.bio,
      role: m.role,
      joinedAt: m.joinedAt
    }));

    return res.status(200).json({
      space: {
        id: space.id,
        name: space.name,
        storageLimit: space.storageLimit.toString(),
        storageUsed: space.storageUsed.toString(),
        createdAt: space.createdAt,
        updatedAt: space.updatedAt,
        members
      }
    });
  } catch (error) {
    console.error('[Get Space Error]:', error);
    return res.status(500).json({ error: 'Internal server error fetching Family Space details.' });
  }
};

export const createInvitation = async (req: Request, res: Response) => {
  try {
    const spaceId = req.currentSpaceId;
    const roleInSpace = req.userRoleInSpace;
    const { email } = req.body;

    if (!spaceId) {
      return res.status(400).json({ error: 'Family Space context is missing.' });
    }

    // Strict Admin check enforcement
    if (roleInSpace !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied: Only Family Space Administrators can invite new members.' });
    }

    if (!email || email.trim() === '') {
      return res.status(400).json({ error: 'Invitee email address is required.' });
    }

    const inviteeEmail = email.toLowerCase().trim();

    // Check if invitee is already a member
    const existingMembership = await prisma.spaceMembership.findFirst({
      where: {
        familySpaceId: spaceId,
        member: {
          email: inviteeEmail
        }
      }
    });

    if (existingMembership) {
      return res.status(400).json({ error: 'User is already a member of this Family Space.' });
    }

    // Generate secure 32 byte unique token string
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days expiration

    // Persist invitation to database
    const invitation = await prisma.spaceInvitation.create({
      data: {
        familySpaceId: spaceId,
        email: inviteeEmail,
        token,
        expiresAt,
        role: 'MEMBER'
      }
    });

    return res.status(201).json({
      message: 'Invitation generated successfully.',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        token: invitation.token,
        role: invitation.role,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    console.error('[Create Invitation Error]:', error);
    return res.status(500).json({ error: 'Internal server error generating Family Space invitation.' });
  }
};
