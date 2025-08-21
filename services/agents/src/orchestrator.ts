import { EventEmitter } from 'events';
import Redis from 'ioredis';
import amqp from 'amqplib';
import pino from 'pino';
import { MainAgent } from './agents/MainAgent';
import { CommunityManagementAgent } from './agents/CommunityManagementAgent';
import { ContentMessagingAgent } from './agents/ContentMessagingAgent';
import { UserIdentityAgent } from './agents/UserIdentityAgent';
import { Web3BlockchainAgent } from './agents/Web3BlockchainAgent';
import { RealtimeCommunicationAgent } from './agents/RealtimeCommunicationAgent';
import { AnalyticsMonitoringAgent } from './agents/AnalyticsMonitoringAgent';
import { InfrastructureDevOpsAgent } from './agents/InfrastructureDevOpsAgent';

/**
 * Master Orchestrator - Controls all 7 main agents and their 21 sub-agents
 */
export class MasterOrchestrator extends EventEmitter {
  private agents: Map<string, MainAgent> = new Map();
  private redis: Redis;
  private rabbitmq: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private logger: pino.Logger;
  private status: 'initializing' | 'ready' | 'busy' | 'error' | 'shutdown' = 'initializing';

  constructor() {
    super();
    
    this.logger = pino({
      name: 'MasterOrchestrator',
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'UTC:yyyy-mm-dd HH:MM:ss'
        }
      }
    });

    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6380'),
      password: process.env.REDIS_PASSWORD || 'cryb_redis_password'
    });

    this.initializeAgents();
  }

  /**
   * Initialize all 7 main agents
   */
  private initializeAgents(): void {
    this.logger.info('Initializing 7 main agents with 21 sub-agents...');

    // 1. Community Management Agent (3 sub-agents)
    this.agents.set('community', new CommunityManagementAgent({
      id: 'community-management',
      name: 'Community Management Agent',
      subAgents: [
        { id: 'community-creator', name: 'Community Creator', type: 'creator' },
        { id: 'moderation', name: 'Moderation', type: 'moderator' },
        { id: 'engagement', name: 'Engagement', type: 'analyzer' }
      ],
      redis: this.redis,
      logger: this.logger.child({ agent: 'community' })
    }));

    // 2. Content & Messaging Agent (3 sub-agents)
    this.agents.set('content', new ContentMessagingAgent({
      id: 'content-messaging',
      name: 'Content & Messaging Agent',
      subAgents: [
        { id: 'message-processor', name: 'Message Processor', type: 'processor' },
        { id: 'content-creator', name: 'Content Creator', type: 'generator' },
        { id: 'search-discovery', name: 'Search & Discovery', type: 'indexer' }
      ],
      redis: this.redis,
      logger: this.logger.child({ agent: 'content' })
    }));

    // 3. User & Identity Agent (3 sub-agents)
    this.agents.set('user', new UserIdentityAgent({
      id: 'user-identity',
      name: 'User & Identity Agent',
      subAgents: [
        { id: 'authentication', name: 'Authentication', type: 'auth' },
        { id: 'profile-management', name: 'Profile Management', type: 'profile' },
        { id: 'relationship', name: 'Relationship', type: 'social' }
      ],
      redis: this.redis,
      logger: this.logger.child({ agent: 'user' })
    }));

    // 4. Web3 & Blockchain Agent (3 sub-agents)
    this.agents.set('web3', new Web3BlockchainAgent({
      id: 'web3-blockchain',
      name: 'Web3 & Blockchain Agent',
      subAgents: [
        { id: 'wallet-integration', name: 'Wallet Integration', type: 'wallet' },
        { id: 'token-gate', name: 'Token Gate', type: 'gate' },
        { id: 'dao-governance', name: 'DAO Governance', type: 'governance' }
      ],
      redis: this.redis,
      logger: this.logger.child({ agent: 'web3' })
    }));

    // 5. Real-time & Communication Agent (3 sub-agents)
    this.agents.set('realtime', new RealtimeCommunicationAgent({
      id: 'realtime-communication',
      name: 'Real-time & Communication Agent',
      subAgents: [
        { id: 'voice-video', name: 'Voice/Video', type: 'media' },
        { id: 'presence-status', name: 'Presence & Status', type: 'presence' },
        { id: 'notification', name: 'Notification', type: 'notifier' }
      ],
      redis: this.redis,
      logger: this.logger.child({ agent: 'realtime' })
    }));

    // 6. Analytics & Monitoring Agent (3 sub-agents)
    this.agents.set('analytics', new AnalyticsMonitoringAgent({
      id: 'analytics-monitoring',
      name: 'Analytics & Monitoring Agent',
      subAgents: [
        { id: 'performance-monitor', name: 'Performance Monitor', type: 'monitor' },
        { id: 'user-analytics', name: 'User Analytics', type: 'tracker' },
        { id: 'business-intelligence', name: 'Business Intelligence', type: 'analyzer' }
      ],
      redis: this.redis,
      logger: this.logger.child({ agent: 'analytics' })
    }));

    // 7. Infrastructure & DevOps Agent (3 sub-agents)
    this.agents.set('infrastructure', new InfrastructureDevOpsAgent({
      id: 'infrastructure-devops',
      name: 'Infrastructure & DevOps Agent',
      subAgents: [
        { id: 'deployment', name: 'Deployment', type: 'deployer' },
        { id: 'database-management', name: 'Database Management', type: 'dba' },
        { id: 'security-compliance', name: 'Security & Compliance', type: 'security' }
      ],
      redis: this.redis,
      logger: this.logger.child({ agent: 'infrastructure' })
    }));

    this.logger.info('✅ All 7 main agents and 21 sub-agents initialized');
  }

  /**
   * Start the orchestrator and all agents
   */
  async start(): Promise<void> {
    try {
      this.logger.info('🚀 Starting Master Orchestrator...');

      // Connect to RabbitMQ
      await this.connectRabbitMQ();

      // Start all main agents
      const startPromises = Array.from(this.agents.values()).map(agent => 
        agent.start()
      );
      await Promise.all(startPromises);

      // Set up inter-agent communication
      await this.setupInterAgentCommunication();

      // Set up orchestrator commands
      await this.setupOrchestratorCommands();

      this.status = 'ready';
      this.logger.info('✅ Master Orchestrator is ready!');
      this.logger.info('📊 Status: 7 main agents active, 21 sub-agents operational');

      // Emit ready event
      this.emit('ready', {
        agents: Array.from(this.agents.keys()),
        status: this.getSystemStatus()
      });

    } catch (error) {
      this.logger.error('Failed to start orchestrator:', error);
      this.status = 'error';
      throw error;
    }
  }

  /**
   * Connect to RabbitMQ for message passing
   */
  private async connectRabbitMQ(): Promise<void> {
    const url = process.env.RABBITMQ_URL || 'amqp://cryb_rabbit:cryb_rabbit_password@localhost:5672/cryb';
    
    this.rabbitmq = await amqp.connect(url);
    this.channel = await this.rabbitmq.createChannel();

    // Create exchanges and queues
    await this.channel.assertExchange('agents', 'topic', { durable: true });
    
    // Create queue for orchestrator
    await this.channel.assertQueue('orchestrator', { durable: true });
    await this.channel.bindQueue('orchestrator', 'agents', 'orchestrator.*');

    // Consume messages
    await this.channel.consume('orchestrator', (msg) => {
      if (msg) {
        this.handleMessage(msg);
        this.channel?.ack(msg);
      }
    });

    this.logger.info('✅ Connected to RabbitMQ');
  }

  /**
   * Set up inter-agent communication channels
   */
  private async setupInterAgentCommunication(): Promise<void> {
    // Create communication channels for each agent pair
    const agents = Array.from(this.agents.keys());
    
    for (const source of agents) {
      for (const target of agents) {
        if (source !== target) {
          const channelName = `agent.${source}.to.${target}`;
          await this.channel?.assertQueue(channelName, { durable: true });
          await this.channel?.bindQueue(channelName, 'agents', channelName);
        }
      }
    }

    this.logger.info('✅ Inter-agent communication channels established');
  }

  /**
   * Set up orchestrator command handlers
   */
  private async setupOrchestratorCommands(): Promise<void> {
    // Command: Get system status
    this.on('command:status', () => {
      return this.getSystemStatus();
    });

    // Command: Execute task
    this.on('command:execute', async (task) => {
      return await this.executeTask(task);
    });

    // Command: Scale agent
    this.on('command:scale', async ({ agentId, replicas }) => {
      return await this.scaleAgent(agentId, replicas);
    });

    // Command: Get agent metrics
    this.on('command:metrics', async (agentId) => {
      return await this.getAgentMetrics(agentId);
    });

    this.logger.info('✅ Orchestrator commands configured');
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(msg: amqp.Message): void {
    try {
      const content = JSON.parse(msg.content.toString());
      const { from, to, type, action, payload, correlationId } = content;

      this.logger.debug(`Message received: ${from} -> ${to} [${action}]`);

      // Route message to appropriate agent
      if (to === 'orchestrator') {
        this.handleOrchestratorMessage(content);
      } else {
        const agent = this.agents.get(to);
        if (agent) {
          agent.handleMessage(content);
        } else {
          this.logger.warn(`Unknown agent: ${to}`);
        }
      }
    } catch (error) {
      this.logger.error('Error handling message:', error);
    }
  }

  /**
   * Handle orchestrator-specific messages
   */
  private handleOrchestratorMessage(message: any): void {
    const { action, payload, correlationId } = message;

    switch (action) {
      case 'ping':
        this.sendResponse(message.from, { status: 'pong' }, correlationId);
        break;
      
      case 'status':
        this.sendResponse(message.from, this.getSystemStatus(), correlationId);
        break;
      
      case 'execute':
        this.executeTask(payload).then(result => {
          this.sendResponse(message.from, result, correlationId);
        });
        break;
      
      default:
        this.logger.warn(`Unknown orchestrator action: ${action}`);
    }
  }

  /**
   * Execute a task by delegating to appropriate agents
   */
  async executeTask(task: any): Promise<any> {
    const { type, data, priority = 'medium' } = task;
    
    this.logger.info(`Executing task: ${type} [${priority}]`);
    this.status = 'busy';

    try {
      // Determine which agent should handle the task
      const agent = this.determineAgent(type);
      
      if (!agent) {
        throw new Error(`No agent available for task type: ${type}`);
      }

      // Execute task
      const result = await agent.executeTask({
        id: this.generateTaskId(),
        type,
        data,
        priority,
        timestamp: new Date()
      });

      this.status = 'ready';
      return {
        success: true,
        result,
        agent: agent.getId(),
        timestamp: new Date()
      };

    } catch (error) {
      this.status = 'ready';
      this.logger.error(`Task execution failed:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Determine which agent should handle a task
   */
  private determineAgent(taskType: string): MainAgent | null {
    // Task routing logic
    const taskRouting: Record<string, string> = {
      'community.create': 'community',
      'community.moderate': 'community',
      'content.create': 'content',
      'content.search': 'content',
      'user.authenticate': 'user',
      'user.profile': 'user',
      'web3.connect': 'web3',
      'web3.verify': 'web3',
      'realtime.call': 'realtime',
      'realtime.notify': 'realtime',
      'analytics.track': 'analytics',
      'analytics.report': 'analytics',
      'infrastructure.deploy': 'infrastructure',
      'infrastructure.backup': 'infrastructure'
    };

    const agentKey = Object.keys(taskRouting).find(key => 
      taskType.startsWith(key.split('.')[0])
    );

    return agentKey ? this.agents.get(taskRouting[agentKey]) || null : null;
  }

  /**
   * Scale an agent by adjusting replicas
   */
  async scaleAgent(agentId: string, replicas: number): Promise<any> {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    await agent.scale(replicas);
    
    return {
      agent: agentId,
      replicas,
      status: 'scaled'
    };
  }

  /**
   * Get metrics for a specific agent
   */
  async getAgentMetrics(agentId?: string): Promise<any> {
    if (agentId) {
      const agent = this.agents.get(agentId);
      return agent ? await agent.getMetrics() : null;
    }

    // Get metrics for all agents
    const metrics: Record<string, any> = {};
    
    for (const [id, agent] of this.agents) {
      metrics[id] = await agent.getMetrics();
    }

    return metrics;
  }

  /**
   * Get system status
   */
  getSystemStatus(): any {
    const agentStatuses: Record<string, any> = {};
    
    for (const [id, agent] of this.agents) {
      agentStatuses[id] = agent.getStatus();
    }

    return {
      orchestrator: {
        status: this.status,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        pid: process.pid
      },
      agents: agentStatuses,
      statistics: {
        totalAgents: 7,
        totalSubAgents: 21,
        activeAgents: Array.from(this.agents.values()).filter(a => 
          a.getStatus().state === 'ready'
        ).length
      },
      timestamp: new Date()
    };
  }

  /**
   * Send response to an agent
   */
  private sendResponse(to: string, payload: any, correlationId: string): void {
    const message = {
      from: 'orchestrator',
      to,
      type: 'response',
      payload,
      correlationId,
      timestamp: new Date()
    };

    this.channel?.publish('agents', `agent.orchestrator.to.${to}`, 
      Buffer.from(JSON.stringify(message))
    );
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Master Orchestrator...');
    this.status = 'shutdown';

    // Stop all agents
    const stopPromises = Array.from(this.agents.values()).map(agent => 
      agent.stop()
    );
    await Promise.all(stopPromises);

    // Close connections
    await this.channel?.close();
    await this.rabbitmq?.close();
    await this.redis.quit();

    this.logger.info('✅ Master Orchestrator shut down successfully');
  }
}

// Create and export singleton instance
export const orchestrator = new MasterOrchestrator();

// Handle process signals
process.on('SIGTERM', async () => {
  await orchestrator.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await orchestrator.shutdown();
  process.exit(0);
});