/**
 * Database configuration for DynamoDB table and Global Secondary Indexes
 * 
 * This configuration defines the GSIs for the single table design.
 * Modify this file to add/remove GSIs based on your access patterns.
 */

export interface GSIConfig {
  /**
   * Name of the Global Secondary Index
   */
  indexName: string;
  
  /**
   * Partition key attribute name
   */
  partitionKey: string;
  
  /**
   * Sort key attribute name (optional)
   */
  sortKey?: string;
  
  /**
   * Description of the access pattern this GSI supports
   */
  description?: string;
}

/**
 * Global Secondary Index configurations
 * 
 * Add/remove GSIs here based on your access patterns.
 * Each GSI should support a specific query pattern in your application.
 * 
 * Example access patterns:
 * - GSI1: Query items by type and status
 * - GSI2: Query items by user and creation date
 * - GSI3: Query items by category and price range
 */
export const gsiConfigurations: GSIConfig[] = [
  // Example GSI - remove or modify based on your needs
  {
    indexName: "GSI1",
    partitionKey: "GSI1PK",
    sortKey: "GSI1SK",
    description: "Primary GSI for common access patterns (type-based queries)"
  },
  
  // Add more GSIs as needed for your access patterns
  // {
  //   indexName: "GSI2",
  //   partitionKey: "GSI2PK",
  //   sortKey: "GSI2SK",
  //   description: "Secondary GSI for user-based queries"
  // },
];

/**
 * Database table configuration
 */
export const databaseConfig = {
  /**
   * Global Secondary Indexes configuration
   */
  gsis: gsiConfigurations,
  
  /**
   * Table-level settings
   */
  settings: {
    /**
     * Enable DynamoDB Streams for event-driven architecture
     * Set to true if you need to react to table changes
     */
    enableStreams: false,
    
    /**
     * Point-in-time recovery retention period (1-35 days)
     * Higher values provide longer recovery windows but may increase costs
     */
    pitrRetentionDays: 7,
    
    /**
     * Whether to use customer-managed KMS keys for encryption
     * - true: More control, additional KMS costs
     * - false: AWS-managed keys, simpler setup
     */
    useCustomerManagedEncryption: false,
  }
};
