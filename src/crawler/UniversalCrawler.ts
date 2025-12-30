import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { FirestoreService } from '../services/FirestoreService';
import { PubSubService } from '../services/PubSubService';
import { Logger } from '../utils/Logger';
import { Config } from '../utils/Config';

export interface CrawlResult {
  id: string;
  url: string;
  title: string;
  content: string;
  images: string[];
  links: string[];
  metadata: any;
  timestamp: Date;
}

export class UniversalCrawler {
  private firestore: FirestoreService;
  private pubsub: PubSubService;
  private logger: Logger;
  private config: Config;
  private browser: puppeteer.Browser | null = null;
  private isRunning: boolean = false;

  constructor(firestore: FirestoreService, pubsub: PubSubService) {
    this.firestore = firestore;
    this.pubsub = pubsub;
    this.logger = new Logger();
    this.config = new Config();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Universal Crawler');
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async start(): Promise<void> {
    this.isRunning = true;
    this.logger.info('Starting Universal Crawler');

    // Subscribe to crawl requests
    await this.pubsub.subscribe('crawl-requests', this.handleCrawlRequest.bind(this));

    // Start background crawling
    this.startBackgroundCrawling();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.logger.info('Stopping Universal Crawler');
    if (this.browser) {
      await this.browser.close();
    }
  }

  private async handleCrawlRequest(message: any): Promise<void> {
    try {
      const { url, requestId, depth = 1 } = message;
      this.logger.info(`Processing crawl request: ${requestId} for ${url}`);

      const result = await this.crawlUrl(url, depth);
      await this.firestore.saveDocument('crawl-results', requestId, result);

      // Publish crawl complete event
      await this.pubsub.publishMessage({
        type: 'crawl-complete',
        requestId,
        result
      }, { type: 'crawler' });

    } catch (error) {
      this.logger.error('Error handling crawl request', error);
    }
  }

  private async crawlUrl(url: string, depth: number = 1): Promise<CrawlResult> {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();
    try {
      await page.setUserAgent('Infinity-Intelligence-Crawler/1.0');
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      const content = await page.content();
      const $ = cheerio.load(content);

      const title = $('title').text().trim();
      const textContent = $('body').text().replace(/\s+/g, ' ').trim();
      const images = $('img').map((_, img) => $(img).attr('src')).get()
        .filter(src => src)
        .map(src => src.startsWith('http') ? src : new URL(src, url).href);

      const links = $('a').map((_, a) => $(a).attr('href')).get()
        .filter(href => href && !href.startsWith('#') && !href.startsWith('javascript:'))
        .map(href => href.startsWith('http') ? href : new URL(href, url).href);

      const metadata = {
        description: $('meta[name="description"]').attr('content') || '',
        keywords: $('meta[name="keywords"]').attr('content') || '',
        ogTitle: $('meta[property="og:title"]').attr('content') || '',
        ogDescription: $('meta[property="og:description"]').attr('content') || '',
        ogImage: $('meta[property="og:image"]').attr('content') || ''
      };

      const result: CrawlResult = {
        id: `crawl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url,
        title,
        content: textContent,
        images,
        links: depth > 1 ? links.slice(0, 10) : links, // Limit links for depth > 1
        metadata,
        timestamp: new Date()
      };

      return result;
    } finally {
      await page.close();
    }
  }

  private startBackgroundCrawling(): void {
    // Process queued URLs every 60 seconds
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        const queuedUrls = await this.firestore.queryDocuments(
          'crawl-queue',
          'status',
          '==',
          'pending'
        );

        for (const queuedUrl of queuedUrls) {
          await this.handleCrawlRequest({
            url: queuedUrl.url,
            requestId: queuedUrl.id,
            depth: queuedUrl.depth || 1
          });

          await this.firestore.updateDocument('crawl-queue', queuedUrl.id, {
            status: 'processed',
            processedAt: new Date()
          });
        }
      } catch (error) {
        this.logger.error('Error in background crawling', error);
      }
    }, 60000);
  }

  async crawlUrlSync(url: string, depth: number = 1): Promise<CrawlResult> {
    return this.crawlUrl(url, depth);
  }
}