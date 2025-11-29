-- CRYB PLATFORM QUERY OPTIMIZATION PROCEDURES
-- Advanced stored procedures and materialized views for performance optimization
-- Optimized for high-traffic social platform with real-time features

\echo 'Creating query optimization procedures and materialized views...';

-- ==============================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- ==============================================

-- Real-time server activity dashboard (refresh every 2 minutes)
DROP MATERIALIZED VIEW IF EXISTS mv_server_activity_realtime CASCADE;
CREATE MATERIALIZED VIEW mv_server_activity_realtime AS
WITH server_stats AS (
    SELECT 
        s."id" as server_id,
        s."name" as server_name,
        s."ownerId" as owner_id,
        s."isPublic" as is_public,
        s."tokenGated" as token_gated,
        s."approximateMemberCount" as member_count,
        s."createdAt" as created_at
    FROM "Server" s
),
active_members AS (
    SELECT 
        sm."serverId",
        COUNT(*) as active_members,
        COUNT(CASE WHEN up.status IN ('ONLINE', 'IDLE', 'DND') THEN 1 END) as online_members
    FROM "ServerMember" sm
    LEFT JOIN "UserPresence" up ON sm."userId" = up."userId"
    WHERE sm.pending = false 
    AND sm."communicationDisabledUntil" IS NULL
    GROUP BY sm."serverId"
),
recent_activity AS (
    SELECT 
        c."serverId",
        COUNT(DISTINCT m."id") as messages_1h,
        COUNT(DISTINCT m."userId") as active_users_1h,
        COUNT(DISTINCT CASE WHEN m."timestamp" > NOW() - INTERVAL '10 minutes' THEN m."id" END) as messages_10m
    FROM "Channel" c
    LEFT JOIN "Message" m ON c."id" = m."channelId" 
        AND m."timestamp" > NOW() - INTERVAL '1 hour'
    WHERE c."serverId" IS NOT NULL
    GROUP BY c."serverId"
),
voice_activity AS (
    SELECT 
        vs."serverId",
        COUNT(DISTINCT vs."userId") as voice_users,
        COUNT(DISTINCT vs."channelId") as active_voice_channels
    FROM "VoiceState" vs
    WHERE vs."channelId" IS NOT NULL
    GROUP BY vs."serverId"
)
SELECT 
    ss.server_id,
    ss.server_name,
    ss.owner_id,
    ss.is_public,
    ss.token_gated,
    ss.member_count,
    COALESCE(am.active_members, 0) as active_members,
    COALESCE(am.online_members, 0) as online_members,
    COALESCE(ra.messages_1h, 0) as messages_last_hour,
    COALESCE(ra.messages_10m, 0) as messages_last_10min,
    COALESCE(ra.active_users_1h, 0) as active_users_last_hour,
    COALESCE(va.voice_users, 0) as current_voice_users,
    COALESCE(va.active_voice_channels, 0) as active_voice_channels,
    -- Activity score calculation (0-100)
    LEAST(100, (
        COALESCE(ra.messages_1h, 0) * 0.3 +
        COALESCE(ra.active_users_1h, 0) * 0.4 +
        COALESCE(va.voice_users, 0) * 0.3
    )) as activity_score,
    ss.created_at,
    NOW() as last_updated
FROM server_stats ss
LEFT JOIN active_members am ON ss.server_id = am."serverId"
LEFT JOIN recent_activity ra ON ss.server_id = ra."serverId"  
LEFT JOIN voice_activity va ON ss.server_id = va."serverId"
WHERE ss.member_count > 0;

CREATE UNIQUE INDEX ON mv_server_activity_realtime (server_id);
CREATE INDEX ON mv_server_activity_realtime (activity_score DESC);
CREATE INDEX ON mv_server_activity_realtime (is_public, activity_score DESC);

-- User engagement metrics with behavioral analysis
DROP MATERIALIZED VIEW IF EXISTS mv_user_engagement_metrics CASCADE;
CREATE MATERIALIZED VIEW mv_user_engagement_metrics AS
WITH user_base AS (
    SELECT 
        u."id" as user_id,
        u.username,
        u."displayName",
        u."isVerified",
        u."premiumType",
        u."createdAt" as joined_at,
        u."lastSeenAt",
        u."bannedAt"
    FROM "User" u
    WHERE u."bannedAt" IS NULL
),
message_activity AS (
    SELECT 
        m."userId",
        COUNT(*) as total_messages,
        COUNT(CASE WHEN m."timestamp" > NOW() - INTERVAL '24 hours' THEN 1 END) as messages_24h,
        COUNT(CASE WHEN m."timestamp" > NOW() - INTERVAL '7 days' THEN 1 END) as messages_7d,
        COUNT(CASE WHEN m."timestamp" > NOW() - INTERVAL '30 days' THEN 1 END) as messages_30d,
        AVG(LENGTH(m.content)) as avg_message_length,
        MAX(m."timestamp") as last_message_time,
        COUNT(DISTINCT m."channelId") as unique_channels_used
    FROM "Message" m
    WHERE m."timestamp" > NOW() - INTERVAL '90 days'
    GROUP BY m."userId"
),
voice_activity AS (
    SELECT 
        va."userId",
        SUM(va."sessionDuration") as total_voice_minutes_30d,
        COUNT(*) as voice_sessions_30d,
        AVG(va."sessionDuration") as avg_session_duration
    FROM "VoiceAnalytics" va
    WHERE va.timestamp > NOW() - INTERVAL '30 days'
    GROUP BY va."userId"
),
social_activity AS (
    SELECT 
        u."userId",
        COUNT(*) as posts_created,
        SUM(p.score) as total_post_karma
    FROM "User" u
    LEFT JOIN "Post" p ON u."id" = p."userId" 
        AND p."createdAt" > NOW() - INTERVAL '30 days'
        AND p."isRemoved" = false
    GROUP BY u."id"
),
server_participation AS (
    SELECT 
        sm."userId",
        COUNT(DISTINCT sm."serverId") as servers_joined,
        COUNT(DISTINCT CASE WHEN sm."joinedAt" > NOW() - INTERVAL '30 days' THEN sm."serverId" END) as servers_joined_30d
    FROM "ServerMember" sm
    WHERE sm.pending = false
    GROUP BY sm."userId"
)
SELECT 
    ub.user_id,
    ub.username,
    ub."displayName",
    ub."isVerified",
    ub."premiumType",
    ub.joined_at,
    ub."lastSeenAt",
    
    -- Message engagement
    COALESCE(ma.total_messages, 0) as total_messages,
    COALESCE(ma.messages_24h, 0) as messages_24h,
    COALESCE(ma.messages_7d, 0) as messages_7d,
    COALESCE(ma.messages_30d, 0) as messages_30d,
    COALESCE(ma.avg_message_length, 0) as avg_message_length,
    ma.last_message_time,
    COALESCE(ma.unique_channels_used, 0) as unique_channels_used,
    
    -- Voice engagement
    COALESCE(va.total_voice_minutes_30d, 0) as voice_minutes_30d,
    COALESCE(va.voice_sessions_30d, 0) as voice_sessions_30d,
    COALESCE(va.avg_session_duration, 0) as avg_voice_session_duration,
    
    -- Social engagement
    COALESCE(sa.posts_created, 0) as posts_created_30d,
    COALESCE(sa.total_post_karma, 0) as post_karma_30d,
    
    -- Server participation
    COALESCE(sp.servers_joined, 0) as total_servers_joined,
    COALESCE(sp.servers_joined_30d, 0) as servers_joined_30d,
    
    -- Engagement score calculation (0-100)
    LEAST(100, (
        COALESCE(ma.messages_30d, 0) * 0.001 +
        COALESCE(va.voice_minutes_30d, 0) * 0.01 +
        COALESCE(sa.posts_created, 0) * 0.5 +
        COALESCE(sp.servers_joined, 0) * 0.2 +
        CASE WHEN ub."lastSeenAt" > NOW() - INTERVAL '24 hours' THEN 10 ELSE 0 END
    )) as engagement_score,
    
    -- User tier classification
    CASE 
        WHEN COALESCE(ma.messages_30d, 0) >= 1000 OR COALESCE(va.voice_minutes_30d, 0) >= 600 THEN 'POWER_USER'
        WHEN COALESCE(ma.messages_30d, 0) >= 100 OR COALESCE(va.voice_minutes_30d, 0) >= 120 THEN 'ACTIVE_USER'
        WHEN COALESCE(ma.messages_30d, 0) >= 10 OR COALESCE(va.voice_minutes_30d, 0) >= 30 THEN 'CASUAL_USER'
        WHEN ub."lastSeenAt" > NOW() - INTERVAL '30 days' THEN 'LURKER'
        ELSE 'INACTIVE'
    END as user_tier,
    
    NOW() as last_calculated
FROM user_base ub
LEFT JOIN message_activity ma ON ub.user_id = ma."userId"
LEFT JOIN voice_activity va ON ub.user_id = va."userId"
LEFT JOIN social_activity sa ON ub.user_id = sa."userId"
LEFT JOIN server_participation sp ON ub.user_id = sp."userId";

CREATE UNIQUE INDEX ON mv_user_engagement_metrics (user_id);
CREATE INDEX ON mv_user_engagement_metrics (engagement_score DESC);
CREATE INDEX ON mv_user_engagement_metrics (user_tier, engagement_score DESC);
CREATE INDEX ON mv_user_engagement_metrics ("lastSeenAt" DESC);

-- Content trending analysis for discovery
DROP MATERIALIZED VIEW IF EXISTS mv_trending_content CASCADE;
CREATE MATERIALIZED VIEW mv_trending_content AS
WITH post_metrics AS (
    SELECT 
        p."id" as post_id,
        p."communityId",
        p."userId",
        p.title,
        p.score,
        p."viewCount",
        p."commentCount",
        p."createdAt",
        p.nsfw,
        p."isRemoved",
        p."isLocked",
        -- Hot score calculation (Reddit-style algorithm)
        (
            CASE 
                WHEN p.score > 0 THEN LN(p.score)
                WHEN p.score = 0 THEN 0
                ELSE -1 * LN(ABS(p.score))
            END +
            EXTRACT(EPOCH FROM p."createdAt") / 45000
        ) as hot_score,
        -- Trending score (time-weighted engagement)
        (
            p.score * 1.0 / GREATEST(1, EXTRACT(EPOCH FROM (NOW() - p."createdAt")) / 3600)
        ) as trending_score
    FROM "Post" p
    WHERE p."createdAt" > NOW() - INTERVAL '7 days'
    AND p."isRemoved" = false
    AND p."isLocked" = false
),
comment_activity AS (
    SELECT 
        c."postId",
        COUNT(*) as total_comments,
        COUNT(CASE WHEN c."createdAt" > NOW() - INTERVAL '1 hour' THEN 1 END) as comments_1h,
        COUNT(CASE WHEN c."createdAt" > NOW() - INTERVAL '24 hours' THEN 1 END) as comments_24h,
        AVG(c.score) as avg_comment_score
    FROM "Comment" c
    WHERE c."createdAt" > NOW() - INTERVAL '7 days'
    GROUP BY c."postId"
),
vote_activity AS (
    SELECT 
        v."postId",
        COUNT(*) as total_votes,
        COUNT(CASE WHEN v.value > 0 THEN 1 END) as upvotes,
        COUNT(CASE WHEN v.value < 0 THEN 1 END) as downvotes,
        COUNT(CASE WHEN v."createdAt" > NOW() - INTERVAL '1 hour' THEN 1 END) as votes_1h
    FROM "Vote" v
    WHERE v."postId" IS NOT NULL
    AND v."createdAt" > NOW() - INTERVAL '7 days'
    GROUP BY v."postId"
)
SELECT 
    pm.post_id,
    pm."communityId",
    pm."userId",
    pm.title,
    pm.score,
    pm."viewCount",
    pm."commentCount",
    pm."createdAt",
    pm.nsfw,
    pm.hot_score,
    pm.trending_score,
    
    -- Engagement metrics
    COALESCE(ca.total_comments, 0) as total_comments,
    COALESCE(ca.comments_1h, 0) as comments_last_hour,
    COALESCE(ca.comments_24h, 0) as comments_last_24h,
    COALESCE(ca.avg_comment_score, 0) as avg_comment_score,
    
    -- Voting metrics
    COALESCE(va.total_votes, 0) as total_votes,
    COALESCE(va.upvotes, 0) as upvotes,
    COALESCE(va.downvotes, 0) as downvotes,
    COALESCE(va.votes_1h, 0) as votes_last_hour,
    
    -- Engagement velocity (activity in last hour)
    (COALESCE(ca.comments_1h, 0) + COALESCE(va.votes_1h, 0)) as engagement_velocity,
    
    -- Content quality score
    (
        pm.score * 0.4 +
        COALESCE(ca.avg_comment_score, 0) * 0.2 +
        (COALESCE(va.upvotes, 0) - COALESCE(va.downvotes, 0)) * 0.4
    ) as quality_score,
    
    NOW() as last_calculated
FROM post_metrics pm
LEFT JOIN comment_activity ca ON pm.post_id = ca."postId"
LEFT JOIN vote_activity va ON pm.post_id = va."postId"
WHERE pm.hot_score > -10; -- Filter out heavily downvoted content

CREATE UNIQUE INDEX ON mv_trending_content (post_id);
CREATE INDEX ON mv_trending_content (hot_score DESC);
CREATE INDEX ON mv_trending_content (trending_score DESC);
CREATE INDEX ON mv_trending_content ("communityId", hot_score DESC);
CREATE INDEX ON mv_trending_content (engagement_velocity DESC);

-- ==============================================
-- OPTIMIZED STORED PROCEDURES
-- ==============================================

-- High-performance channel message retrieval with pagination
CREATE OR REPLACE FUNCTION get_channel_messages_optimized(
    p_channel_id TEXT,
    p_limit INTEGER DEFAULT 50,
    p_before_timestamp TIMESTAMPTZ DEFAULT NULL,
    p_include_attachments BOOLEAN DEFAULT true,
    p_include_embeds BOOLEAN DEFAULT true
)
RETURNS TABLE (
    id TEXT,
    content TEXT,
    user_id TEXT,
    username TEXT,
    display_name TEXT,
    user_avatar TEXT,
    timestamp TIMESTAMPTZ,
    edited_timestamp TIMESTAMPTZ,
    reply_to_id TEXT,
    thread_id TEXT,
    is_pinned BOOLEAN,
    attachments JSONB,
    embeds JSONB,
    reactions JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH message_data AS (
        SELECT 
            m."id",
            m."content",
            m."userId",
            u."username",
            u."displayName",
            u."avatar",
            m."timestamp",
            m."editedTimestamp",
            m."replyToId",
            m."threadId",
            m."isPinned"
        FROM "Message" m
        JOIN "User" u ON m."userId" = u."id"
        WHERE m."channelId" = p_channel_id
        AND (p_before_timestamp IS NULL OR m."timestamp" < p_before_timestamp)
        ORDER BY m."timestamp" DESC
        LIMIT p_limit
    ),
    message_attachments AS (
        SELECT 
            ma."messageId",
            jsonb_agg(
                jsonb_build_object(
                    'id', ma."id",
                    'filename', ma."filename",
                    'url', ma."url",
                    'proxyUrl', ma."proxyUrl",
                    'contentType', ma."contentType",
                    'size', ma."size",
                    'width', ma."width",
                    'height', ma."height"
                )
            ) as attachments
        FROM "MessageAttachment" ma
        WHERE p_include_attachments 
        AND ma."messageId" IN (SELECT md."id" FROM message_data md)
        GROUP BY ma."messageId"
    ),
    message_embeds AS (
        SELECT 
            me."messageId",
            jsonb_agg(
                jsonb_build_object(
                    'title', me."title",
                    'description', me."description",
                    'url', me."url",
                    'color', me."color",
                    'timestamp', me."timestamp"
                )
            ) as embeds
        FROM "MessageEmbed" me
        WHERE p_include_embeds
        AND me."messageId" IN (SELECT md."id" FROM message_data md)
        GROUP BY me."messageId"
    ),
    message_reactions AS (
        SELECT 
            r."messageId",
            jsonb_agg(
                jsonb_build_object(
                    'emoji', r."emoji",
                    'count', COUNT(*),
                    'users', jsonb_agg(r."userId")
                )
            ) as reactions
        FROM "Reaction" r
        WHERE r."messageId" IN (SELECT md."id" FROM message_data md)
        GROUP BY r."messageId", r."emoji"
    )
    SELECT 
        md."id",
        md."content",
        md."userId",
        md."username",
        md."displayName",
        md."avatar",
        md."timestamp",
        md."editedTimestamp",
        md."replyToId",
        md."threadId",
        md."isPinned",
        COALESCE(ma.attachments, '[]'::jsonb),
        COALESCE(me.embeds, '[]'::jsonb),
        COALESCE(mr.reactions, '[]'::jsonb)
    FROM message_data md
    LEFT JOIN message_attachments ma ON md."id" = ma."messageId"
    LEFT JOIN message_embeds me ON md."id" = me."messageId"
    LEFT JOIN message_reactions mr ON md."id" = mr."messageId"
    ORDER BY md."timestamp" DESC;
END;
$$ LANGUAGE plpgsql;

-- Server discovery with advanced filtering and ranking
CREATE OR REPLACE FUNCTION discover_servers(
    p_user_id TEXT DEFAULT NULL,
    p_search_query TEXT DEFAULT NULL,
    p_category_filter TEXT DEFAULT NULL,
    p_min_members INTEGER DEFAULT 0,
    p_max_members INTEGER DEFAULT NULL,
    p_token_gated_only BOOLEAN DEFAULT false,
    p_nsfw_allowed BOOLEAN DEFAULT false,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    server_id TEXT,
    server_name TEXT,
    description TEXT,
    icon TEXT,
    banner TEXT,
    member_count INTEGER,
    online_count INTEGER,
    activity_score NUMERIC,
    is_public BOOLEAN,
    token_gated BOOLEAN,
    verification_level INTEGER,
    features JSONB,
    created_at TIMESTAMPTZ,
    is_member BOOLEAN,
    similarity_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH server_search AS (
        SELECT 
            s."id",
            s."name",
            s."description",
            s."icon",
            s."banner",
            s."approximateMemberCount",
            s."isPublic",
            s."tokenGated",
            s."verificationLevel",
            s."features",
            s."createdAt",
            -- Text search similarity
            CASE 
                WHEN p_search_query IS NOT NULL THEN
                    similarity(s."name" || ' ' || COALESCE(s."description", ''), p_search_query)
                ELSE 0
            END as text_similarity
        FROM "Server" s
        WHERE s."isPublic" = true
        AND (p_min_members IS NULL OR s."approximateMemberCount" >= p_min_members)
        AND (p_max_members IS NULL OR s."approximateMemberCount" <= p_max_members)
        AND (NOT p_token_gated_only OR s."tokenGated" = true)
        AND (p_search_query IS NULL OR 
             s."name" ILIKE '%' || p_search_query || '%' OR 
             s."description" ILIKE '%' || p_search_query || '%')
    ),
    server_activity AS (
        SELECT 
            server_id,
            online_members,
            activity_score
        FROM mv_server_activity_realtime
    ),
    user_membership AS (
        SELECT 
            sm."serverId",
            true as is_member
        FROM "ServerMember" sm
        WHERE p_user_id IS NOT NULL 
        AND sm."userId" = p_user_id
        AND sm.pending = false
    )
    SELECT 
        ss."id",
        ss."name",
        ss."description",
        ss."icon",
        ss."banner",
        ss."approximateMemberCount",
        COALESCE(sa.online_members, 0),
        COALESCE(sa.activity_score, 0),
        ss."isPublic",
        ss."tokenGated",
        ss."verificationLevel",
        ss."features",
        ss."createdAt",
        COALESCE(um.is_member, false),
        -- Combined ranking score
        (
            COALESCE(sa.activity_score, 0) * 0.3 +
            ss.text_similarity * 100 * 0.4 +
            (ss."approximateMemberCount" / 1000.0) * 0.2 +
            CASE WHEN ss."tokenGated" THEN 5 ELSE 0 END * 0.1
        ) as ranking_score
    FROM server_search ss
    LEFT JOIN server_activity sa ON ss."id" = sa.server_id
    LEFT JOIN user_membership um ON ss."id" = um."serverId"
    ORDER BY ranking_score DESC, ss."approximateMemberCount" DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Advanced user search with engagement scoring
CREATE OR REPLACE FUNCTION search_users(
    p_search_query TEXT,
    p_server_id TEXT DEFAULT NULL,
    p_include_bots BOOLEAN DEFAULT false,
    p_verified_only BOOLEAN DEFAULT false,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    user_id TEXT,
    username TEXT,
    display_name TEXT,
    avatar TEXT,
    is_verified BOOLEAN,
    is_bot BOOLEAN,
    premium_type TEXT,
    last_seen_at TIMESTAMPTZ,
    engagement_score NUMERIC,
    mutual_servers INTEGER,
    search_rank NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH user_search AS (
        SELECT 
            u."id",
            u."username",
            u."displayName",
            u."avatar",
            u."isVerified",
            u."isBot",
            u."premiumType"::TEXT,
            u."lastSeenAt",
            -- Text search scoring
            (
                similarity(u."username", p_search_query) * 0.6 +
                similarity(COALESCE(u."displayName", ''), p_search_query) * 0.4
            ) as text_score
        FROM "User" u
        WHERE u."bannedAt" IS NULL
        AND (NOT p_verified_only OR u."isVerified" = true)
        AND (p_include_bots OR u."isBot" = false)
        AND (
            u."username" ILIKE '%' || p_search_query || '%' OR
            u."displayName" ILIKE '%' || p_search_query || '%'
        )
    ),
    user_engagement AS (
        SELECT 
            user_id,
            engagement_score
        FROM mv_user_engagement_metrics
    ),
    mutual_servers AS (
        SELECT 
            sm."userId",
            COUNT(DISTINCT sm."serverId") as server_count
        FROM "ServerMember" sm
        WHERE p_server_id IS NULL OR sm."serverId" = p_server_id
        GROUP BY sm."userId"
    )
    SELECT 
        us."id",
        us."username",
        us."displayName",
        us."avatar",
        us."isVerified",
        us."isBot",
        us."premiumType",
        us."lastSeenAt",
        COALESCE(ue.engagement_score, 0),
        COALESCE(ms.server_count, 0),
        -- Combined search ranking
        (
            us.text_score * 100 * 0.5 +
            COALESCE(ue.engagement_score, 0) * 0.3 +
            CASE WHEN us."isVerified" THEN 10 ELSE 0 END * 0.1 +
            CASE WHEN us."premiumType" != 'NONE' THEN 5 ELSE 0 END * 0.1
        ) as search_rank
    FROM user_search us
    LEFT JOIN user_engagement ue ON us."id" = ue.user_id
    LEFT JOIN mutual_servers ms ON us."id" = ms."userId"
    WHERE us.text_score > 0.1
    ORDER BY search_rank DESC, us.text_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- MAINTENANCE AND REFRESH PROCEDURES
-- ==============================================

-- Refresh all materialized views with error handling
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    start_time TIMESTAMPTZ;
BEGIN
    start_time := NOW();
    
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_server_activity_realtime;
        result := result || 'Server activity view refreshed. ';
    EXCEPTION
        WHEN OTHERS THEN
            result := result || 'Error refreshing server activity: ' || SQLERRM || '. ';
    END;
    
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_engagement_metrics;
        result := result || 'User engagement view refreshed. ';
    EXCEPTION
        WHEN OTHERS THEN
            result := result || 'Error refreshing user engagement: ' || SQLERRM || '. ';
    END;
    
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trending_content;
        result := result || 'Trending content view refreshed. ';
    EXCEPTION
        WHEN OTHERS THEN
            result := result || 'Error refreshing trending content: ' || SQLERRM || '. ';
    END;
    
    result := result || 'Total refresh time: ' || 
              EXTRACT(EPOCH FROM (NOW() - start_time))::TEXT || ' seconds.';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_channel_messages_optimized(TEXT, INTEGER, TIMESTAMPTZ, BOOLEAN, BOOLEAN) TO cryb_user;
GRANT EXECUTE ON FUNCTION discover_servers(TEXT, TEXT, TEXT, INTEGER, INTEGER, BOOLEAN, BOOLEAN, INTEGER, INTEGER) TO cryb_user;
GRANT EXECUTE ON FUNCTION search_users(TEXT, TEXT, BOOLEAN, BOOLEAN, INTEGER) TO cryb_user;
GRANT EXECUTE ON FUNCTION refresh_analytics_views() TO cryb_user;

GRANT SELECT ON mv_server_activity_realtime TO cryb_user;
GRANT SELECT ON mv_user_engagement_metrics TO cryb_user;
GRANT SELECT ON mv_trending_content TO cryb_user;

\echo 'Query optimization procedures and materialized views created successfully!';
\echo 'Use SELECT refresh_analytics_views(); to manually refresh all views.';
\echo 'Views should be refreshed every 2-5 minutes for optimal performance.';