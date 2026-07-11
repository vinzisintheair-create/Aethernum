import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const createAlbum = async (req: Request, res: Response) => {
  try {
    const spaceId = req.currentSpaceId;
    const userId = req.userId;
    const { title, description } = req.body;

    if (!spaceId || !userId) {
      return res.status(400).json({ error: 'Circle Space context is missing.' });
    }

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Album title is required.' });
    }

    const album = await prisma.album.create({
      data: {
        familySpaceId: spaceId,
        title: title.trim(),
        description: description ? description.trim() : null
      }
    });

    return res.status(201).json({
      message: 'Album created successfully.',
      album
    });
  } catch (error) {
    console.error('[Create Album Error]:', error);
    return res.status(500).json({ error: 'Internal server error creating album.' });
  }
};

export const getAlbums = async (req: Request, res: Response) => {
  try {
    const spaceId = req.currentSpaceId;

    if (!spaceId) {
      return res.status(400).json({ error: 'Circle Space context is missing.' });
    }

    const albums = await prisma.album.findMany({
      where: {
        familySpaceId: spaceId
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: {
            memories: true
          }
        }
      }
    });

    // Map response structures to match layout parameters
    const mappedAlbums = albums.map((album) => ({
      id: album.id,
      title: album.title,
      description: album.description,
      coverImageUrl: album.coverImageUrl,
      createdAt: album.createdAt,
      count: album._count.memories
    }));

    return res.status(200).json({ albums: mappedAlbums });
  } catch (error) {
    console.error('[Get Albums Error]:', error);
    return res.status(500).json({ error: 'Internal server error fetching albums.' });
  }
};

export const getAlbumDetails = async (req: Request, res: Response) => {
  try {
    const { albumId } = req.params;
    const spaceId = req.currentSpaceId;

    if (!spaceId) {
      return res.status(400).json({ error: 'Circle Space context is missing.' });
    }

    const album = await prisma.album.findFirst({
      where: {
        id: albumId,
        familySpaceId: spaceId
      },
      include: {
        memories: {
          include: {
            memory: {
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
            }
          }
        }
      }
    });

    if (!album) {
      return res.status(404).json({ error: 'Target album not found in this circle space.' });
    }

    const memories = album.memories.map((am) => am.memory);

    return res.status(200).json({
      album: {
        id: album.id,
        title: album.title,
        description: album.description,
        coverImageUrl: album.coverImageUrl,
        createdAt: album.createdAt,
        memories
      }
    });
  } catch (error) {
    console.error('[Get Album Details Error]:', error);
    return res.status(500).json({ error: 'Internal server error fetching album details.' });
  }
};
