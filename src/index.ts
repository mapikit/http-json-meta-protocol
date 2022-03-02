import express = require("express");
import { json } from "body-parser";
import { HTTP_JSONBODY_CONFIGURATION } from "./configuration";
import { HTTPJsonBodyRoute } from "./http-jsonbody-route";
import { Server } from "http";
import { MetaProtocol } from "@meta-system/meta-protocol-helper";
import { FunctionManager } from "@meta-system/meta-function-helper";
import { cors } from "cors";

export class HttpJsonMetaProtocol extends MetaProtocol<HTTP_JSONBODY_CONFIGURATION> {
  public getProtocolPublicMethods () : Record<string, Function> {
    return {};
  }

  private server : Server
  public constructor (
    protocolConfiguration : HTTP_JSONBODY_CONFIGURATION,
    functionManager : FunctionManager,
  ) {
    super(protocolConfiguration, functionManager);
  }

  // eslint-disable-next-line max-lines-per-function
  public async start () : Promise<void> {
    const httpApp = express();
    httpApp.use(json());

    if (this.protocolConfiguration.enableCors) {
      const corsArgs = this.protocolConfiguration.corsConfig ?? undefined;
      httpApp.use(cors(corsArgs));
    }


    const routes = this.protocolConfiguration.routes.map((routeConfig) => {
      console.log(`[HTTP_JSONBODY_PROTOCOL] Mapping route "${routeConfig.route}" at port ${
        this.protocolConfiguration.port
      }`);
      return new HTTPJsonBodyRoute(routeConfig, this.bopsManager).setupRouter();
    });

    httpApp.use(routes);
    return new Promise((resolve, reject) => {
      this.server = httpApp.listen(this.protocolConfiguration.port, () => {
        if(!this.server.listening) {
          reject(`[HTTP_JSONBODY_PROTOCOL] Error while setting up port ${this.protocolConfiguration.port}`);
        }
        console.log(`[HTTP_JSONBODY_PROTOCOL] Finished mapping all routes for port ${
          this.protocolConfiguration.port
        }`);
        resolve();
      });
    });
  }

  public async stop () : Promise<void> {
    console.log("[HTTP_JSONBODY_PROTOCOL] Shutting down server on port", this.protocolConfiguration.port);
    return new Promise((resolve, reject) => {
      this.server.close((error) => {
        if(error) {
          console.error(error);
          reject(`[HTTP_JSONBODY_PROTOCOL] Unable to shutdown port ${this.protocolConfiguration.port}`);
        }
        resolve();
      });
    });
  }
}
