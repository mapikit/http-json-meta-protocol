import fastifyMiddie from "@fastify/middie";
import { FunctionManager } from "@meta-system/meta-function-helper";
import {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
  HookHandlerDoneFunction,
  onRequestHookHandler,
} from "fastify";
import { getObjectProperty } from "./utils/get-object-property";
import { setValueAtObjectPath } from "./utils/set-value-at-object-path";
import { HTTPRouteConfiguration, Middleware } from "./configuration";
import { HTTPInputMap } from "./input-map";
import { HTTPOutputMap } from "./output-map";

export class HTTPJsonBodyRoute {
  public constructor (
    private routeConfigurations : HTTPRouteConfiguration,
    private functionManager : FunctionManager,
  ) { }

  // eslint-disable-next-line max-lines-per-function
  public getPlugin () : FastifyPluginAsync {
    const result = async (server : FastifyInstance) : Promise<void> => {
      if (this.routeConfigurations.middlewares) {
        await server.register(fastifyMiddie, { hook: "preHandler" });
        this.routeConfigurations.middlewares.forEach((middleware) => {
          server.addHook("preHandler", this.getMiddleware(middleware));
        });
      }
      server.route({
        method: this.routeConfigurations.method,
        url: this.routeConfigurations.route,
        handler: this.wrapFunctionInProtocol(),
      });
    };

    return result;
  }

  // eslint-disable-next-line max-lines-per-function
  private getMiddleware (middleware : Middleware)
    : onRequestHookHandler {
    const bop = this.functionManager.get(middleware.businessOperation);
    // eslint-disable-next-line max-lines-per-function
    const wrapped = (async (req : FastifyRequest, res : FastifyReply, done : HookHandlerDoneFunction)
    : Promise<void> => {
      const functionInputs = HTTPInputMap.mapInputs(req, middleware.inputMapConfiguration);
      console.log(functionInputs);
      const results = await bop(functionInputs);

      if (
        middleware?.interceptMapConfiguration?.shouldInterceptPath) {
        const shouldIntercept = getObjectProperty(results, middleware.interceptMapConfiguration.shouldInterceptPath);

        if (shouldIntercept) {
          await HTTPOutputMap.resolveOutput(results, res, middleware.interceptMapConfiguration);
          return;
        }
      }

      if (middleware?.injectMapConfiguration) {
        middleware.injectMapConfiguration.forEach((injection) => {
          setValueAtObjectPath(req, injection.targetPath, getObjectProperty(results, injection.originPath));
        });
      }
      done();
    });

    return wrapped;
  }

  private wrapFunctionInProtocol () : (req : FastifyRequest, res : FastifyReply) => Promise<void> {
    const bop = this.functionManager.get(this.routeConfigurations.businessOperation);

    return (async (req : FastifyRequest, res : FastifyReply) : Promise<void> => {
      const functionInputs = HTTPInputMap.mapInputs(req, this.routeConfigurations.inputMapConfiguration);
      const result = await bop(functionInputs);

      await HTTPOutputMap.resolveOutput(result, res, this.routeConfigurations.resultMapConfiguration);
    });
  }
}
