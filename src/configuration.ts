export type HTTP_CONFIGURATION = {
  port : number;
  host : string;
  routePrefix ?: string;
  enableCors : boolean;
  corsConfig : {
    origin : string;
    optionsSuccessStatus : number;
    allowedHeaders : string;
  };
  cookieSecret ?: string;
  routes : HTTPRouteConfiguration[];
};

export type HTTPRouteConfiguration = {
  route : string;
  middlewares ?: Middleware[];
  businessOperation : string;
  method : "GET" | "PUT" | "POST" | "PATCH" | "DELETE";
  inputMapConfiguration : InputMap[];
  resultMapConfiguration : ResultMap;
}

export type Middleware = {
  businessOperation : string;

}

export type InputMap = {
  origin : "route" | "queryParams" | "headers" | "body";
  originPath : string;
  targetPath : string;
}

export type ResultMap = {
  statusCode : string | number;
  headers : Array<Record<string, unknown>>;
  body : Record<string, unknown>;
}
