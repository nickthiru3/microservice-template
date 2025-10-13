/**
 * Primary resource API endpoints
 *
 * Orchestrates all `/resource` API endpoints and resources.
 * Creates API Gateway resources and attaches endpoint handlers.
 *
 * Current Endpoints:
 * - POST /resource
 *
 * Future Endpoints (scaffolding):
 * - GET /resource
 * - GET /resource/{id}
 * - PUT /resource/{id}
 * - DELETE /resource/{id}
 *
 * @module lib/api/endpoints/resource/construct
 */

import { Construct } from "constructs";
import PostConstruct from "./post/construct";
import type { IApiProps } from "#lib/api/construct";
import DatabaseConstruct from "#lib/db/construct";

interface IResourceEndpointsConstructProps {
  readonly apiProps: IApiProps;
  readonly db: DatabaseConstruct;
}

class ResourceEndpointsConstruct extends Construct {
  /**
   * Creates the primary resource endpoints construct
   *
   * Creates:
   * 1. /resource API Gateway resource with CORS
   * 2. POST /resource endpoint (create resource)
   * 3. Future: GET, PUT, DELETE endpoints
   *
   * @param scope - Parent construct
   * @param id - Construct identifier
   * @param props - Configuration properties
   */
  constructor(
    scope: Construct,
    id: string,
    props: IResourceEndpointsConstructProps
  ) {
    super(scope, id);

    const { apiProps, db } = props;

    const resource = apiProps.restApi.root.addResource("resource", apiProps.optionsWithCors);

    // POST /resource
    new PostConstruct(this, "PostConstruct", {
      apiProps,
      db,
      resource,
    });

    // Future endpoints:
    // new GetConstruct(this, "GetConstruct", { ... });
    // new PutConstruct(this, "PutConstruct", { ... });
    // new DeleteConstruct(this, "DeleteConstruct", { ... });
  }
}

export default ResourceEndpointsConstruct;
