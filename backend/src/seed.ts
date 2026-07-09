import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting database seeding...');

  // 1. Clean up any existing data
  await prisma.serverSession.deleteMany({});
  await prisma.media.deleteMany({});
  await prisma.albumMemory.deleteMany({});
  await prisma.memory.deleteMany({});
  await prisma.spaceMembership.deleteMany({});
  await prisma.spaceInvitation.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.album.deleteMany({});
  await prisma.familySpace.deleteMany({});
  await prisma.member.deleteMany({});

  // 2. Create the Member
  const passwordHash = await bcrypt.hash('password123', 12);
  const member = await prisma.member.create({
    data: {
      email: 'sarah@sterling.com',
      passwordHash,
      bio: 'Sarah Sterling, archive circle moderator and memory preserver.',
      profilePictureUrl: null
    }
  });
  console.log(`[Seed] Created Member: ${member.email}`);

  // 3. Create the FamilySpace
  const space = await prisma.familySpace.create({
    data: {
      id: 'sterling-vault-1',
      name: 'The Sterling Circle',
      storageLimit: 5368709120n, // 5 GB
      storageUsed: 0n
    }
  });
  console.log(`[Seed] Created FamilySpace: ${space.name} (${space.id})`);

  // 4. Create the SpaceMembership (Sarah is ADMIN)
  const membership = await prisma.spaceMembership.create({
    data: {
      memberId: member.id,
      familySpaceId: space.id,
      role: 'ADMIN'
    }
  });
  console.log(`[Seed] Created SpaceMembership for Sarah as ADMIN`);

  // 5. Create some Events (Milestones)
  const event1 = await prisma.event.create({
    data: {
      id: 'event-wedding-1941',
      familySpaceId: space.id,
      title: "Great Grandmother Mary's Wedding",
      date: new Date('1941-06-14T00:00:00Z'),
      location: 'Halifax, Nova Scotia',
      description: 'The marriage celebration of Mary and Edward Sterling during World War II.'
    }
  });

  const event2 = await prisma.event.create({
    data: {
      id: 'event-cabin-1978',
      familySpaceId: space.id,
      title: "Lake Cabin Construction",
      date: new Date('1978-08-15T00:00:00Z'),
      location: 'Windermere, British Columbia',
      description: 'The summer Uncle James and Grandfather built the logs using traditional axes.'
    }
  });
  console.log('[Seed] Created Event Milestones');

  // 6. Create Memories
  const memory1 = await prisma.memory.create({
    data: {
      familySpaceId: space.id,
      authorId: member.id,
      eventId: event1.id,
      title: "Great Grandmother Mary's Wedding Quilt",
      richTextStory: 'Handcrafted by our group over six months using fabric remnants from old clothes. The details in the borders symbolize health and longevity. It has been passed down through three generations and remains a centerpiece in the library.',
      dateOccurred: new Date('1941-06-14T00:00:00Z'),
      location: 'Halifax, Nova Scotia',
      isFavorite: true
    }
  });

  const memory2 = await prisma.memory.create({
    data: {
      familySpaceId: space.id,
      authorId: member.id,
      eventId: event2.id,
      title: "Building the Cabin by Lake Windermere",
      richTextStory: 'The summer Uncle James and Grandfather built the logs using nothing but traditional woodworking axes. They stayed in canvas tents for six weeks. This space represents our friend group quiet retreat, built entirely by hand and preserved in its original layout.',
      dateOccurred: new Date('1978-08-01T00:00:00Z'),
      location: 'Windermere, British Columbia'
    }
  });
  console.log('[Seed] Created Memories');

  // 7. Add Media items
  await prisma.media.create({
    data: {
      memoryId: memory1.id,
      fileUrl: '/mock-storage/spaces/sterling-vault-1/media/quilt1.jpg',
      fileType: 'IMAGE',
      size: 450123
    }
  });

  await prisma.media.create({
    data: {
      memoryId: memory2.id,
      fileUrl: '/mock-storage/spaces/sterling-vault-1/media/cabin_photo.jpg',
      fileType: 'IMAGE',
      size: 1048576
    }
  });
  console.log('[Seed] Added Media links');

  console.log('[Seed] Database seeding completed successfully! Ready for dev environment testing.');
}

main()
  .catch((e) => {
    console.error('[Seed Error]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
