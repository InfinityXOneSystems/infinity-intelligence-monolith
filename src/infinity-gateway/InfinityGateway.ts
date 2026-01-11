import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { FirestoreService } from '../services/FirestoreService';
import { PubSubService } from '../services/PubSubService';
import { Logger } from '../utils/Logger';
import { Config } from '../utils/Config';
import { VisionCortex } from '../vision-cortex/VisionCortex';
import { Octokit } from '@octokit/rest';

export class InfinityGateway {
  private app: express.Application;
  private firestore: FirestoreService;
  private pubsub: PubSubService;
  private logger: Logger;
  private config: Config;
  private visionCortex: VisionCortex;
  private server: any;
  private octokit: Octokit;

  constructor(firestore: FirestoreService, pubsub: PubSubService) {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
    this.firestore = firestore;
    this.pubsub = pubsub;
    this.logger = new Logger();
    this.config = new Config();
    this.app = express();
    this.visionCortex = {} as VisionCortex; // Will be set later
  }

  setVisionCortex(visionCortex: VisionCortex): void {
    this.visionCortex = visionCortex;
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Infinity Gateway');

    // Middleware
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use("/admin", this.authenticateAdmin.bind(this));

    // Routes
    this.setupRoutes();
  }

  async start(): Promise<void> {
    this.logger.info('Starting Infinity Gateway');

    this.server = this.app.listen(this.config.port, this.config.host, () => {
      this.logger.info(`Infinity Gateway listening on ${this.config.host}:${this.config.port}`);
    });
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping Infinity Gateway');
    if (this.server) {
      this.server.close();
    }
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date() });
    });

    // Vision Cortex Chat UI (Manus.im style)
    this.app.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Infinity Intelligence</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            #chat { border: 1px solid #ccc; height: 400px; overflow-y: scroll; padding: 10px; }
            #message { width: 80%; padding: 10px; }
            button { padding: 10px 20px; }
          </style>
        </head>
        <body>
          <h1>Infinity Intelligence System</h1>
          <div id="chat"></div>
          <input type="text" id="message" placeholder="Ask the Vision Cortex...">
          <button onclick="sendMessage()">Send</button>
          <script>
            function sendMessage() {
              const message = document.getElementById('message').value;
              fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
              })
              .then(response => response.json())
              .then(data => {
                document.getElementById('chat').innerHTML += '<p><strong>You:</strong> ' + message + '</p>';
                document.getElementById('chat').innerHTML += '<p><strong>Vision Cortex:</strong> ' + data.response + '</p>';
                document.getElementById('message').value = '';
              });
            }
          </script>
        </body>
        </html>
      `);
    });

    // API Routes
    this.app.post('/api/chat', this.handleChat.bind(this));
    this.app.post('/api/analyze', this.handleAnalyze.bind(this));
    this.app.post('/api/crawl', this.handleCrawl.bind(this));
    this.app.post('/api/build', this.handleBuild.bind(this));
    this.app.get("/api/intelligence", this.handleGetIntelligence.bind(this));
    this.app.get("/admin", this.handleAdmin.bind(this));
    this.app.get("/admin/github", this.handleAdminGitHub.bind(this));
    this.app.get("/admin/firestore", this.handleAdminFirestore.bind(this));
    this.app.get("/admin/agents", this.handleAdminAgents.bind(this));
    this.app.get('/api/leads', this.handleGetLeads.bind(this));

    // Universal routing
    this.app.use('/api/*', this.universalRouter.bind(this));
  }

  private async handleChat(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { message } = req.body;
      
      // Use Vision Cortex for chat (placeholder - integrate with Vertex AI)
      const response = await this.processChatMessage(message);
      
      res.json({ response });
    } catch (error) {
      this.logger.error('Error in chat handler', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async processChatMessage(message: string): Promise<string> {
    // Process message using Vision Cortex and agents
    // Placeholder implementation
    if (message.toLowerCase().includes('analyze')) {
      return 'I can analyze images and web content. What would you like me to analyze?';
    } else if (message.toLowerCase().includes('build')) {
      return 'I can autonomously build systems. What type of system do you need?';
    } else {
      return 'Hello! I am the Infinity Intelligence Vision Cortex. How can I help you today?';
    }
  }

  private async handleAnalyze(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { imageUrl, context } = req.body;
      
      const analysis = await this.visionCortex.analyzeImageSync(imageUrl, context);
      
      res.json(analysis);
    } catch (error) {
      this.logger.error('Error in analyze handler', error);
      res.status(500).json({ error: 'Analysis failed' });
    }
  }

  private async handleCrawl(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { url, depth } = req.body;
      
      await this.pubsub.publishMessage({
        url,
        depth: depth || 1
      }, { type: 'crawl-request' });
      
      res.json({ status: 'crawl-queued' });
    } catch (error) {
      this.logger.error('Error in crawl handler', error);
      res.status(500).json({ error: 'Crawl failed' });
    }
  }

  private async handleBuild(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { type, specs } = req.body;
      
      await this.pubsub.publishMessage({
        type,
        specs
      }, { type: 'build-request' });
      
      res.json({ status: 'build-queued' });
    } catch (error) {
      this.logger.error('Error in build handler', error);
      res.status(500).json({ error: 'Build failed' });
    }
  }

  private async handleGetIntelligence(req: express.Request, res: express.Response): Promise<void> {
    try {
      const industry = req.query.industry as string || 'general';
      
      const docs = await this.firestore.queryDocuments('finished-documents', 'metadata.industry', '==', industry);
      
      res.json(docs);
    } catch (error) {
      this.logger.error('Error getting intelligence', error);
      res.status(500).json({ error: 'Failed to get intelligence' });
    }
  }

  private async handleGetLeads(req: express.Request, res: express.Response): Promise<void> {
    try {
      const industry = req.query.industry as string || 'real-estate';
      
      const leads = await this.firestore.queryDocuments('leads', 'industry', '==', industry);
      
      res.json(leads);
    } catch (error) {
      this.logger.error('Error getting leads', error);
      res.status(500).json({ error: 'Failed to get leads' });
    }
  }

  private async handleAdmin(req: express.Request, res: express.Response): Promise<void> {
    res.send("Welcome to the Admin Panel!\nCloud Run Status: Not Implemented Yet");
  }

  private async handleAdminGitHub(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { data: user } = await this.octokit.users.getAuthenticated();
      res.send(`Admin panel for GitHub user: ${user.login}`);
    } catch (error) {
      this.logger.error("Error in handleAdminGitHub", error);
      res.status(500).send("Error accessing GitHub API");
    }
  }

  private async handleAdminFirestore(req: express.Request, res: express.Response): Promise<void> {
    try {
      const collections = await this.firestore.listAllCollections();
      const collectionIds = collections.map(col => col);
      res.json({ collections: collectionIds });
    } catch (error) {
      this.logger.error("Error in handleAdminFirestore", error);
      res.status(500).send("Error accessing Firestore API");
    }
  }

  private async handleAdminAgents(req: express.Request, res: express.Response): Promise<void> {
    try {
      // Placeholder for listing agents or agent tasks
      res.json({ agents: "Agent integration coming soon!" });
    } catch (error) {
      this.logger.error("Error in handleAdminAgents", error);
      res.status(500).send("Error accessing Agents API");
    }
  }

  private authenticateAdmin(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const authToken = req.headers["x-auth-token"];
    if (!this.config.adminAuthToken) {
      this.logger.error("ADMIN_AUTH_TOKEN is not set in environment variables.");
      res.status(500).send("Server configuration error: ADMIN_AUTH_TOKEN not set.");
      return;
    }
    if (authToken === this.config.adminAuthToken) {
      next();
    } else {
      res.status(401).send("Unauthorized");
    }
  }

  private async universalRouter(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    // Universal routing logic - route to appropriate service
    const path = req.path;
    
    if (path.startsWith('/api/vision')) {
      // Route to vision cortex
    } else if (path.startsWith('/api/crawler')) {
      // Route to crawler
    } else if (path.startsWith('/api/agents')) {
      // Route to agents
    } else {
      next();
    }
  }
}