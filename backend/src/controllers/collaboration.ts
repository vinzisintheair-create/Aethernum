import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const addAnnotation = async (req: Request, res: Response) => {
  try {
    const { memoryId } = req.params;
    const { content } = req.body;
    const userId = req.userId;
    const spaceId = req.currentSpaceId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Annotation narrative content is required.' });
    }

    // 1. Verify target memory context matches the current circle space boundary
    const memory = await prisma.memory.findFirst({
      where: {
        id: memoryId,
        familySpaceId: spaceId
      }
    });

    if (!memory) {
      return res.status(404).json({ error: 'Target memory not found in this circle space.' });
    }

    // 2. Persist the archival note/annotation
    const annotation = await prisma.annotation.create({
      data: {
        memoryId,
        authorId: userId,
        content: content.trim()
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            profilePictureUrl: true,
            bio: true
          }
        }
      }
    });

    return res.status(201).json({
      message: 'Archival annotation appended successfully.',
      annotation
    });
  } catch (error) {
    console.error('[Add Annotation Error]:', error);
    return res.status(500).json({ error: 'Internal server error appending annotation.' });
  }
};

export const verifyMemory = async (req: Request, res: Response) => {
  try {
    const { memoryId } = req.params;
    const userId = req.userId;
    const spaceId = req.currentSpaceId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // 1. Verify target memory context matches the current circle space boundary
    const memory = await prisma.memory.findFirst({
      where: {
        id: memoryId,
        familySpaceId: spaceId
      }
    });

    if (!memory) {
      return res.status(404).json({ error: 'Target memory not found in this circle space.' });
    }

    // 2. Register or update the verification co-signature
    await prisma.verification.upsert({
      where: {
        memoryId_verifierId: {
          memoryId,
          verifierId: userId
        }
      },
      create: {
        memoryId,
        verifierId: userId
      },
      update: {}
    });

    return res.status(200).json({
      message: 'Memory verified and co-signed successfully.'
    });
  } catch (error) {
    console.error('[Verify Memory Error]:', error);
    return res.status(500).json({ error: 'Internal server error co-signing memory.' });
  }
};

export const unverifyMemory = async (req: Request, res: Response) => {
  try {
    const { memoryId } = req.params;
    const userId = req.userId;
    const spaceId = req.currentSpaceId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // 1. Verify target memory context matches the current circle space boundary
    const memory = await prisma.memory.findFirst({
      where: {
        id: memoryId,
        familySpaceId: spaceId
      }
    });

    if (!memory) {
      return res.status(404).json({ error: 'Target memory not found in this circle space.' });
    }

    // 2. Retract verification record if present
    await prisma.verification.delete({
      where: {
        memoryId_verifierId: {
          memoryId,
          verifierId: userId
        }
      }
    }).catch(() => {
      // Suppress deletion error in case it was already deleted
    });

    return res.status(200).json({
      message: 'Circle verification retracted successfully.'
    });
  } catch (error) {
    console.error('[Unverify Memory Error]:', error);
    return res.status(500).json({ error: 'Internal server error retracting verification.' });
  }
};
