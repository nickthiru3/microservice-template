/**
 * Deals API Endpoints
 *
 * Orchestrates all /deals API endpoints and resources.
 * Creates API Gateway resources and attaches endpoint handlers.
 *
 * Current Endpoints:
 * - POST /deals - Create new deal
 *
 * Future Endpoints:
 * - GET /deals - List deals
 * - GET /deals/{id} - Get deal by ID
 * - PUT /deals/{id} - Update deal
 * - DELETE /deals/{id} - Delete deal
 *
 * @module lib/api/endpoints/deals/construct
 */

import { Construct } from "constructs";
import PostConstruct from "./post/construct";
import type { IApiProps } from "#lib/api/construct";
import DatabaseConstruct from "#lib/db/construct";

/**
 * Props for DealsConstruct
 *
 * @property apiProps - API Gateway configuration (RestApi, CORS, Auth)
 * @property db - Database construct for DynamoDB table access
 */
interface IDealsConstructProps {
  readonly apiProps: IApiProps;
  readonly db: DatabaseConstruct;
}

/**
 * Deals Endpoints Construct
 *
 * Creates /deals resource and all deal-related endpoints.
 * Orchestrates endpoint constructs (POST, GET, etc.).
 *
 * @example
 * // Create deals endpoints
 * new DealsConstruct(this, 'DealsConstruct', {
 *   apiProps: apiProps,
 *   db: dbConstruct
 * });
 */
class DealsConstruct extends Construct {
  /**
   * Creates the deals endpoints construct
   *
   * Creates:
   * 1. /deals API Gateway resource with CORS
   * 2. POST /deals endpoint (create deal)
   * 3. Future: GET, PUT, DELETE endpoints
   *
   * @param scope - Parent construct
   * @param id - Construct identifier
   * @param props - Configuration properties
   */
  constructor(scope: Construct, id: string, props: IDealsConstructProps) {
    super(scope, id);

    const { apiProps, db } = props;

    // Create /deals resource with CORS enabled
    const dealsResource = apiProps.restApi.root.addResource(
      "deals",
      apiProps.optionsWithCors
    );

    // POST /deals - Create new deal
    new PostConstruct(this, "PostConstruct", {
      apiProps,
      db,
      dealsResource,
    });

    // Future endpoints:
    // new GetConstruct(this, "GetConstruct", { ... });
    // new PutConstruct(this, "PutConstruct", { ... });
    // new DeleteConstruct(this, "DeleteConstruct", { ... });
  }
}

export default DealsConstruct;
