import { CosmosClient, Database, Container } from '@azure/cosmos';
import { config } from '../config';

/**
 * CosmosDB Client Service
 * Manages database connections and provides access to containers
 */
export class CosmosDbService {
  private static instance: CosmosDbService;
  private client: CosmosClient;
  private database?: Database;

  private constructor() {
    this.client = new CosmosClient({
      endpoint: config.cosmosDb.endpoint,
      key: config.cosmosDb.key,
    });
  }

  /**
   * Get singleton instance
   */
  static getInstance(): CosmosDbService {
    if (!CosmosDbService.instance) {
      CosmosDbService.instance = new CosmosDbService();
    }
    return CosmosDbService.instance;
  }

  /**
   * Initialize database connection
   */
  async initialize(): Promise<void> {
    try {
      const { database } = await this.client.databases.createIfNotExists({
        id: config.cosmosDb.database,
      });
      this.database = database;

      // Create containers if they don't exist
      await this.createContainerIfNotExists(config.cosmosDb.containers.users, '/tenantId');
      await this.createContainerIfNotExists(config.cosmosDb.containers.refreshTokens, '/userId', {
        defaultTtl: 7 * 24 * 3600, // 7 days TTL for refresh tokens
      });
      await this.createContainerIfNotExists(config.cosmosDb.containers.auditLogs, '/tenantId', {
        defaultTtl: 90 * 24 * 3600, // 90 days TTL for audit logs
      });

      console.log('CosmosDB initialized successfully');
    } catch (error) {
      console.error('Failed to initialize CosmosDB:', error);
      throw error;
    }
  }

  /**
   * Create a container if it doesn't exist
   */
  private async createContainerIfNotExists(
    containerId: string,
    partitionKey: string,
    options?: { defaultTtl?: number }
  ): Promise<void> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    await this.database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { paths: [partitionKey] },
      defaultTtl: options?.defaultTtl,
    });
  }

  /**
   * Get a container instance
   */
  getContainer(containerId: string): Container {
    if (!this.database) {
      throw new Error('Database not initialized');
    }
    return this.database.container(containerId);
  }

  /**
   * Get users container
   */
  getUsersContainer(): Container {
    return this.getContainer(config.cosmosDb.containers.users);
  }

  /**
   * Get refresh tokens container
   */
  getRefreshTokensContainer(): Container {
    return this.getContainer(config.cosmosDb.containers.refreshTokens);
  }

  /**
   * Get audit logs container
   */
  getAuditLogsContainer(): Container {
    return this.getContainer(config.cosmosDb.containers.auditLogs);
  }
}
