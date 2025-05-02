import { Express } from 'express';
/**
 * Configure Swagger UI for Express
 * @param app Express application
 */
export declare const setupSwagger: (app: Express) => void;
/**
 * Externally expose the OpenAPI spec for documentation purposes
 */
export declare const getSwaggerSpec: () => object;
