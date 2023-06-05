import { HTTP_CONFIGURATION } from "./configuration.js";
import { HTTPJsonBodyRoute } from "./http-jsonbody-route.js";
import Fastify from "fastify";
import fastifyHelmet from "@fastify/helmet";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyFormbody from "@fastify/formbody";

export class HttpMetaProtocol {
  private server : Fastify.FastifyInstance;
  public constructor (
    private readonly protocolConfiguration : HTTP_CONFIGURATION,
    private readonly systemFunctions : Map<string, Function>
  ) {
  }

  // eslint-disable-next-line max-lines-per-function
  public async start () : Promise<void> {
    const http = Fastify({ logger: true, ignoreTrailingSlash: true });
    this.server = http;
    await this.server.register(fastifyHelmet);
    await this.server.register(fastifyCookie);
    await this.server.register(fastifyFormbody);

    if (this.protocolConfiguration.routePrefix !== undefined) {
      this.server.prefix = this.protocolConfiguration.routePrefix;
    }

    if (this.protocolConfiguration.enableCors) {
      const corsArgs = this.protocolConfiguration.corsConfig ?? undefined;
      await this.server.register(fastifyCors, corsArgs);
    }

    if (this.protocolConfiguration.cookieSecret) {
      await this.server.register(fastifyCookie, { secret: this.protocolConfiguration.cookieSecret });
    }

    const routesSequences = [];
    this.protocolConfiguration.routes.forEach((routeConfig) => {
      console.log(`[HTTP_JSONBODY_PROTOCOL] Mapping route "${routeConfig.route}" at port ${
        this.protocolConfiguration.port
      }`);


      routesSequences.push(this.server.register(new HTTPJsonBodyRoute(routeConfig, this.systemFunctions).getPlugin())
        .then(() => {
          console.log(`[HTTP_JSONBODY_PROTOCOL] DONE Mapping route "${routeConfig.route}"`);
        }, (err) => {
          console.log(`[HTTP_JSONBODY_PROTOCOL] !! FAILED Mapping route "${routeConfig.route}" :: ${err}`);
        }));
    });

    await Promise.all(routesSequences);

    // eslint-disable-next-line max-lines-per-function
    return new Promise((resolve, reject) => {
      this.server.listen({ port: this.protocolConfiguration.port, host: this.protocolConfiguration.host })
        .catch((err) => {
          reject(`[HTTP_JSONBODY_PROTOCOL] Error while setting up port ${this.protocolConfiguration.port} :: ${err}`);
          console.log(
            `[HTTP_JSONBODY_PROTOCOL] Error while setting up port ${this.protocolConfiguration.port} :: ${err}`);
          return "FAILURE";
        });


      this.server.ready().then(() => {
        console.log(`[HTTP_JSONBODY_PROTOCOL] Finished mapping all routes for port ${
          this.protocolConfiguration.port
        }`);
        resolve();
      }, (err) => {
        const message =
          `[HTTP_JSONBODY_PROTOCOL] Could not start server at port ${this.protocolConfiguration.port} :: ${err}`;
        console.log(message);
        reject(message);
      });
    });
  }

  public async stop () : Promise<void> {
    console.log("[HTTP_JSONBODY_PROTOCOL] Shutting down server on port", this.protocolConfiguration.port);
    return new Promise((resolve, reject) => {
      this.server.close().then(() => { resolve(); }, (err) => { reject(err); });
    });
  }
}
