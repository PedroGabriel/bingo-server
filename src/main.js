const { db, encoder, uuid, cookie } = require("./utils");
const rooms = require("./rooms");
const routes = require("./routes");

const uWS = require("uWebSockets.js");
const app = uWS
  .App({
    // key_file_name: 'misc/key.pem',
    // cert_file_name: 'misc/cert.pem',
    // passphrase: '1234'
  })
  .ws("/*", {
    compression: 0,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 60 * 5,
    open: (ws, req) => {
      ws.id = uuid();
      // db.hmset(`users:${ws.id}`, { name: "test" });
      // db.set(`connected:${ws.id}`, 1);
      ws.subscribe("main");
      ws.subscribe(ws.id);
    },
    message: (ws, msg, isBinary) => {
      console.log("fora", ws.id + ": " + encoder.decode(msg));
    },
    drain: (ws) => {
      console.log("WebSocket backpressure: " + ws.getBufferedAmount());
    },
    close: (ws, code, message) => {
      // db.del(`users:${ws.id}`);
      // db.del(`connected:${ws.id}`);
    },
  });

Object.keys(routes).forEach((k) => {
  let r = routes[k];
  app[r.type || "any"](r.path, r.page);
});

app.listen(parseInt(process.env.PORT || 5000), () => {});
