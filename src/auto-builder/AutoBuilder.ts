import { FirestoreService } from '../services/FirestoreService';
import { PubSubService } from '../services/PubSubService';
import { Logger } from '../utils/Logger';
import { Config } from '../utils/Config';
import * as fs from 'fs';
import * as path from 'path';

export interface FinishedDocument {
  id: string;
  title: string;
  content: string;
  metadata: any;
  sources: string[];
  createdAt: Date;
}

export interface BuildRequest {
  type: 'frontend' | 'backend' | 'fullstack' | 'api' | 'system';
  specs: any;
  document: FinishedDocument;
}

export class AutoBuilder {
  private firestore: FirestoreService;
  private pubsub: PubSubService;
  private logger: Logger;
  private config: Config;
  private indexSystem: Map<string, any> = new Map();
  private isRunning: boolean = false;

  constructor(firestore: FirestoreService, pubsub: PubSubService) {
    this.firestore = firestore;
    this.pubsub = pubsub;
    this.logger = new Logger();
    this.config = new Config();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Auto Builder (Manus.im style)');
    await this.loadIndexSystem();
  }

  async start(): Promise<void> {
    this.isRunning = true;
    this.logger.info('Starting Auto Builder');

    // Subscribe to build requests
    await this.pubsub.subscribe('build-requests', this.handleBuildRequest.bind(this));

    // Start autonomous building
    this.startAutonomousBuilding();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.logger.info('Stopping Auto Builder');
  }

  async receiveDocument(document: FinishedDocument): Promise<void> {
    this.logger.info(`Received finished document: ${document.title}`);

    // Store in results folder by industry
    const industry = document.metadata?.industry || 'general';
    const resultsPath = path.join(process.cwd(), 'results', industry);
    
    if (!fs.existsSync(resultsPath)) {
      fs.mkdirSync(resultsPath, { recursive: true });
    }

    const filePath = path.join(resultsPath, `${document.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(document, null, 2));

    // Index the document
    this.indexSystem.set(document.id, {
      path: filePath,
      metadata: document.metadata,
      industry
    });

    // Save to Firestore
    await this.firestore.saveDocument('finished-documents', document.id, document);

    // Trigger autonomous build if applicable
    await this.evaluateBuildOpportunity(document);
  }

  private async loadIndexSystem(): Promise<void> {
    // Load index from Firestore
    const indexDoc = await this.firestore.getDocument('system-config', 'index-system');
    if (indexDoc) {
      this.indexSystem = new Map(Object.entries(indexDoc));
    }
  }

  private async evaluateBuildOpportunity(document: FinishedDocument): Promise<void> {
    // Determine if this document warrants building a system
    const industry = document.metadata?.industry;
    const existingBuilds = await this.firestore.queryDocuments('builds', 'industry', '==', industry);

    if (existingBuilds.length < 5) { // Build up to 5 systems per industry
      const buildRequest: BuildRequest = {
        type: this.determineBuildType(document),
        specs: this.generateSpecs(document),
        document
      };

      await this.handleBuildRequest(buildRequest);
    }
  }

  private determineBuildType(document: FinishedDocument): 'frontend' | 'backend' | 'fullstack' | 'api' | 'system' {
    const content = document.content.toLowerCase();
    if (content.includes('dashboard') || content.includes('ui')) return 'frontend';
    if (content.includes('api') || content.includes('endpoint')) return 'api';
    if (content.includes('database') || content.includes('server')) return 'backend';
    return 'system';
  }

  private generateSpecs(document: FinishedDocument): any {
    // Generate build specifications from document
    return {
      name: `${document.metadata.industry}-intelligence-${Date.now()}`,
      features: ['data-analysis', 'reporting', 'automation'],
      techStack: ['Node.js', 'React', 'Firestore']
    };
  }

  private async handleBuildRequest(request: BuildRequest): Promise<void> {
    try {
      this.logger.info(`Processing build request: ${request.type} for ${request.document.title}`);

      const buildResult = await this.buildSystem(request);
      await this.firestore.saveDocument('builds', buildResult.id, buildResult);

      // Deploy the build
      await this.deployBuild(buildResult);

      // Publish build complete event
      await this.pubsub.publishMessage({
        type: 'build-complete',
        buildId: buildResult.id,
        result: buildResult
      }, { type: 'auto-builder' });

    } catch (error) {
      this.logger.error('Error handling build request', error);
    }
  }

  private async buildSystem(request: BuildRequest): Promise<any> {
    const buildId = `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Generate code based on type
    const code = await this.generateCode(request);

    // Create project structure
    const projectPath = path.join(process.cwd(), 'generated-builds', buildId);
    fs.mkdirSync(projectPath, { recursive: true });

    // Write files
    for (const [filePath, content] of Object.entries(code)) {
      const fullPath = path.join(projectPath, filePath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content);
    }

    return {
      id: buildId,
      type: request.type,
      specs: request.specs,
      projectPath,
      createdAt: new Date(),
      status: 'built'
    };
  }

  private async generateCode(request: BuildRequest): Promise<{ [key: string]: string }> {
    // Use AI to generate code (placeholder - would integrate with Vertex AI)
    const code: { [key: string]: string } = {};

    if (request.type === 'frontend') {
      code['package.json'] = JSON.stringify({
        name: request.specs.name,
        version: '1.0.0',
        scripts: { start: 'react-scripts start' },
        dependencies: { react: '^18.0.0' }
      }, null, 2);
      code['src/App.js'] = `
import React from 'react';
function App() {
  return <div><h1>${request.document.title}</h1><p>${request.document.content.substring(0, 200)}...</p></div>;
}
export default App;
      `;
    } else if (request.type === 'backend') {
      code['package.json'] = JSON.stringify({
        name: request.specs.name,
        version: '1.0.0',
        scripts: { start: 'node server.js' },
        dependencies: { express: '^4.18.0' }
      }, null, 2);
      code['server.js'] = `
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('${request.document.title}'));
app.listen(3000);
      `;
    }

    return code;
  }

  private async deployBuild(buildResult: any): Promise<void> {
    // Deploy to Cloud Run
    const { exec } = require('child_process');
    const deployCommand = `gcloud run deploy ${buildResult.specs.name} --source ${buildResult.projectPath} --region=us-east1 --project=${this.config.projectId} --platform=managed --allow-unauthenticated`;

    exec(deployCommand, (error: any, stdout: string, stderr: string) => {
      if (error) {
        this.logger.error(`Deployment failed: ${error.message}`);
      } else {
        this.logger.info(`Deployment successful: ${stdout}`);
      }
    });
  }

  private startAutonomousBuilding(): void {
    // Autonomous building every 10 minutes
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        // Check for build opportunities
        const documents = await this.firestore.queryDocuments('finished-documents', 'built', '==', false);
        for (const doc of documents) {
          await this.evaluateBuildOpportunity(doc);
          await this.firestore.updateDocument('finished-documents', doc.id, { built: true });
        }

        // Sync index system
        await this.firestore.saveDocument('system-config', 'index-system', Object.fromEntries(this.indexSystem));

      } catch (error) {
        this.logger.error('Error in autonomous building', error);
      }
    }, 600000); // 10 minutes
  }

  async requestBuild(type: string, specs: any, document: FinishedDocument): Promise<string> {
    const buildId = `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await this.pubsub.publishMessage({
      id: buildId,
      type,
      specs,
      document
    }, { type: 'build-request' });

    return buildId;
  }
}