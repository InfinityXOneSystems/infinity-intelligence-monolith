import { FirestoreService } from '../services/FirestoreService';
import { PubSubService } from '../services/PubSubService';
import { Logger } from '../utils/Logger';
import { Config } from '../utils/Config';
import { Agent } from './Agent';

export interface AgentTask {
  id: string;
  type: string;
  data: any;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export class AgentStack {
  private firestore: FirestoreService;
  private pubsub: PubSubService;
  private logger: Logger;
  private config: Config;
  private agents: Agent[] = [];
  private isRunning: boolean = false;

  constructor(firestore: FirestoreService, pubsub: PubSubService) {
    this.firestore = firestore;
    this.pubsub = pubsub;
    this.logger = new Logger();
    this.config = new Config();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Agent Stack');

    // Create agent pool
    for (let i = 0; i < this.config.agentPoolSize; i++) {
      const agent = new Agent(`agent-${i}`, this.firestore, this.pubsub);
      this.agents.push(agent);
      await agent.initialize();
    }

    this.logger.info(`Created ${this.agents.length} agents`);
  }

  async start(): Promise<void> {
    this.isRunning = true;
    this.logger.info('Starting Agent Stack');

    // Subscribe to agent tasks
    await this.pubsub.subscribe('agent-tasks', this.handleAgentTask.bind(this));

    // Start all agents
    await Promise.all(this.agents.map(agent => agent.start()));

    // Start task distribution
    this.startTaskDistribution();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.logger.info('Stopping Agent Stack');

    await Promise.all(this.agents.map(agent => agent.stop()));
  }

  private async handleAgentTask(message: any): Promise<void> {
    try {
      const task: AgentTask = {
        id: message.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: message.type,
        data: message.data,
        priority: message.priority || 1,
        status: 'pending',
        createdAt: new Date()
      };

      await this.firestore.saveDocument('agent-tasks', task.id, task);

      this.logger.info(`Queued agent task: ${task.id} (${task.type})`);
    } catch (error) {
      this.logger.error('Error handling agent task', error);
    }
  }

  private startTaskDistribution(): void {
    // Distribute tasks every 10 seconds
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        // Get pending tasks ordered by priority
        const pendingTasks = await this.firestore.queryDocuments(
          'agent-tasks',
          'status',
          '==',
          'pending'
        );

        pendingTasks.sort((a, b) => b.priority - a.priority);

        // Assign tasks to available agents
        for (const task of pendingTasks) {
          const availableAgent = this.agents.find(agent => agent.isAvailable());
          if (availableAgent) {
            await availableAgent.assignTask(task);
            await this.firestore.updateDocument('agent-tasks', task.id, {
              status: 'processing',
              assignedTo: availableAgent.getId()
            });
          }
        }
      } catch (error) {
        this.logger.error('Error in task distribution', error);
      }
    }, 10000);
  }

  async submitTask(type: string, data: any, priority: number = 1): Promise<string> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await this.pubsub.publishMessage({
      id: taskId,
      type,
      data,
      priority
    }, { type: 'agent-task' });

    return taskId;
  }

  getAgentStatus(): any {
    return {
      totalAgents: this.agents.length,
      availableAgents: this.agents.filter(agent => agent.isAvailable()).length,
      busyAgents: this.agents.filter(agent => !agent.isAvailable()).length
    };
  }
}