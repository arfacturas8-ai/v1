-- Notification Templates Seed Data
-- This script inserts default notification templates for the CRYB platform

INSERT INTO "NotificationTemplate" (id, type, name, title, body, data, priority, sound, badge, "isActive", "createdAt", "updatedAt") VALUES

-- Message notifications
('tmpl_message_dm', 'DM', 'direct_message', 'Message from {{senderName}}', '{{messageContent}}', '{"type": "dm", "actions": [{"action": "reply", "title": "Reply"}, {"action": "mark_read", "title": "Mark Read"}]}', 'HIGH', 'message', true, true, NOW(), NOW()),

('tmpl_message_channel', 'MESSAGE', 'channel_message', 'New message in {{channelName}}', '{{senderName}}: {{messageContent}}', '{"type": "message", "actions": [{"action": "view", "title": "View"}, {"action": "mark_read", "title": "Mark Read"}]}', 'NORMAL', 'message', true, true, NOW(), NOW()),

-- Mention notifications
('tmpl_mention_post', 'MENTION', 'post_mention', '{{mentionerName}} mentioned you', 'In post: {{postTitle}}', '{"type": "mention", "actions": [{"action": "view", "title": "View Post"}, {"action": "reply", "title": "Reply"}]}', 'HIGH', 'mention', true, true, NOW(), NOW()),

('tmpl_mention_comment', 'MENTION', 'comment_mention', '{{mentionerName}} mentioned you', 'In comment: {{commentContent}}', '{"type": "mention", "actions": [{"action": "view", "title": "View"}, {"action": "reply", "title": "Reply"}]}', 'HIGH', 'mention', true, true, NOW(), NOW()),

('tmpl_mention_channel', 'MENTION', 'channel_mention', '{{mentionerName}} mentioned you', 'In {{channelName}}: {{messageContent}}', '{"type": "mention", "actions": [{"action": "view", "title": "View"}, {"action": "reply", "title": "Reply"}]}', 'HIGH', 'mention', true, true, NOW(), NOW()),

-- Social interactions
('tmpl_follow_new', 'FOLLOW', 'new_follower', 'New follower', '{{followerName}} started following you', '{"type": "follow", "actions": [{"action": "view_profile", "title": "View Profile"}, {"action": "follow_back", "title": "Follow Back"}]}', 'NORMAL', 'social', true, true, NOW(), NOW()),

('tmpl_like_post', 'POST_LIKE', 'post_liked', 'Your post was liked', '{{likerName}} liked your post: {{postTitle}}', '{"type": "post_like", "actions": [{"action": "view_post", "title": "View Post"}, {"action": "like_back", "title": "Like Their Post"}]}', 'LOW', 'social', true, true, NOW(), NOW()),

('tmpl_comment_post', 'POST_COMMENT', 'post_commented', 'New comment on your post', '{{commenterName}}: {{commentContent}}', '{"type": "post_comment", "actions": [{"action": "view_post", "title": "View Post"}, {"action": "reply", "title": "Reply"}]}', 'NORMAL', 'comment', true, true, NOW(), NOW()),

('tmpl_reply_comment', 'REPLY', 'comment_reply', 'Reply to your comment', '{{replierName}}: {{replyContent}}', '{"type": "comment_reply", "actions": [{"action": "view_comment", "title": "View"}, {"action": "reply", "title": "Reply"}]}', 'NORMAL', 'comment', true, true, NOW(), NOW()),

-- Friend requests
('tmpl_friend_request', 'FRIEND_REQUEST', 'friend_request', 'Friend request', '{{requesterName}} sent you a friend request', '{"type": "friend_request", "actions": [{"action": "accept", "title": "Accept"}, {"action": "decline", "title": "Decline"}]}', 'NORMAL', 'social', true, true, NOW(), NOW()),

-- Voice and video calls
('tmpl_voice_call', 'VOICE_CALL', 'incoming_voice_call', 'Incoming voice call', '{{callerName}} is calling you', '{"type": "voice_call", "actions": [{"action": "answer", "title": "Answer"}, {"action": "decline", "title": "Decline"}]}', 'CRITICAL', 'ringtone', true, true, NOW(), NOW()),

('tmpl_video_call', 'VIDEO_CALL', 'incoming_video_call', 'Incoming video call', '{{callerName}} is calling you', '{"type": "video_call", "actions": [{"action": "answer", "title": "Answer"}, {"action": "decline", "title": "Decline"}]}', 'CRITICAL', 'ringtone', true, true, NOW(), NOW()),

-- Server and community invites
('tmpl_server_invite', 'SERVER_INVITE', 'server_invitation', 'Server invitation', '{{inviterName}} invited you to join {{serverName}}', '{"type": "server_invite", "actions": [{"action": "join", "title": "Join Server"}, {"action": "ignore", "title": "Ignore"}]}', 'NORMAL', 'invite', true, true, NOW(), NOW()),

('tmpl_community_invite', 'COMMUNITY_INVITE', 'community_invitation', 'Community invitation', '{{inviterName}} invited you to join {{communityName}}', '{"type": "community_invite", "actions": [{"action": "join", "title": "Join"}, {"action": "ignore", "title": "Ignore"}]}', 'NORMAL', 'invite', true, true, NOW(), NOW()),

-- Crypto and Web3
('tmpl_crypto_tip', 'CRYPTO_TIP', 'crypto_tip_received', 'Crypto tip received!', '{{senderName}} sent you {{amount}} {{currency}}', '{"type": "crypto_tip", "actions": [{"action": "view_wallet", "title": "View Wallet"}, {"action": "thank", "title": "Say Thanks"}]}', 'HIGH', 'payment', true, true, NOW(), NOW()),

('tmpl_nft_transfer', 'NFT_TRANSFER', 'nft_received', 'NFT received!', '{{senderName}} sent you "{{nftName}}"', '{"type": "nft_transfer", "actions": [{"action": "view_nft", "title": "View NFT"}, {"action": "view_wallet", "title": "View Wallet"}]}', 'HIGH', 'payment', true, true, NOW(), NOW()),

-- System notifications
('tmpl_system_maintenance', 'MAINTENANCE', 'maintenance_notification', 'Scheduled maintenance', 'CRYB will undergo maintenance on {{maintenanceDate}}', '{"type": "maintenance", "actions": [{"action": "view_status", "title": "View Status"}, {"action": "dismiss", "title": "OK"}]}', 'HIGH', 'system', true, true, NOW(), NOW()),

('tmpl_security_alert', 'SECURITY_ALERT', 'security_alert', 'Security Alert', '{{alertMessage}}', '{"type": "security_alert", "actions": [{"action": "view_security", "title": "View Security"}, {"action": "change_password", "title": "Change Password"}]}', 'CRITICAL', 'alert', true, true, NOW(), NOW()),

('tmpl_system_announcement', 'SYSTEM', 'system_announcement', 'CRYB Announcement', '{{announcementTitle}}', '{"type": "system", "actions": [{"action": "view_announcement", "title": "View"}, {"action": "dismiss", "title": "OK"}]}', 'NORMAL', 'system', true, true, NOW(), NOW()),

-- Live streaming
('tmpl_live_stream', 'LIVE_STREAM', 'live_stream_started', 'Live stream started', '{{streamerName}} is now live: {{streamTitle}}', '{"type": "live_stream", "actions": [{"action": "watch", "title": "Watch"}, {"action": "remind_later", "title": "Remind Later"}]}', 'NORMAL', 'live', true, true, NOW(), NOW()),

-- Community posts
('tmpl_community_post', 'COMMUNITY_POST', 'new_community_post', 'New post in {{communityName}}', '{{authorName}}: {{postTitle}}', '{"type": "community_post", "actions": [{"action": "view_post", "title": "View Post"}, {"action": "like", "title": "Like"}]}', 'LOW', 'post', true, true, NOW(), NOW()),

-- Awards
('tmpl_award_received', 'AWARD', 'award_received', 'You received an award!', '{{giverName}} gave you {{awardName}} for your {{contentType}}', '{"type": "award", "actions": [{"action": "view_content", "title": "View"}, {"action": "thank", "title": "Thank"}]}', 'NORMAL', 'award', true, true, NOW(), NOW());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_template_type ON "NotificationTemplate"(type);
CREATE INDEX IF NOT EXISTS idx_notification_template_active ON "NotificationTemplate"("isActive");
CREATE INDEX IF NOT EXISTS idx_notification_template_priority ON "NotificationTemplate"(priority);