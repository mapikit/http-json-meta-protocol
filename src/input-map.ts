import { getObjectProperty } from "./utils/get-object-property";
import { InputMap } from "./configuration";
import { setValueAtObjectPath } from "./utils/set-value-at-object-path";
import { FastifyRequest } from "fastify";

export class HTTPInputMap {
  /**
   * Recieves an HTTP request and returns an object compatible with the activationFunction params
   */
  public static mapInputs (request : FastifyRequest, routeConfig : InputMap[]) : unknown {
    const inputObject = {};

    routeConfig.forEach((inputMapper) => {
      const propertyValue = this.getValueFromRequest(request, inputMapper);
      setValueAtObjectPath(inputObject, inputMapper.targetPath, propertyValue);
    });

    return inputObject;
  }

  // eslint-disable-next-line max-lines-per-function
  private static getValueFromRequest (request : FastifyRequest, inputMap : InputMap) : unknown {
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
