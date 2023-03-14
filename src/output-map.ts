import { FastifyReply } from "fastify";
import clone from "just-clone/index.cjs";
import { ResultMap } from "./configuration";
import { getObjectProperty } from "./utils/get-object-property";

export class HTTPOutputMap {
  /**
   * Gets the BOps output, maps it to a valid HTTP response and resolves the request
   */
  public static async resolveOutput (
    outputData : object, response : FastifyReply, resultMap : ResultMap) : Promise<void> {
    const outputBody = clone(resultMap.body);
    const statusCode = this.getStatusCode(outputData, resultMap);

    this.setObjectResponse(outputBody, outputData);

    this.setHeaders(outputData, resultMap, response);
    this.setCookies(outputData, resultMap, response);
    void response.status(statusCode);
    await response.send(outputBody);
  }

  private static setCookies (
    outputData : object, routeConfiguration : ResultMap, response : FastifyReply,
  ) : void {
    if (!routeConfiguration.cookies) {
      return;
    }

    routeConfiguration.cookies.forEach((cookie) => {
      void response.setCookie(
        getObjectProperty(outputData, cookie.namePath) ?? cookie.namePath,
        getObjectProperty(outputData, cookie.dataPath) ?? cookie.dataPath,
        { path: cookie.path, signed: cookie.signed, httpOnly: cookie.httpOnly },
      );
    });
  }

  private static setObjectResponse (outputBody : object, data : object) : void {
    Object.keys(outputBody).forEach((outputKey) => {
      if (typeof outputBody[outputKey] === "string") {
        outputBody[outputKey] = getObjectProperty(data, outputBody[outputKey]) ?? outputBody[outputKey];
        return;
      }

      this.setObjectResponse(outputBody[outputKey], data);
    });
  }

  private static getStatusCode (outputData : object, routeConfiguration : ResultMap) : number {
    let statusCode;

    try {
      if (typeof routeConfiguration.statusCode === "number") {
        statusCode = routeConfiguration.statusCode;
      } else {
        statusCode = getObjectProperty(outputData, routeConfiguration.statusCode);
      }
    } catch {
      statusCode = 500;
    }

    return statusCode;
  }

  private static setHeaders (
    outputData : object, routeConfiguration : ResultMap, response : FastifyReply) : void {

    routeConfiguration.headers.forEach((headerInfo) => {
      const headerName = Object.keys(headerInfo)[0];
      const headerValue = headerInfo[headerName];
      const getValue = typeof headerValue === "string"
        ? getObjectProperty(outputData, headerValue) ?? headerValue
        : headerValue;

      void response.header(headerName, getValue as string);
    });
  }
}
