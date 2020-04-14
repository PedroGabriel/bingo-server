const { db, encoder, cookie, log } = require("./utils");
const room = require("./room.js");
const routes = require("./routes");

let loadtest, loadtest_hit;
if (process.env.LOGLEVEL == "test") {
  loadtest = require("../tests/loadtest/session_ids");
  loadtest_hit = 0;
}

/*
room.join({}, "main");

const rows = [
  0,
  1,
  2,
  3,
  4,
  0,
  1,
  2,
  3,
  4,
  0,
  1,
  3,
  4,
  0,
  1,
  2,
  3,
  4,
  0,
  1,
  2,
  3,
  4,
];
const rule_text = [
  "B: 01 a 15",
  "I: 16 a 30",
  "N: 31 a 45",
  "G: 46 a 60",
  "O: 61 a 75",
];
const rule = [
  { min: 1, max: 15 },
  { min: 16, max: 30 },
  { min: 31, max: 45 },
  { min: 46, max: 60 },
  { min: 61, max: 75 },
];
const gap_per_col = 15;

let all_test = true;
for (test = 1; test <= 1; test++) {
  let used = {};
  let test_passed = true;
  for (var i = 0; i < 24; i++) {
    let num = 0;
    do {
      num = rows[i] * gap_per_col + Math.floor(Math.random() * gap_per_col) + 1;
    } while (used[num]);
    used[num] = 1;
    // log.dev(num, rule_text[rows[i]]);
    if (num < rule[rows[i]].min || num > rule[rows[i]].max) test_passed = false;
  }
  // log.dev(test_passed ? "OK" : "FAILED");
  // log.dev("\n");
  if (!test_passed) all_test = false;
}
// log.dev(all_test ? "ALL OK" : "SOME FAILED");

return;
*/
const clients = {};
// setInterval(() => {
//   log.dev("\nclients:", clients, "\n");
// }, 10000);

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

      if (loadtest) {
        loadtest_hit++;
        sid = loadtest(loadtest_hit);
      }

      if (sid) {
        db.hgetallp(`session:${sid}`)
          .then((result) => {
            if (result && result.id) {
              let id = result.id;

              if (clients[id]) clients[id].close();

              ws.id = id;
              ws.sid = sid;

              ws.do = (message) => ws.send(encoder.encode(message));
              ws.say = (slug, message) =>
                ws.publish(slug, encoder.encode(message));
              ws.sub = (slug) => ws.subscribe(slug);
              ws.unsub = (slug) => ws.unsubscribe(slug);
              ws.unsubAll = () => ws.unsubscribeAll(slug);

              ws.sub(`user:${id}`);

              log.test(id, "connected", loadtest_hit);

              clients[id] = ws;
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
      if (clients[id]) {
        // if (msg) msg = encoder.decode(msg);

        if (!loadtest) db.del(`session:${clients[id].sid}`);
        delete clients[id];
      }
    },
  });

Object.keys(routes).forEach((k) => {
  let r = routes[k];
  app[r.type || "any"](r.path, r.page);
});

app.listen(parseInt(process.env.PORT || 5000), () => {});

app.do = (slug, message) => {
  app.publish(slug, encoder.encode(message));
  return true;
};

app.say = (message) => {
  app.do("announce", encoder.encode(message));
  return true;
};
