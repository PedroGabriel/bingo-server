const { db, encoder, cookie, log } = require("./Libs");
const uWS = require("uWebSockets.js");

class Ws {
  socket = null;
  routes = require("./Api");
  clients = {};

  #loadtest = null;
  #loadtest_hit = null;

  init = (port, ssl = {}) => {
    if (process.env.LOGLEVEL == "test") {
      this.#loadtest = require("../tests/loadtest/session_ids");
      this.#loadtest_hit = 0;
    }

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
                let id = result.id;

                if (this.clients[id]) this.clients[id].close();

                ws.id = id;
                ws.sid = sid;

                ws.do = (message) => ws.send(encoder.encode(message));
                ws.say = (slug, message) =>
                  ws.publish(slug, encoder.encode(message));
                ws.sub = (slug) => ws.subscribe(slug);
                ws.unsub = (slug) => ws.unsubscribe(slug);
                ws.unsubAll = () => ws.unsubscribeAll(slug);

                ws.sub(`user:${id}`);

                log.test(id, "connected", this.#loadtest_hit);

                this.clients[id] = ws;
              } else {
                log.test(sid, "not in db");
                ws.close();
              }
            })
            .catch((err) => {
              log.test(sid, "not in db");
              ws.close();
            });
        } else {
          log.test("closed, no sid");
          ws.close();
        }
      },
      message: (ws, msg) => {
        // if (msg) msg = encoder.decode(msg);
      },
      drain: (ws) => {
        log.log("WebSocket backpressure: " + ws.getBufferedAmount());
      },
      close: (ws, code, msg) => {
        const id = ws.id;
        log.log("closed", id);
        if (this.clients[id]) {
          // if (msg) msg = encoder.decode(msg);

          if (!this.#loadtest) db.del(`session:${this.clients[id].sid}`);
          delete this.clients[id];
        }
      },
    });

    let routes = this.routes;
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
