import * as dotenv from 'dotenv';

dotenv.config();

export class Config {
  public readonly port: number;
  public readonly host: string;
  public readonly projectId: string;
  public readonly firestoreCollection: string;
  public readonly pubsubTopic: string;
  public readonly visionApiEndpoint: string;
  public readonly vertexAiEndpoint: string;
  public readonly crawlerConcurrency: number;
  public readonly agentPoolSize: number;
  public readonly domain: string;
  public readonly githubToken: string;
  public readonly googleWorkspaceDomain: string;
  public readonly adminAuthToken: string;

  constructor() {
    this.port = parseInt(process.env.PORT || '8080', 10);
    this.host = process.env.HOST || '0.0.0.0';
    this.projectId = process.env.GCP_PROJECT_ID || 'infinity-x-one-systems';
    this.firestoreCollection = process.env.FIRESTORE_COLLECTION || 'infinity-intelligence';
    this.pubsubTopic = process.env.PUBSUB_TOPIC || 'infinity-intelligence-events';
    this.visionApiEndpoint = process.env.VISION_API_ENDPOINT || 'https://vision.googleapis.com/v1';
    this.vertexAiEndpoint = process.env.VERTEX_AI_ENDPOINT || 'https://us-central1-aiplatform.googleapis.com';
    this.crawlerConcurrency = parseInt(process.env.CRAWLER_CONCURRENCY || '10', 10);
    this.agentPoolSize = parseInt(process.env.AGENT_POOL_SIZE || '20', 10);
    this.domain = process.env.DOMAIN || 'infinityxai.com';
    this.githubToken = process.env.GITHUB_TOKEN || '';
    this.googleWorkspaceDomain = process.env.GOOGLE_WORKSPACE_DOMAIN || 'infinityxai.com';
    this.adminAuthToken = process.env.ADMIN_AUTH_TOKEN || '';
  }
}