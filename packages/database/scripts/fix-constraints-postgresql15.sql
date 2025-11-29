-- PostgreSQL 15 compatible constraint fixes (without IF NOT EXISTS)

-- Add check constraints for data validation (with existence checks)
DO $$ 
BEGIN
    -- User constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_discriminator') THEN
        ALTER TABLE "User" ADD CONSTRAINT chk_user_discriminator 
            CHECK (discriminator ~ '^\d{4}$');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_flags') THEN
        ALTER TABLE "User" ADD CONSTRAINT chk_user_flags 
            CHECK (flags >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_public_flags') THEN
        ALTER TABLE "User" ADD CONSTRAINT chk_user_public_flags 
            CHECK ("publicFlags" >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_premium_dates') THEN
        ALTER TABLE "User" ADD CONSTRAINT chk_premium_dates 
            CHECK ("premiumUntil" IS NULL OR "premiumUntil" > "createdAt");
    END IF;

    -- Channel constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_channel_position') THEN
        ALTER TABLE "Channel" ADD CONSTRAINT chk_channel_position 
            CHECK (position >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_channel_slow_mode') THEN
        ALTER TABLE "Channel" ADD CONSTRAINT chk_channel_slow_mode 
            CHECK ("slowMode" >= 0 AND "slowMode" <= 21600);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_channel_user_limit') THEN
        ALTER TABLE "Channel" ADD CONSTRAINT chk_channel_user_limit 
            CHECK ("userLimit" IS NULL OR ("userLimit" > 0 AND "userLimit" <= 99));
    END IF;

    -- Message constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_message_type') THEN
        ALTER TABLE "Message" ADD CONSTRAINT chk_message_type 
            CHECK (type >= 0 AND type <= 24);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_message_flags') THEN
        ALTER TABLE "Message" ADD CONSTRAINT chk_message_flags 
            CHECK (flags >= 0);
    END IF;

    -- Server constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_server_verification_level') THEN
        ALTER TABLE "Server" ADD CONSTRAINT chk_server_verification_level 
            CHECK ("verificationLevel" >= 0 AND "verificationLevel" <= 4);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_server_mfa_level') THEN
        ALTER TABLE "Server" ADD CONSTRAINT chk_server_mfa_level 
            CHECK ("mfaLevel" >= 0 AND "mfaLevel" <= 1);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_server_explicit_content_filter') THEN
        ALTER TABLE "Server" ADD CONSTRAINT chk_server_explicit_content_filter 
            CHECK ("explicitContentFilter" >= 0 AND "explicitContentFilter" <= 2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_server_max_members') THEN
        ALTER TABLE "Server" ADD CONSTRAINT chk_server_max_members 
            CHECK ("maxMembers" > 0 AND "maxMembers" <= 500000);
    END IF;

    -- Post and Comment constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_post_score') THEN
        ALTER TABLE "Post" ADD CONSTRAINT chk_post_score 
            CHECK (score >= -2147483648 AND score <= 2147483647);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_comment_score') THEN
        ALTER TABLE "Comment" ADD CONSTRAINT chk_comment_score 
            CHECK (score >= -2147483648 AND score <= 2147483647);
    END IF;

    -- Vote constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_vote_value') THEN
        ALTER TABLE "Vote" ADD CONSTRAINT chk_vote_value 
            CHECK (value IN (-1, 0, 1));
    END IF;

    -- Community constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_community_member_count') THEN
        ALTER TABLE "Community" ADD CONSTRAINT chk_community_member_count 
            CHECK ("memberCount" >= 0);
    END IF;

    -- Role constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_role_position') THEN
        ALTER TABLE "Role" ADD CONSTRAINT chk_role_position 
            CHECK (position >= 0);
    END IF;

    -- File constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_file_size') THEN
        ALTER TABLE "UploadedFile" ADD CONSTRAINT chk_file_size 
            CHECK (size > 0 AND size <= 268435456);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_file_dimensions') THEN
        ALTER TABLE "UploadedFile" ADD CONSTRAINT chk_file_dimensions 
            CHECK (width IS NULL OR width > 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_file_duration') THEN
        ALTER TABLE "UploadedFile" ADD CONSTRAINT chk_file_duration 
            CHECK (duration IS NULL OR duration >= 0);
    END IF;

    -- Security constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_security_risk_score') THEN
        ALTER TABLE "SecurityLog" ADD CONSTRAINT chk_security_risk_score 
            CHECK ("riskScore" >= 0 AND "riskScore" <= 100);
    END IF;

    -- Marketplace constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_listing_views') THEN
        ALTER TABLE "MarketplaceListing" ADD CONSTRAINT chk_listing_views 
            CHECK (views >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_bid_expires_future') THEN
        ALTER TABLE "MarketplaceBid" ADD CONSTRAINT chk_bid_expires_future 
            CHECK ("expiresAt" IS NULL OR "expiresAt" > "createdAt");
    END IF;

    -- Staking constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_staking_apr') THEN
        ALTER TABLE "StakingPool" ADD CONSTRAINT chk_staking_apr 
            CHECK (apr >= 0 AND apr <= 1000);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_stake_locked_until') THEN
        ALTER TABLE "UserStake" ADD CONSTRAINT chk_stake_locked_until 
            CHECK ("lockedUntil" IS NULL OR "lockedUntil" > "createdAt");
    END IF;
END $$;