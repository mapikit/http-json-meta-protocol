import { getObjectProperty } from "./utils/get-object-property";
import { HTTPRouteConfiguration, InputMap } from "./configuration";
import { setValueAtObjectPath } from "./utils/set-value-at-object-path";
import { FastifyRequest } from "fastify";

export class HTTPJsonBodyInputMap {
  /**
   * Recieves an HTTP request and returns an object compatible with the activationFunction params
   */
  public static mapInputs (request : FastifyRequest, routeConfig : HTTPRouteConfiguration) : unknown {
    const inputObject = {};

    routeConfig.inputMapConfiguration.forEach((inputMapper) => {
      const propertyValue = this.getValueFromRequest(request, inputMapper);
      setValueAtObjectPath(inputObject, inputMapper.targetPath, propertyValue);
    });

    return inputObject;
  }

  // TODO: add cookie here
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

    return request.params[inputMap.originPath];
  }
}
