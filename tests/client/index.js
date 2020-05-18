import { encoder } from "@/Libs";
import WebSocketClient from "websocket";

const debug = 0;

class Client {
  id = null;
  client = null;

  constructor(id, { connect = () => {}, message = () => {} }, globalMessage) {
    this.id = id;
    this.client = new WebSocketClient.client();
    this.client.connect("ws://localhost:5000");

    this.client.on("connectFailed", function (error) {
      if (debug) console.log("CLIENT", error.toString());
    });

    this.client.on("connect", function (ws) {
      if (debug) console.log("CLIENT: CONNECTED");

      connect(id, ws);

      ws.on("error", function (error) {
        if (debug) console.log("CLIENT: ERROR", error);
      });
      ws.on("close", function () {
        if (debug) console.log("CLIENT: CLOSED");
      });
      ws.on("message", function (payload) {
        if (debug) console.log("CLIENT: GOT", encoder.decode(payload));
        globalMessage(id, encoder.decode(payload));
        message(id, encoder.decode(payload), ws);
      });
    });
  }
}

export default Client;
