import { PubSub } from '@google-cloud/pubsub';
import { Logger } from '../utils/Logger';
import { Config } from '../utils/Config';

export class PubSubService {
  private pubsub: PubSub;
  private logger: Logger;
  private config: Config;
  private subscriptions: Map<string, any> = new Map();

  constructor() {
    this.logger = new Logger();
    this.config = new Config();
    this.pubsub = new PubSub({
      projectId: this.config.projectId
    });
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing PubSub service');
    // Ensure topic exists
    await this.ensureTopic();
  }

  async close(): Promise<void> {
    this.logger.info('Closing PubSub service');
    // Close all subscriptions
    for (const [subscriptionName, subscription] of this.subscriptions) {
      await subscription.close();
      this.logger.debug(`Closed subscription: ${subscriptionName}`);
    }
  }

  private async ensureTopic(): Promise<void> {
    try {
      const topic = this.pubsub.topic(this.config.pubsubTopic);
      const [exists] = await topic.exists();
      if (!exists) {
        await topic.create();
        this.logger.info(`Created PubSub topic: ${this.config.pubsubTopic}`);
      }
    } catch (error) {
      this.logger.error(`Failed to ensure topic: ${this.config.pubsubTopic}`, error);
      throw error;
    }
  }

  async publishMessage(data: any, attributes?: { [key: string]: string }): Promise<string> {
    try {
      const topic = this.pubsub.topic(this.config.pubsubTopic);
      const messageId = await topic.publishMessage({
        data: Buffer.from(JSON.stringify(data)),
        attributes: attributes || {}
      });
      this.logger.debug(`Published message: ${messageId}`);
      return messageId;
    } catch (error) {
      this.logger.error('Failed to publish message', error);
      throw error;
    }
  }

  async subscribe(subscriptionName: string, messageHandler: (message: any) => Promise<void>): Promise<void> {
    try {
      const subscription = this.pubsub.subscription(subscriptionName);
      const [exists] = await subscription.exists();
      if (!exists) {
        await this.pubsub.topic(this.config.pubsubTopic).createSubscription(subscriptionName);
        this.logger.info(`Created subscription: ${subscriptionName}`);
      }

      const messageListener = subscription.on('message', async (message) => {
        try {
          const data = JSON.parse(message.data.toString());
          await messageHandler(data);
          message.ack();
        } catch (error) {
          this.logger.error('Error processing message', error);
          message.nack();
        }
      });

      this.subscriptions.set(subscriptionName, messageListener);
      this.logger.info(`Subscribed to: ${subscriptionName}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe: ${subscriptionName}`, error);
      throw error;
    }
  }
}