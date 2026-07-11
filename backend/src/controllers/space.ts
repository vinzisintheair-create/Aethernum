import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma';

export const createSpace = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Friend Space name is required.' });
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
      message: 'Friend Space created successfully.',
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
    return res.status(500).json({ error: 'Internal server error creating Friend Space.' });
  }
};

export const getSpace = async (req: Request, res: Response) => {
  try {
    const spaceId = req.currentSpaceId;

    if (!spaceId) {
      return res.status(400).json({ error: 'Friend Space context is missing.' });
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
                username: true,
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
      return res.status(404).json({ error: 'Friend Space not found.' });
    }

    // Map memberships structure into custom list response
    const members = space.memberships.map((m) => ({
      id: m.member.id,
      email: m.member.email,
      username: m.member.username,
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
    return res.status(500).json({ error: 'Internal server error fetching Friend Space details.' });
  }
};

export const createInvitation = async (req: Request, res: Response) => {
  try {
    const spaceId = req.currentSpaceId;
    const roleInSpace = req.userRoleInSpace;
    const { email } = req.body;

    if (!spaceId) {
      return res.status(400).json({ error: 'Friend Space context is missing.' });
    }

    // Strict Admin check enforcement
    if (roleInSpace !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied: Only Friend Space Administrators can invite new circle friends.' });
    }

    if (!email || email.trim() === '') {
      return res.status(400).json({ error: 'Invitee email address is required.' });
    }

    const inviteeEmail = email.toLowerCase().trim();

    // Check if member already exists
    const existingMember = await prisma.member.findUnique({
      where: { email: inviteeEmail }
    });

    let targetMemberId = '';
    let tempPassword: string | null = null;

    if (!existingMember) {
      // 1. Create a new user account for the invited friend
      tempPassword = 'temp-' + crypto.randomBytes(3).toString('hex');
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(tempPassword, saltRounds);

      const newMember = await prisma.member.create({
        data: {
          email: inviteeEmail,
          passwordHash,
          mustResetPassword: true // Prompt them to update password on login
        }
      });
      targetMemberId = newMember.id;
    } else {
      targetMemberId = existingMember.id;
    }

    // 2. Link member to this space if they are not already a member
    const existingMembership = await prisma.spaceMembership.findUnique({
      where: {
        memberId_familySpaceId: {
          memberId: targetMemberId,
          familySpaceId: spaceId
        }
      }
    });

    if (existingMembership) {
      return res.status(400).json({ error: 'User is already a member of this Friend Space.' });
    }

    await prisma.spaceMembership.create({
      data: {
        memberId: targetMemberId,
        familySpaceId: spaceId,
        role: 'MEMBER'
      }
    });

    // 3. Generate secure invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days expiration

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
      message: 'Invitation and account created successfully.',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        token: invitation.token,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        tempPassword // Return temp password to administrator
      }
    });
  } catch (error) {
    console.error('[Create Invitation Error]:', error);
    return res.status(500).json({ error: 'Internal server error generating Friend Space invitation.' });
  }
};

export const updateSpace = async (req: Request, res: Response) => {
  try {
    const spaceId = req.currentSpaceId;
    const roleInSpace = req.userRoleInSpace;
    const { name } = req.body;

    if (!spaceId) {
      return res.status(400).json({ error: 'Friend Space context is missing.' });
    }

    if (roleInSpace !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied: Only Friend Space Administrators can edit vault parameters.' });
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Friend Space name is required.' });
    }

    const updatedSpace = await prisma.familySpace.update({
      where: { id: spaceId },
      data: { name: name.trim() }
    });

    return res.status(200).json({
      message: 'Friend Space name updated successfully.',
      space: {
        id: updatedSpace.id,
        name: updatedSpace.name
      }
    });
  } catch (error) {
    console.error('[Update Space Error]:', error);
    return res.status(500).json({ error: 'Internal server error updating Friend Space settings.' });
  }
};
