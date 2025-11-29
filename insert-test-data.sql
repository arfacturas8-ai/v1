-- Insert test user
INSERT INTO "User" (id, username, "displayName", email, "isVerified", "createdAt", "updatedAt") 
VALUES ('test-user-123', 'discordtest', 'Discord Test User', 'discordtest@cryb.ai', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert test server with valid CUID format
INSERT INTO "Server" (id, name, description, "ownerId", "isPublic", "createdAt", "updatedAt") 
VALUES ('clxyzabc123456789012345', 'Test Discord Server', 'A test server for Discord functionality', 'test-user-123', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Add user as server member
INSERT INTO "ServerMember" ("serverId", "userId", "joinedAt") 
VALUES ('clxyzabc123456789012345', 'test-user-123', NOW())
ON CONFLICT ("serverId", "userId") DO NOTHING;

-- Create a session for the user
INSERT INTO "Session" (id, "userId", "expiresAt", "createdAt", "updatedAt") 
VALUES ('test-session-456', 'test-user-123', NOW() + INTERVAL '24 hours', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;