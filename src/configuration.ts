export type HTTP_CONFIGURATION = {
  port : number;
  host : string;
  routePrefix ?: string;
  enableCors : boolean;
  corsConfig : {
    origin : string;
    optionsSuccessStatus : number;
    allowedHeaders ?: string;
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
  inputMapConfiguration : InputMap[];
  injectMapConfiguration ?: InjectMap[];
  interceptMapConfiguration ?: InterceptMap;
}

export type InputMap = {
  origin : "route" | "queryParams" | "headers" | "body" | "cookie" | "other";
  originPath : string;
  targetPath : string;
}

export type InjectMap = {
  originPath : string;
  targetPath : string;
}

export type InterceptMap = {
  shouldInterceptPath : string; // A string specifying where to get the value if should intercept
  statusCode : string | number;
  headers : Array<Record<string, unknown>>;
  body : Record<string, unknown>;
  cookies ?: CookieData[];
}

export type ResultMap = {
  statusCode : string | number;
  headers : Array<Record<string, unknown>>;
  body : Record<string, unknown>;
  cookies ?: CookieData[];
}

export type CookieData = {
  namePath : string;
  dataPath : string;
  signed ?: boolean;
  path ?: string;
  httpOnly ?: boolean;
};

