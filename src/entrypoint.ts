import { HTTP_CONFIGURATION } from "./configuration.js";

let map = new Map();

export const configure = (broker, configuration : HTTP_CONFIGURATION) => {
  configuration.routes.forEach((route) => {
    map.set(route.businessOperation, broker.bopFunctions.getBopFunction(route.businessOperation))
  })

  broker.done();
}

export const boot = (broker) => {
  console.log("booting this up :D", map)
}