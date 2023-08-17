import { HttpMetaProtocol } from "./index.js";
import { HTTP_CONFIGURATION } from "./configuration.js";

export const configure = (broker, configuration : HTTP_CONFIGURATION) => {
  broker.done();
  return configuration;
}

export const boot = async (broker, configuration) => {
  const map = new Map();

  configuration.routes.forEach((route) => {
    map.set(route.businessOperation, broker.bopFunctions.getBopFunction(route.businessOperation))
  })

  const server = new HttpMetaProtocol(configuration as HTTP_CONFIGURATION, map);
  await server.start();
}