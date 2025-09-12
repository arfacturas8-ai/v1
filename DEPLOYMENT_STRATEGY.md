# Deployment Strategy for Limited Resources

## System Constraints
- RAM: 1.9GB total (need to keep under 1.5GB usage)
- Session crashes when multiple agents run simultaneously
- pnpm workspace dependencies cause npm conflicts

## Optimized Deployment Approach

### Phase 1: Core Infrastructure (Sequential)
1. Database setup and migrations
2. Backend API with authentication
3. Frontend Next.js setup

### Phase 2: Real-time Features (Batched)
4. Socket.io infrastructure
5. Redis pub/sub
6. Message queue (BullMQ)

### Phase 3: Advanced Features (On-demand)
7. Voice/Video (LiveKit)
8. Search (Elasticsearch)
9. Media storage (MinIO)
10. AI moderation

### Phase 4: Mobile & Testing
11. React Native app
12. QA and testing

## Agent Deployment Rules
1. **Never run more than 3 agents simultaneously**
2. **Priority order**: Backend > Frontend > Database > Others
3. **Memory monitoring**: Check free memory before deploying agents
4. **Sequential for critical**: Database and backend must be sequential
5. **Batch similar tasks**: Group UI components, API endpoints, etc.

## Memory Management
- Stop unnecessary services before deployment
- Use focused, specific tasks for agents
- Monitor with `free -h` between deployments
- Keep 500MB+ free memory buffer

## Error Recovery
- If session crashes, restart with smaller batches
- Save progress in CLAUDE.md after each phase
- Use git commits to checkpoint progress