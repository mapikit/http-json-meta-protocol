import fastifyMiddie from "@fastify/middie";
import { FunctionManager } from "@meta-system/meta-function-helper";
import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";
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
      // if (this.routeConfigurations.middlewares) {
      //   await server.register(fastifyMiddie, { hook: "onRequest" });
      //   this.routeConfigurations.middlewares.forEach((middleware) => {
      //     server.register(this.getMiddleware(middleware))
      //       // eslint-disable-next-line @typescript-eslint/no-empty-function
      //       .then(() => {}, (err) => { throw err; });
      //   });
      // }
      server.route({
        method: this.routeConfigurations.method,
        url: this.routeConfigurations.route,
        handler: this.wrapFunctionInProtocol(),
      });
    };

    return result;
  }

  private getMiddleware (middleware : Middleware) : FastifyPluginAsync {
    const bop = this.functionManager.get(middleware.businessOperation);

    const result = async (server : FastifyInstance) : Promise<void> => {
      const wrapped = (async (req : FastifyRequest, res : FastifyReply, done : HookHandlerDoneFunction)
      : Promise<void> => {
        // TODO pass the response here somehow
        const functionInputs = HTTPInputMap.mapInputs(req, this.routeConfigurations);
        await bop(functionInputs);
        done();
      });

      server.addHook("onRequest", wrapped);
    };

    return result;
  }

  private wrapFunctionInProtocol () : (req : FastifyRequest, res : FastifyReply) => Promise<void> {
    const bop = this.functionManager.get(this.routeConfigurations.businessOperation);

    return (async (req : FastifyRequest, res : FastifyReply) : Promise<void> => {
      const functionInputs = HTTPInputMap.mapInputs(req, this.routeConfigurations);

      const result = await bop(functionInputs);

      await HTTPOutputMap.resolveOutput(result, res, this.routeConfigurations);
    });
  }
}
