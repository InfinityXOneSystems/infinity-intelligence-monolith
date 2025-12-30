import { VisionCortex } from '../vision-cortex/VisionCortex';
import { UniversalCrawler } from '../crawler/UniversalCrawler';
import { AgentStack } from '../agents/AgentStack';
import { InfinityGateway } from '../infinity-gateway/InfinityGateway';
import { Orchestrator } from '../orchestrator/Orchestrator';
import { AutoBuilder } from '../auto-builder/AutoBuilder';
import { FirestoreService } from '../services/FirestoreService';
import { PubSubService } from '../services/PubSubService';
import { Logger } from '../utils/Logger';
import { Config } from '../utils/Config';

export class InfinityIntelligenceSystem {
  private visionCortex: VisionCortex;
  private crawler: UniversalCrawler;
  private agentStack: AgentStack;
  private gateway: InfinityGateway;
  private orchestrator: Orchestrator;
  private autoBuilder: AutoBuilder;
  private firestore: FirestoreService;
  private pubsub: PubSubService;
  private logger: Logger;
  private config: Config;

  constructor() {
    this.logger = new Logger();
    this.config = new Config();
    this.firestore = new FirestoreService();
    this.pubsub = new PubSubService();
    this.crawler = new UniversalCrawler(this.firestore, this.pubsub);
    this.autoBuilder = new AutoBuilder(this.firestore, this.pubsub);
    this.visionCortex = new VisionCortex(this.firestore, this.pubsub, this.crawler, this.autoBuilder);
    this.agentStack = new AgentStack(this.firestore, this.pubsub);
    this.gateway = new InfinityGateway(this.firestore, this.pubsub);
    this.orchestrator = new Orchestrator(
      this.visionCortex,
      this.crawler,
      this.agentStack,
      this.gateway,
      this.firestore,
      this.pubsub
    );
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Infinity Intelligence System components...');
    
    await this.firestore.initialize();
    await this.pubsub.initialize();
    await this.visionCortex.initialize();
    await this.crawler.initialize();
    await this.agentStack.initialize();
    await this.gateway.initialize();
    await this.orchestrator.initialize();
    await this.autoBuilder.initialize();
    
    // Set vision cortex in gateway for chat UI
    this.gateway.setVisionCortex(this.visionCortex);
    
    this.logger.info('All components initialized');
  }

  async start(): Promise<void> {
    this.logger.info('Starting Infinity Intelligence System...');
    
    // Start all services in parallel
    await Promise.all([
      this.visionCortex.start(),
      this.crawler.start(),
      this.agentStack.start(),
      this.gateway.start(),
      this.orchestrator.start(),
      this.autoBuilder.start()
    ]);
    
    this.logger.info('Infinity Intelligence System fully operational');
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping Infinity Intelligence System...');
    
    await Promise.all([
      this.visionCortex.stop(),
      this.crawler.stop(),
      this.agentStack.stop(),
      this.gateway.stop(),
      this.orchestrator.stop(),
      this.autoBuilder.stop()
    ]);
    
    await this.pubsub.close();
    await this.firestore.close();
    
    this.logger.info('Infinity Intelligence System stopped');
  }
}