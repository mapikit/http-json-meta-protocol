import fastifyMiddie from "@fastify/middie";
import Fastify from "fastify";
import { getObjectProperty } from "./utils/get-object-property.js";
import { setValueAtObjectPath } from "./utils/set-value-at-object-path.js";
import { HTTPRouteConfiguration, Middleware } from "./configuration.js";
import { HTTPInputMap } from "./input-map.js";
import { HTTPOutputMap } from "./output-map.js";

export class HTTPJsonBodyRoute {
  public constructor (
    private routeConfigurations : HTTPRouteConfiguration,
    private systemFunctions : Map<string, Function>,
  ) { }

  // eslint-disable-next-line max-lines-per-function
  public getPlugin () : Fastify.FastifyPluginAsync {
    const result = async (server : Fastify.FastifyInstance) : Promise<void> => {
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
    : Fastify.onRequestHookHandler {
    const bop = this.systemFunctions.get(middleware.businessOperation);
    // eslint-disable-next-line max-lines-per-function
    const wrapped = (async (
      req : Fastify.FastifyRequest, res : Fastify.FastifyReply, done : Fastify.HookHandlerDoneFunction)
    : Promise<void> => {
      const functionInputs = HTTPInputMap.mapInputs(req, middleware.inputMapConfiguration);
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

  private wrapFunctionInProtocol () : (req : Fastify.FastifyRequest, res : Fastify.FastifyReply) => Promise<void> {
    const bop = this.systemFunctions.get(this.routeConfigurations.businessOperation);

    return (async (req : Fastify.FastifyRequest, res : Fastify.FastifyReply) : Promise<void> => {
      const functionInputs = HTTPInputMap.mapInputs(req, this.routeConfigurations.inputMapConfiguration);

      let sentError = false
      const returnErrorResult = () => {
        res.status(500)
        res.send({ error: "Internal Server Error" })
        sentError = true;
      }
  
      const result = await bop(functionInputs).catch(() => returnErrorResult());

      if (sentError) return;
      await HTTPOutputMap.resolveOutput(result, res, this.routeConfigurations.resultMapConfiguration);
    });
  }
}
