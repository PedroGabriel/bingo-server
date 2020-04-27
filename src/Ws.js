import { db, encoder, cookie, log } from "@/Libs";
import uWS from "uWebSockets.js";

const handleErrors = (error) => {
  handleErrors(error);
  process.exit(1);
};

class Ws {
  socket = null;
  Apis = require("@/Api");
  clients = {};

  testers = []; // the SIDs that gonna login for testing
  #loadtest = null;
  #loadtest_hit = 0;

  constructor() {}

  init = (port, ssl = {}, listener = {}) => {
    if (process.env.LOGLEVEL == "test") {
      this.#loadtest = require("#/tests/loadtest/session_ids");
      this.#loadtest_hit = 0;
    }

    this.socket = uWS.App(ssl).ws("/*", {
      compression: 1,
      maxPayloadLength: 16 * 1024 * 1024,
      idleTimeout: 60 * 5,
      open: (ws, req) => {
        let sid = cookie.get(req, "SID");

        if (this.testers.length) {
          sid = this.testers[this.#loadtest_hit];
          this.#loadtest_hit++;
        }

        if (this.#loadtest) {
          this.#loadtest_hit++;
          sid = this.#loadtest(this.#loadtest_hit);
        }

        if (sid) {
          db.hgetallp(`session:${sid}`)
            .then((result) => {
              if (result && result.id) {
                ws.id = result.id;
                ws.name = result.name;
                ws.sid = sid;

                if (this.clients[ws.id]) {
                  try {
                    this.clients[ws.id].close();
                  } catch (e) {
                    // error
                  }
                }

                this.clients[ws.id] = ws;
                if (listener.open) {
                  try {
                    listener.open(ws, req);
                  } catch (error) {
                    handleErrors(error);
                  }
                }
                log.log("SERVER: CONNECTED", ws.id);

                ws.send = (payload) => ws.send(encoder.encode(payload), true);
                ws.sendAll = (key, payload) =>
                  ws.publish(key, encoder.encode(payload), true);
              } else {
                try {
                  ws.close();
                } catch (e) {}
              }
            })
            .catch((err) => {
              try {
                ws.close();
              } catch (e) {}
            });
        } else {
          try {
            ws.close();
          } catch (e) {}
        }
      },
      message: (ws, msg) => {
        if (listener.message) {
          try {
            listener.message(ws, msg ? encoder.decode(msg) : undefined);
          } catch (error) {
            handleErrors(error);
          }
        }
      },
      drain: (ws) => {
        log.log("WebSocket backpressure: " + ws.getBufferedAmount());
        if (listener.drain) {
          try {
            listener.drain(ws);
          } catch (error) {
            console.log(erro);
          }
        }
      },
      close: (ws, code, msg) => {
        if (this.clients[ws.id]) {
          if (!this.#loadtest && !this.testers) {
            db.del(`session:${this.clients[ws.id].sid}`);
          }
          delete this.clients[ws.id];
        }
        log.log("closed", ws.id ?? "not logged user");
        if (listener.close) {
          try {
            listener.close(
              ws,
              code,
              msg.byteLength ? encoder.decode(msg) : undefined
            );
          } catch (error) {
            console.log(erro);
          }
        }
      },
    });

    let routes = this.Apis;
    Object.keys(routes).forEach((k) => {
      let r = routes[k];
      this.socket[r.type || "any"](r.path, r.page);
    });

    this.socket.listen(parseInt(port), () => {});
  };

  send = (key, payload) => {
    // console.log("SERVER: SENT", key, payload);
    this.socket.publish(key, encoder.encode(payload), true);
  };
}

export default Ws;
