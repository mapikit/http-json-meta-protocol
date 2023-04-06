import { getObjectProperty } from "./utils/get-object-property.js";
import { InputMap } from "./configuration.js";
import { setValueAtObjectPath } from "./utils/set-value-at-object-path.js";
import Fastify from "fastify";

export class HTTPInputMap {
  /**
   * Recieves an HTTP request and returns an object compatible with the activationFunction params
   */
  public static mapInputs (request : Fastify.FastifyRequest, routeConfig : InputMap[]) : unknown {
    const inputObject = {};

    routeConfig.forEach((inputMapper) => {
      const propertyValue = this.getValueFromRequest(request, inputMapper);
      setValueAtObjectPath(inputObject, inputMapper.targetPath, propertyValue);
    });

    return inputObject;
  }

  // eslint-disable-next-line max-lines-per-function
  private static getValueFromRequest (request : Fastify.FastifyRequest, inputMap : InputMap) : unknown {
    if (inputMap.origin === "body") {
      return getObjectProperty(request.body as object, inputMap.originPath);
    }

    if (inputMap.origin === "queryParams") {
      return request.query[inputMap.originPath];
    }

    if (inputMap.origin === "headers") {
      return request.headers[inputMap.originPath];
    }

    if (inputMap.origin === "cookie") {
      return request.cookies[inputMap.originPath];
    }

    if (inputMap.origin === "route") {
      return request.params[inputMap.originPath];
    }

    return request[inputMap.originPath];
  }
}
