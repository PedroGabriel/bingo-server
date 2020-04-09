const { db, encoder, cookie } = require("./utils");
const rooms = require("./rooms");
const routes = require("./routes");

const clients = {};
setInterval(() => {
  console.log("\nclients:", clients, "\n");
}, 10000);

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
      let sid = cookie.get(req, "SID");
      if (!sid) ws.close();

      db.hgetall(`session:${sid}`, (err, res) => {
        if (err) {
          ws.close();
          return false;
        }

        if (res && res.id) {
          let id = res.id;

          if (clients[id]) clients[id].close();

          ws.id = id;
          ws.sid = sid;
          clients[id] = ws;

          ws.room = "main";
          ws.subscribe(`user:${id}`);

          if (ws.room && rooms[ws.room] && rooms[ws.room].open) {
            rooms[ws.room].open(app, ws, req);
          }
        }
      });
    },
    message: (ws, msg) => {
      if (msg) msg = encoder.decode(msg);

      if (ws.room && rooms[ws.room] && rooms[ws.room].message) {
        rooms[ws.room].message(app, ws, msg);
      }
    },
    drain: (ws) => {
      console.log("WebSocket backpressure: " + ws.getBufferedAmount());
    },
    close: (ws, code, msg) => {
      const id = ws.id;
      if (clients[id]) {
        if (msg) msg = encoder.decode(msg);
        if (ws.room && rooms[ws.room] && rooms[ws.room].close) {
          rooms[ws.room].close(app, ws, code, msg);
        }

        db.del(`session:${clients[id].sid}`);
        delete clients[id];
      }
    },
  });

Object.keys(routes).forEach((k) => {
  let r = routes[k];
  app[r.type || "any"](r.path, r.page);
});

app.listen(parseInt(process.env.PORT || 5000), () => {});
