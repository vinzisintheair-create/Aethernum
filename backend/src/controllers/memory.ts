import { Request, Response } from 'express';
import { prisma } from '../prisma';
import crypto from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2Client = process.env.R2_ACCESS_KEY_ID
  ? new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    })
  : null;

export const getMemories = async (req: Request, res: Response) => {
  try {
    const spaceId = req.currentSpaceId;

    if (!spaceId) {
      return res.status(400).json({ error: 'Family Space context is missing.' });
    }

    const memories = await prisma.memory.findMany({
      where: {
        familySpaceId: spaceId,
        isArchived: false
      },
      orderBy: {
        dateOccurred: 'desc'
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            username: true,
            profilePictureUrl: true,
            bio: true
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            date: true
          }
        },
        media: {
          select: {
            id: true,
            fileUrl: true,
            fileType: true,
            size: true
          }
        },
        annotations: {
          orderBy: {
            createdAt: 'asc'
          },
          include: {
            author: {
              select: {
                id: true,
                email: true,
                username: true,
                profilePictureUrl: true,
                bio: true
              }
            }
          }
        },
        verifications: {
          include: {
            verifier: {
              select: {
                id: true,
                email: true,
                username: true
              }
            }
          }
        }
      }
    });

    return res.status(200).json({ memories });
  } catch (error) {
    console.error('[Get Memories Error]:', error);
    return res.status(500).json({ error: 'Internal server error fetching memories.' });
  }
};

export const createMemory = async (req: Request, res: Response) => {
  try {
    const spaceId = req.currentSpaceId;
    const userId = req.userId;

    const { title, richTextStory, dateOccurred, location, eventId, albumIds, media } = req.body;

    if (!spaceId || !userId) {
      return res.status(400).json({ error: 'Context variables missing.' });
    }

    if (!title || !richTextStory || !dateOccurred) {
      return res.status(400).json({ error: 'Title, story narrative, and date occurred are required fields.' });
    }

    const parsedDate = new Date(dateOccurred);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid dateOccurred timestamp format.' });
    }

    // Execute creation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the memory
      const memory = await tx.memory.create({
        data: {
          familySpaceId: spaceId,
          authorId: userId,
          title: title.trim(),
          richTextStory: richTextStory.trim(),
          dateOccurred: parsedDate,
          location: location ? location.trim() : null,
          eventId: eventId || null,
        }
      });

      // 2. Create media items if present
      if (media && Array.isArray(media) && media.length > 0) {
        await tx.media.createMany({
          data: media.map((item: any) => ({
            memoryId: memory.id,
            fileUrl: item.fileUrl,
            fileType: item.fileType, // IMAGE, VIDEO, DOCUMENT
            size: Number(item.size) || 0
          }))
        });
      }

      // 3. Link to albums if present
      if (albumIds && Array.isArray(albumIds) && albumIds.length > 0) {
        await tx.albumMemory.createMany({
          data: albumIds.map((albumId: string) => ({
            albumId,
            memoryId: memory.id
          }))
        });
      }

      // Update storage used in space
      if (media && Array.isArray(media)) {
        const totalSize = media.reduce((acc: number, item: any) => acc + (Number(item.size) || 0), 0);
        if (totalSize > 0) {
          await tx.familySpace.update({
            where: { id: spaceId },
            data: {
              storageUsed: {
                increment: totalSize
              }
            }
          });
        }
      }

      return memory;
    });

    return res.status(201).json({
      message: 'Memory archived successfully.',
      memory: result
    });
  } catch (error) {
    console.error('[Create Memory Error]:', error);
    return res.status(500).json({ error: 'Internal server error archiving family memory.' });
  }
};

export const getEvents = async (req: Request, res: Response) => {
  try {
    const spaceId = req.currentSpaceId;

    if (!spaceId) {
      return res.status(400).json({ error: 'Family Space context is missing.' });
    }

    const events = await prisma.event.findMany({
      where: { familySpaceId: spaceId },
      orderBy: { date: 'asc' }
    });

    return res.status(200).json({ events });
  } catch (error) {
    console.error('[Get Events Error]:', error);
    return res.status(500).json({ error: 'Internal server error fetching space milestones.' });
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const spaceId = req.currentSpaceId;
    const { title, date, location, description } = req.body;

    if (!spaceId) {
      return res.status(400).json({ error: 'Family Space context is missing.' });
    }

    if (!title || !date) {
      return res.status(400).json({ error: 'Milestone title and date are required fields.' });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid milestone date format.' });
    }

    const event = await prisma.event.create({
      data: {
        familySpaceId: spaceId,
        title: title.trim(),
        date: parsedDate,
        location: location ? location.trim() : null,
        description: description ? description.trim() : null
      }
    });

    return res.status(201).json({
      message: 'Milestone event created successfully.',
      event
    });
  } catch (error) {
    console.error('[Create Event Error]:', error);
    return res.status(500).json({ error: 'Internal server error creating event milestone.' });
  }
};

export const createUploadTicket = async (req: Request, res: Response) => {
  try {
    const spaceId = req.currentSpaceId;
    const { fileName, fileType, fileSize } = req.body;

    if (!spaceId) {
      return res.status(400).json({ error: 'Family Space context is missing.' });
    }

    if (!fileName || !fileType || !fileSize) {
      return res.status(400).json({ error: 'File parameters (fileName, fileType, fileSize) are required.' });
    }

    // Generate unique file path
    const fileKey = `spaces/${spaceId}/media/${crypto.randomUUID()}-${fileName}`;

    // Determine type enum
    let dbType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' = 'DOCUMENT';
    if (fileType.startsWith('image/')) {
      dbType = 'IMAGE';
    } else if (fileType.startsWith('video/')) {
      dbType = 'VIDEO';
    }

    if (r2Client && process.env.R2_BUCKET_NAME) {
      // Generate real Cloudflare R2 Presigned Upload URL
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileKey,
        ContentType: fileType,
      });

      const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
      const publicBaseUrl = process.env.R2_PUBLIC_URL || '';
      const fileUrl = `${publicBaseUrl}/${fileKey}`;

      return res.status(200).json({
        uploadUrl: presignedUrl,
        fileUrl,
        fileKey,
        fileType: dbType,
        size: Number(fileSize)
      });
    }

    // Fallback to local simulated ticket if R2 variables are not in env
    const fileUrl = `/mock-storage/${fileKey}`;
    return res.status(200).json({
      uploadUrl: `https://mock-r2-upload.aeternum.internal/${fileKey}?signature=valid_sig_dev`,
      fileUrl,
      fileKey,
      fileType: dbType,
      size: Number(fileSize)
    });
  } catch (error) {
    console.error('[Create Upload Ticket Error]:', error);
    return res.status(500).json({ error: 'Internal server error generating media upload ticket.' });
  }
};
