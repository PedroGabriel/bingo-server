const { db, encoder, cookie, log } = require("./Libs");
const uWS = require("uWebSockets.js");

class Ws {
  socket = null;
  Apis = require("./Api");
  clients = {};

  #loadtest = null;
  #loadtest_hit = null;

  init = (port, ssl = {}, listener = {}) => {
    if (process.env.LOGLEVEL == "test") {
      this.#loadtest = require("../tests/loadtest/session_ids");
      this.#loadtest_hit = 0;
    }

    listener.open;

    this.socket = uWS.App(ssl).ws("/*", {
      compression: 0,
      maxPayloadLength: 16 * 1024 * 1024,
      idleTimeout: 60 * 5,
      open: (ws, req) => {
        let sid = cookie.get(req, "SID");

        if (this.#loadtest) {
          this.#loadtest_hit++;
          sid = this.#loadtest(this.#loadtest_hit);
        }

        if (sid) {
          db.hgetallp(`session:${sid}`)
            .then((result) => {
              if (result && result.id) {
                ws.id = result.id;
                ws.sid = sid;

                if (this.clients[ws.id]) this.clients[ws.id].close();

                this.clients[ws.id] = ws;
                if (listener.open) listener.open(ws, req);
                log.log("connected", ws.id);
              } else ws.close();
            })
            .catch((err) => ws.close());
        } else ws.close();
      },
      message: (ws, msg) => {
        if (listener.message)
          listener.message(
            ws,
            msg.msg.byteLength ? encoder.decode(msg) : undefined
          );
      },
      drain: (ws) => {
        log.log("WebSocket backpressure: " + ws.getBufferedAmount());
        if (listener.drain) listener.drain(ws);
      },
      close: (ws, code, msg) => {
        if (this.clients[ws.id]) {
          if (!this.#loadtest) db.del(`session:${this.clients[ws.id].sid}`);
          delete this.clients[ws.id];
        }
        log.log("closed", ws.id ? ws.id : "not logged user");
        if (listener.close)
          listener.close(
            ws,
            code,
            msg.byteLength ? encoder.decode(msg) : undefined
          );
      },
    });

    let routes = this.Apis;
    Object.keys(routes).forEach((k) => {
      let r = routes[k];
      this.socket[r.type || "any"](r.path, r.page);
    });

    this.socket.listen(parseInt(port), () => {});
  };

  do = (slug, message) => {
    this.socket.publish(slug, encoder.encode(message));
    return true;
  };

  say = (message) => {
    this.socket.do("announce", encoder.encode(message));
    return true;
  };
}

module.exports = Ws;
