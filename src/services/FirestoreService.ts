import { Firestore } from '@google-cloud/firestore';
import { Logger } from '../utils/Logger';
import { Config } from '../utils/Config';

export class FirestoreService {
  private firestore: Firestore;
  private logger: Logger;
  private config: Config;

  constructor() {
    this.logger = new Logger();
    this.config = new Config();
    this.firestore = new Firestore({
      projectId: this.config.projectId
    });
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Firestore service');
    // Firestore initializes automatically
  }

  async close(): Promise<void> {
    this.logger.info('Closing Firestore service');
    // Firestore handles connection pooling
  }

  async saveDocument(collection: string, documentId: string, data: any): Promise<void> {
    try {
      await this.firestore.collection(collection).doc(documentId).set(data);
      this.logger.debug(`Document saved: ${collection}/${documentId}`);
    } catch (error) {
      this.logger.error(`Failed to save document: ${collection}/${documentId}`, error);
      throw error;
    }
  }

  async getDocument(collection: string, documentId: string): Promise<any> {
    try {
      const doc = await this.firestore.collection(collection).doc(documentId).get();
      if (doc.exists) {
        return doc.data();
      }
      return null;
    } catch (error) {
      this.logger.error(`Failed to get document: ${collection}/${documentId}`, error);
      throw error;
    }
  }

  async queryDocuments(collection: string, field: string, operator: any, value: any): Promise<any[]> {
    try {
      const query = this.firestore.collection(collection).where(field, operator, value);
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      this.logger.error(`Failed to query documents: ${collection}`, error);
      throw error;
    }
  }

  async updateDocument(collection: string, documentId: string, updates: any): Promise<void> {
    try {
      await this.firestore.collection(collection).doc(documentId).update(updates);
      this.logger.debug(`Document updated: ${collection}/${documentId}`);
    } catch (error) {
      this.logger.error(`Failed to update document: ${collection}/${documentId}`, error);
      throw error;
    }
  }

  async deleteDocument(collection: string, documentId: string): Promise<void> {
    try {
      await this.firestore.collection(collection).doc(documentId).delete();
      this.logger.debug(`Document deleted: ${collection}/${documentId}`);
    } catch (error) {
      this.logger.error(`Failed to delete document: ${collection}/${documentId}`, error);
      throw error;
    }
  }

  async listAllCollections(): Promise<string[]> {
    try {
      const collections = await this.firestore.listCollections();
      return collections.map(col => col.id);
    } catch (error) {
      this.logger.error("Failed to list collections", error);
      throw error;
    }
  }
}
