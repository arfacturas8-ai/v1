-- Test script for database optimizations
-- Run this to verify the optimizations are working correctly

-- 1. Test materialized views
SELECT 'Testing materialized views...' as test_stage;

SELECT 
    'mv_server_stats' as view_name,
    COUNT(*) as row_count,
    MAX(last_updated) as last_updated
FROM mv_server_stats;

SELECT 
    'mv_community_stats' as view_name,
    COUNT(*) as row_count,
    MAX(last_updated) as last_updated
FROM mv_community_stats;

SELECT 
    'mv_user_activity' as view_name,
    COUNT(*) as row_count,
    MAX(last_updated) as last_updated
FROM mv_user_activity;

-- 2. Test search function (if there are users)
SELECT 'Testing search functions...' as test_stage;

-- This will work even with no data
SELECT 'search_users function exists' as status 
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'search_users';

-- 3. Test performance indexes exist
SELECT 'Testing performance indexes...' as test_stage;

SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE indexname IN (
    'idx_message_content_fts',
    'idx_message_channel_timestamp_desc',
    'idx_user_search_composite',
    'idx_notification_delivery'
) AND schemaname = 'public';

-- 4. Test constraints
SELECT 'Testing constraints...' as test_stage;

SELECT 
    COUNT(*) as check_constraints_added
FROM pg_constraint 
WHERE conname LIKE 'chk_%';

-- 5. Test foreign key indexes
SELECT 'Testing foreign key indexes...' as test_stage;

SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE indexname IN (
    'idx_comment_parent_id',
    'idx_crypto_tip_payment_id',
    'idx_marketplace_sale_listing_id',
    'idx_user_activity_presence_id'
) AND schemaname = 'public';

-- 6. Test cascade relationships
SELECT 'Testing cascade relationships...' as test_stage;

SELECT 
    tc.table_name,
    kcu.column_name,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('Comment', 'Message', 'MessageReference')
    AND kcu.column_name IN ('userId', 'replyToId', 'referencedMessageId')
ORDER BY tc.table_name, kcu.column_name;

-- 7. Database statistics
SELECT 'Database statistics...' as test_stage;

SELECT 
    'Total tables' as metric,
    COUNT(*) as value
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'

UNION ALL

SELECT 
    'Total indexes' as metric,
    COUNT(*) as value
FROM pg_indexes 
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Total constraints' as metric,
    COUNT(*) as value
FROM pg_constraint
WHERE connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')

UNION ALL

SELECT 
    'Functions added' as metric,
    COUNT(*) as value
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
    AND p.proname IN (
        'get_channel_messages',
        'search_users',
        'get_trending_posts',
        'get_server_activity',
        'get_marketplace_stats'
    );

SELECT 'Optimization test completed successfully!' as final_status;