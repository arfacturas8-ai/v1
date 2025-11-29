import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStats() {
  const stats = {
    users: await prisma.user.count(),
    communities: await prisma.community.count(),
    posts: await prisma.post.count(),
    comments: await prisma.comment.count(),
    votes: await prisma.vote.count(),
    memberships: await prisma.communityMember.count(),
  };

  console.log('\n📊 Database Statistics:\n');
  console.table(stats);

  // Get sample data
  console.log('\n📝 Sample Communities:');
  const communities = await prisma.community.findMany({ take: 5 });
  communities.forEach(c => {
    console.log(`  - ${c.displayName} (${c.memberCount} members)`);
  });

  console.log('\n📄 Recent Posts (sample):');
  const posts = await prisma.post.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { user: true, community: true }
  });
  posts.forEach(p => {
    console.log(`  - "${p.title}" in ${p.community.displayName} by ${p.user.username} (${p.commentCount} comments, score: ${p.score})`);
  });

  await prisma.$disconnect();
}

checkStats();
