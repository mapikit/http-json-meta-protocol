import { FastifyReply } from "fastify";
import clone from "../node_modules/just-clone/index.mjs";
import { HTTPRouteConfiguration } from "./configuration";
import { getObjectProperty } from "./utils/get-object-property";

export class HTTPOutputMap {
  /**
   * Gets the BOps output, maps it to a valid HTTP response and resolves the request
   */
  public static async resolveOutput (
    outputData : object, response : FastifyReply, routeConfiguration : HTTPRouteConfiguration) : Promise<void> {
    const outputBody = clone(routeConfiguration.resultMapConfiguration.body);
    const statusCode = this.getStatusCode(outputData, routeConfiguration);

    this.setObjectResponse(outputBody, outputData);

    this.setHeaders(outputData, routeConfiguration, response);
    this.setCookies(outputData, routeConfiguration, response);
    void response.status(statusCode);
    await response.send(outputBody);
  }

  private static setCookies (
    outputData : object, routeConfiguration : HTTPRouteConfiguration, response : FastifyReply,
  ) : void {
    if (!routeConfiguration.resultMapConfiguration.cookies) {
      return;
    }

    routeConfiguration.resultMapConfiguration.cookies.forEach((cookie) => {
      void response.setCookie(
        getObjectProperty(outputData, cookie.namePath),
        getObjectProperty(outputData, cookie.dataPath),
        { path: cookie.path, signed: cookie.signed, httpOnly: cookie.httpOnly },
      );
    });
  }

  private static setObjectResponse (outputBody : object, data : object) : void {
    Object.keys(outputBody).forEach((outputKey) => {
      if (typeof outputBody[outputKey] === "string") {
        outputBody[outputKey] = getObjectProperty(data, outputBody[outputKey]);
        return;
      }

      this.setObjectResponse(outputBody[outputKey], data);
    });
  }

  private static getStatusCode (outputData : object, routeConfiguration : HTTPRouteConfiguration) : number {
    let statusCode;

    try {
      if (typeof routeConfiguration.resultMapConfiguration.statusCode === "number") {
        statusCode = routeConfiguration.resultMapConfiguration.statusCode;
      } else {
        statusCode = getObjectProperty(outputData, routeConfiguration.resultMapConfiguration.statusCode);
      }
    } catch {
      statusCode = 500;
    }

    return statusCode;
  }

  private static setHeaders (
    outputData : object, routeConfiguration : HTTPRouteConfiguration, response : FastifyReply) : void {

    routeConfiguration.resultMapConfiguration.headers.forEach((headerInfo) => {
      const headerName = Object.keys(headerInfo)[0];
      const headerValue = headerInfo[headerName];
      const getValue = typeof headerValue === "string"
        ? getObjectProperty(outputData, headerValue) ?? headerValue
        : headerValue;

      void response.header(headerName, getValue as string);
    });
  }
}
