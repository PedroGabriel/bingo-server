const uWS = require("uWebSockets.js");

const { mem, encoder, uuid } = require("./utils");
const rooms = require("./rooms");
const routes = require("./routes");

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
      mem.hmset(`users:${ws.id}`, { name: "test" });
      mem.set(`connected:${ws.id}`, 1);

      ws.subscribe("main");
      ws.send(encoder.encode([1, 3, 2]));
    },
    message: (ws, msg, isBinary) => {
      // console.log(ws.id + ": " + new TextDecoder("UTF-8").decode(msg));
      // console.log(ws.id + ": " + encoder.decode(msg));
      // testar pubsub para separar a mensagel por room
    },
    drain: ws => {
      console.log("WebSocket backpressure: " + ws.getBufferedAmount());
    },
    close: (ws, code, message) => {
      mem.del(`users:${ws.id}`);
      mem.del(`connected:${ws.id}`);
    }
  });

Object.keys(routes).forEach(k => {
  let r = routes[k];
  app.any(r.path, r.page);
});

app.listen(parseInt(process.env.PORT || 5000), () => {});
