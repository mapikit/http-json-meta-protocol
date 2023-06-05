import { HttpMetaProtocol } from "./index.js";
import { HTTP_CONFIGURATION } from "./configuration.js";

let map = new Map();
let addonConfig;

export const configure = (broker, configuration : HTTP_CONFIGURATION) => {
  configuration.routes.forEach((route) => {
    map.set(route.businessOperation, broker.bopFunctions.getBopFunction(route.businessOperation))
  })

  addonConfig = configuration
  broker.done();
}

export const boot = async (broker) => {
  const server = new HttpMetaProtocol(addonConfig as HTTP_CONFIGURATION, map);
  await server.start();
}