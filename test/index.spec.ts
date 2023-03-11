import { HTTP_CONFIGURATION } from "../src/configuration";
import { HttpMetaProtocol } from "../src/index";
import ProtocolConfig from "./files/protocol-config.json" assert { type: "json" };

const runs = () : () => Promise<void> => {
  const functionsManager = new Map();

  functionsManager.set("sayHello", () => {
    return { greet: "Hello world", responseCode: 201 };
  });

  return async () : Promise<void> => {
    const protocol = new HttpMetaProtocol(ProtocolConfig as HTTP_CONFIGURATION, functionsManager);

    await protocol.start();
  };
};

runs()().catch((err) => { console.log(err); });
