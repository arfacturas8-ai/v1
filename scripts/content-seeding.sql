-- CRYB Platform Content Seeding Script
-- This script creates initial communities, users, posts, and content to make the platform immediately engaging

-- Create admin user
INSERT INTO users (id, username, display_name, email, password_hash, email_verified, is_admin, avatar_url, bio, created_at, updated_at)
VALUES (
  'admin-user-001',
  'cryb_admin',
  'CRYB Admin',
  'admin@cryb.ai',
  '$2b$10$K7L8R9X3qP2S5T6U7V8W9.uQtY5Z6A7B8C9D0E1F2G3H4I5J6K7L8M', -- bcrypt hash for 'admin123'
  true,
  true,
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
  'Welcome to CRYB! I''m here to help you get started and answer any questions.',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create moderator users
INSERT INTO users (id, username, display_name, email, password_hash, email_verified, is_admin, avatar_url, bio, created_at, updated_at)
VALUES 
(
  'mod-user-001',
  'gaming_mod',
  'Gaming Moderator',
  'gaming.mod@cryb.ai',
  '$2b$10$K7L8R9X3qP2S5T6U7V8W9.uQtY5Z6A7B8C9D0E1F2G3H4I5J6K7L8M',
  true,
  false,
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face',
  'Gaming enthusiast and community moderator. Always ready to discuss the latest games!',
  NOW(),
  NOW()
),
(
  'mod-user-002',
  'tech_wizard',
  'Tech Wizard',
  'tech.mod@cryb.ai',
  '$2b$10$K7L8R9X3qP2S5T6U7V8W9.uQtY5Z6A7B8C9D0E1F2G3H4I5J6K7L8M',
  true,
  false,
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  'Software engineer passionate about emerging technologies and helping others learn.',
  NOW(),
  NOW()
),
(
  'mod-user-003',
  'crypto_guru',
  'Crypto Guru',
  'crypto.mod@cryb.ai',
  '$2b$10$K7L8R9X3qP2S5T6U7V8W9.uQtY5Z6A7B8C9D0E1F2G3H4I5J6K7L8M',
  true,
  false,
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face',
  'Blockchain enthusiast and DeFi expert. Here to guide you through the crypto space safely.',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create sample active users
INSERT INTO users (id, username, display_name, email, password_hash, email_verified, avatar_url, bio, created_at, updated_at)
VALUES 
(
  'user-001',
  'gamer_alex',
  'Alex the Gamer',
  'alex@example.com',
  '$2b$10$K7L8R9X3qP2S5T6U7V8W9.uQtY5Z6A7B8C9D0E1F2G3H4I5J6K7L8M',
  true,
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&fit=crop&crop=face',
  'Passionate gamer who loves RPGs and competitive multiplayer games.',
  NOW() - INTERVAL '30 days',
  NOW()
),
(
  'user-002',
  'techie_sarah',
  'Sarah Code',
  'sarah@example.com',
  '$2b$10$K7L8R9X3qP2S5T6U7V8W9.uQtY5Z6A7B8C9D0E1F2G3H4I5J6K7L8M',
  true,
  'https://images.unsplash.com/photo-1494790108755-2616b512e29?w=400&h=400&fit=crop&crop=face',
  'Full-stack developer interested in blockchain and AI technologies.',
  NOW() - INTERVAL '25 days',
  NOW()
),
(
  'user-003',
  'crypto_mike',
  'Mike Crypto',
  'mike@example.com',
  '$2b$10$K7L8R9X3qP2S5T6U7V8W9.uQtY5Z6A7B8C9D0E1F2G3H4I5J6K7L8M',
  true,
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
  'DeFi enthusiast and early adopter of new crypto projects.',
  NOW() - INTERVAL '20 days',
  NOW()
),
(
  'user-004',
  'artist_luna',
  'Luna Arts',
  'luna@example.com',
  '$2b$10$K7L8R9X3qP2S5T6U7V8W9.uQtY5Z6A7B8C9D0E1F2G3H4I5J6K7L8M',
  true,
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
  'Digital artist exploring NFTs and blockchain-based art platforms.',
  NOW() - INTERVAL '15 days',
  NOW()
),
(
  'user-005',
  'music_producer',
  'Beat Master',
  'beats@example.com',
  '$2b$10$K7L8R9X3qP2S5T6U7V8W9.uQtY5Z6A7B8C9D0E1F2G3H4I5J6K7L8M',
  true,
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f5d?w=400&h=400&fit=crop&crop=face',
  'Music producer creating beats and exploring decentralized music platforms.',
  NOW() - INTERVAL '10 days',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create default communities
INSERT INTO communities (id, name, display_name, description, is_public, is_nsfw, rules, image_url, banner_url, member_count, created_at, updated_at)
VALUES 
(
  'community-general',
  'general',
  'General Discussion',
  'Welcome to CRYB! This is the place for general conversations, introductions, and community announcements. Share what''s on your mind and connect with fellow community members.',
  true,
  false,
  '[
    "Be respectful and kind to all community members",
    "No spam, self-promotion, or repetitive content",
    "Use appropriate channels for specific topics",
    "No harassment, hate speech, or discrimination",
    "Keep discussions constructive and on-topic"
  ]'::jsonb,
  'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=400&fit=crop',
  0,
  NOW() - INTERVAL '35 days',
  NOW()
),
(
  'community-gaming',
  'gaming',
  'Gaming Central',
  'Everything gaming! Discuss your favorite games, share gameplay clips, find gaming partners, and stay updated on the latest gaming news and releases.',
  true,
  false,
  '[
    "No cheating, hacking, or exploit discussions",
    "Mark spoilers appropriately",
    "No toxic behavior or griefing",
    "Respect different gaming preferences and platforms",
    "Share gaming content and experiences constructively"
  ]'::jsonb,
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop',
  0,
  NOW() - INTERVAL '32 days',
  NOW()
),
(
  'community-technology',
  'technology',
  'Tech Talk',
  'Discuss the latest in technology, programming, AI, and innovation. Share projects, ask for help, and explore the future of tech together.',
  true,
  false,
  '[
    "Keep discussions technical and informative",
    "Provide context and sources for claims",
    "Help others learn and grow",
    "No piracy or illegal content sharing",
    "Respect intellectual property and licenses"
  ]'::jsonb,
  'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop',
  0,
  NOW() - INTERVAL '30 days',
  NOW()
),
(
  'community-crypto',
  'crypto',
  'Crypto & DeFi',
  'Explore cryptocurrency, DeFi protocols, NFTs, and blockchain technology. Share insights, discuss market trends, and learn about the decentralized future.',
  true,
  false,
  '[
    "No financial advice - only educational content",
    "Disclose any conflicts of interest",
    "No pump and dump schemes or scams",
    "Verify information before sharing",
    "Respect different investment strategies"
  ]'::jsonb,
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=1200&h=400&fit=crop',
  0,
  NOW() - INTERVAL '28 days',
  NOW()
),
(
  'community-creative',
  'creative',
  'Creative Corner',
  'Share your art, music, writing, and creative projects. Get feedback, collaborate with other creators, and showcase your talents to the community.',
  true,
  false,
  '[
    "Respect creative work and intellectual property",
    "Provide constructive feedback only",
    "Credit original creators appropriately",
    "No art theft or unauthorized use",
    "Support and encourage fellow creators"
  ]'::jsonb,
  'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
  0,
  NOW() - INTERVAL '25 days',
  NOW()
),
(
  'community-help',
  'help',
  'Help & Support',
  'Need help with CRYB or have questions? This is your go-to place for support, tutorials, and community assistance.',
  true,
  false,
  '[
    "Search existing posts before asking questions",
    "Provide clear and detailed problem descriptions",
    "Be patient with community helpers",
    "Share solutions when you find them",
    "Help others when you can"
  ]'::jsonb,
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&h=400&fit=crop',
  0,
  NOW() - INTERVAL '35 days',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add community memberships
INSERT INTO community_members (community_id, user_id, joined_at)
SELECT c.id, u.id, NOW() - INTERVAL (RANDOM() * 30) || ' days'
FROM communities c
CROSS JOIN users u
WHERE c.id IN ('community-general', 'community-gaming', 'community-technology', 'community-crypto', 'community-creative', 'community-help')
ON CONFLICT (community_id, user_id) DO NOTHING;

-- Add community moderators
INSERT INTO community_moderators (community_id, user_id, permissions, added_at)
VALUES 
('community-general', 'admin-user-001', '{"all": true}'::jsonb, NOW() - INTERVAL '35 days'),
('community-gaming', 'mod-user-001', '{"pin": true, "lock": true, "remove": true}'::jsonb, NOW() - INTERVAL '32 days'),
('community-technology', 'mod-user-002', '{"pin": true, "lock": true, "remove": true}'::jsonb, NOW() - INTERVAL '30 days'),
('community-crypto', 'mod-user-003', '{"pin": true, "lock": true, "remove": true}'::jsonb, NOW() - INTERVAL '28 days'),
('community-creative', 'admin-user-001', '{"all": true}'::jsonb, NOW() - INTERVAL '25 days'),
('community-help', 'admin-user-001', '{"all": true}'::jsonb, NOW() - INTERVAL '35 days')
ON CONFLICT (community_id, user_id) DO NOTHING;

-- Create sample posts
INSERT INTO posts (id, title, content, url, community_id, user_id, type, image_url, score, is_pinned, created_at, updated_at)
VALUES 
(
  'post-welcome-001',
  'Welcome to CRYB! 🎉',
  'Hey everyone! Welcome to CRYB, the next-generation community platform that combines the best of Discord and Reddit.

Here you can:
- **Chat in real-time** with voice and video support
- **Create and join communities** around your interests  
- **Vote on content** to surface the best discussions
- **Explore Web3 features** including NFT integration

We''re excited to have you here! Drop a comment below to introduce yourself and let us know what communities you''re most excited about. 

If you have any questions, check out our Help & Support community or reach out to our amazing moderator team.

Happy posting! 🚀',
  null,
  'community-general',
  'admin-user-001',
  'text',
  null,
  0,
  true,
  NOW() - INTERVAL '35 days',
  NOW()
),
(
  'post-gaming-001',
  'What''s everyone playing this week? 🎮',
  'Drop your current games in the comments! Always looking for new recommendations and potential co-op partners.

Currently grinding through:
- **Cyberpunk 2077** - Finally giving it another shot after the updates
- **Valheim** - Building the most epic base with friends
- **Rocket League** - Still terrible but having fun 😅

What about you? Any hidden gems you''d recommend?',
  null,
  'community-gaming',
  'user-001',
  'text',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=400&fit=crop',
  0,
  false,
  NOW() - INTERVAL '5 days',
  NOW()
),
(
  'post-tech-001',
  'The Future of AI in Software Development',
  'Interesting article about how AI is transforming the software development landscape. What do you think about AI-assisted coding?

Key points from the article:
- AI can boost productivity by 30-50%
- But human creativity and problem-solving remain essential
- The future is likely human-AI collaboration, not replacement

As a developer, I''m excited but also cautious. AI tools like GitHub Copilot are incredibly helpful, but understanding the fundamentals is still crucial.

What''s your experience with AI coding tools?',
  'https://techcrunch.com/ai-software-development-future',
  'community-technology',
  'user-002',
  'link',
  null,
  0,
  false,
  NOW() - INTERVAL '3 days',
  NOW()
),
(
  'post-crypto-001',
  'DeFi Yield Farming: Risk vs Reward Analysis 📊',
  'Been deep-diving into yield farming strategies and wanted to share some insights on risk management.

**Higher Risk/Higher Reward:**
- New protocol farming (APY: 100-1000%, but high impermanent loss risk)
- Leveraged positions (Can amplify gains but also losses)

**Medium Risk/Medium Reward:**
- Established DeFi protocols (APY: 20-50%, moderate IL risk)
- Blue chip LP pairs (ETH/USDC, etc.)

**Lower Risk/Lower Reward:**
- Stablecoin pairs (APY: 5-15%, minimal IL risk)
- Single-asset staking

**Key takeaways:**
1. Never invest more than you can afford to lose
2. Diversify across protocols and strategies
3. Understand impermanent loss before providing liquidity
4. Keep track of gas fees - they can eat into smaller positions

What strategies have worked best for you? Always interested in learning from the community! 

*Not financial advice - always DYOR*',
  null,
  'community-crypto',
  'user-003',
  'text',
  null,
  0,
  false,
  NOW() - INTERVAL '2 days',
  NOW()
),
(
  'post-creative-001',
  'My latest NFT collection: "Digital Dreams" ✨',
  'Just minted my first NFT collection on OpenSea! It''s been an incredible journey learning about digital art and blockchain.

The collection explores themes of technology and humanity, with each piece representing different aspects of our digital lives.

I''d love to get feedback from fellow artists here. What platforms have you found best for showcasing digital art?

Check it out and let me know what you think! 🎨',
  'https://opensea.io/collection/digital-dreams-example',
  'community-creative',
  'user-004',
  'link',
  'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=400&fit=crop',
  0,
  false,
  NOW() - INTERVAL '1 day',
  NOW()
),
(
  'post-help-001',
  'How to set up your profile and join communities',
  'New to CRYB? Here''s a quick guide to get you started:

**1. Complete Your Profile**
- Add a profile picture and bio
- This helps others connect with you!

**2. Join Communities**
- Browse our community directory
- Join ones that match your interests
- Don''t be afraid to participate in discussions

**3. Customize Your Experience**
- Adjust notification settings
- Choose your preferred theme
- Set up your privacy preferences

**4. Start Engaging**
- Upvote content you like
- Comment and start discussions
- Share your own posts and experiences

**5. Use Voice & Video**
- Join voice channels in communities
- Start video calls with friends
- Share your screen for collaboration

Need help with any of these steps? Just reply below and our community will help you out! 

Welcome aboard! 🚀',
  null,
  'community-help',
  'admin-user-001',
  'text',
  null,
  0,
  true,
  NOW() - INTERVAL '34 days',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create sample comments
INSERT INTO comments (id, content, post_id, user_id, parent_id, created_at, updated_at)
VALUES 
(
  'comment-001',
  'This is exactly what I''ve been looking for! Love the combination of real-time chat and Reddit-style voting. Can''t wait to explore more communities! 🎉',
  'post-welcome-001',
  'user-001',
  null,
  NOW() - INTERVAL '34 days',
  NOW()
),
(
  'comment-002',
  'Welcome to the community! Make sure to check out the Gaming Central - lots of great discussions happening there!',
  'post-welcome-001',
  'mod-user-001',
  'comment-001',
  NOW() - INTERVAL '34 days',
  NOW()
),
(
  'comment-003',
  'Currently obsessed with Elden Ring! The open world is just incredible. Anyone up for some co-op sessions?',
  'post-gaming-001',
  'user-002',
  null,
  NOW() - INTERVAL '4 days',
  NOW()
),
(
  'comment-004',
  'I''ve been using GitHub Copilot for a few months now. It''s amazing for boilerplate code but I still prefer writing complex algorithms myself. Great article btw!',
  'post-tech-001',
  'user-001',
  null,
  NOW() - INTERVAL '2 days',
  NOW()
),
(
  'comment-005',
  'Thanks for sharing this analysis! I''ve been mostly sticking to stable pairs but your breakdown makes me want to explore more strategies. Bookmarked! 📖',
  'post-crypto-001',
  'user-004',
  null,
  NOW() - INTERVAL '1 day',
  NOW()
),
(
  'comment-006',
  'Your art style is absolutely stunning! The way you blend digital elements with organic forms is really unique. Followed your collection! 🎨',
  'post-creative-001',
  'user-005',
  null,
  NOW() - INTERVAL '12 hours',
  NOW()
),
(
  'comment-007',
  'This guide is super helpful! I was confused about how to join voice channels but your explanation made it clear. Thanks! 🙏',
  'post-help-001',
  'user-003',
  null,
  NOW() - INTERVAL '33 days',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create some votes to make content feel active
INSERT INTO post_votes (post_id, user_id, vote_type, created_at)
SELECT 
  p.id,
  u.id,
  CASE WHEN RANDOM() > 0.2 THEN 'up' ELSE 'down' END,
  NOW() - INTERVAL (RANDOM() * 30) || ' days'
FROM posts p
CROSS JOIN users u
WHERE p.id IN ('post-welcome-001', 'post-gaming-001', 'post-tech-001', 'post-crypto-001', 'post-creative-001', 'post-help-001')
AND RANDOM() > 0.3 -- Only some users vote
ON CONFLICT (post_id, user_id) DO NOTHING;

-- Create comment votes
INSERT INTO comment_votes (comment_id, user_id, vote_type, created_at)
SELECT 
  c.id,
  u.id,
  CASE WHEN RANDOM() > 0.1 THEN 'up' ELSE 'down' END,
  NOW() - INTERVAL (RANDOM() * 30) || ' days'
FROM comments c
CROSS JOIN users u
WHERE RANDOM() > 0.5 -- Even fewer comment votes
ON CONFLICT (comment_id, user_id) DO NOTHING;

-- Update community member counts
UPDATE communities 
SET member_count = (
  SELECT COUNT(*) 
  FROM community_members 
  WHERE community_id = communities.id
);

-- Update post scores based on votes
UPDATE posts 
SET score = (
  SELECT COALESCE(
    SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE -1 END), 0
  )
  FROM post_votes 
  WHERE post_id = posts.id
);

-- Create sample notifications for new users
INSERT INTO notifications (id, user_id, type, title, content, data, created_at)
VALUES 
(
  'notif-001',
  'user-001',
  'welcome',
  'Welcome to CRYB! 🎉',
  'Thanks for joining our community! Check out these popular communities to get started.',
  '{"communities": ["community-general", "community-gaming", "community-help"]}'::jsonb,
  NOW() - INTERVAL '30 days'
),
(
  'notif-002',
  'user-002',
  'welcome',
  'Welcome to CRYB! 🎉',
  'Thanks for joining our community! Check out these popular communities to get started.',
  '{"communities": ["community-general", "community-technology", "community-help"]}'::jsonb,
  NOW() - INTERVAL '25 days'
) ON CONFLICT (id) DO NOTHING;

-- Insert some achievement data (if achievements table exists)
-- This would be expanded based on your gamification system

COMMIT;

-- Summary report
SELECT 
  'Users created' as category, 
  COUNT(*) as count 
FROM users
UNION ALL
SELECT 
  'Communities created' as category, 
  COUNT(*) as count 
FROM communities
UNION ALL
SELECT 
  'Posts created' as category, 
  COUNT(*) as count 
FROM posts
UNION ALL
SELECT 
  'Comments created' as category, 
  COUNT(*) as count 
FROM comments
UNION ALL
SELECT 
  'Community memberships' as category, 
  COUNT(*) as count 
FROM community_members;