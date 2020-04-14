const redis = require("redis");
const { promisify } = require("util");
const redisScan = require("node-redis-scan");

const client = redis.createClient();
const scanner = new redisScan(client);
client.scanner = scanner;

client.hgetallp = promisify(client.hgetall).bind(client);
client.scanp = promisify(client.scan).bind(client);

client.each = (match, key = null, cb = null) => {
  cb = cb === null ? key : cb;
  client.scanner.eachScan(
    match,
    (scan_res) => {
      if (scan_res.length) {
        scan_res.forEach((element) => {
          if (typeof key === "string") {
            client.hget(element, key, (err, hget_res) => {
              cb(hget_res);
            });
          } else {
            client.hgetall(element, (err, hget_res) => {
              cb(hget_res);
            });
          }
        });
      }
    },
    (err, matchCount) => {
      if (err) console.log("REDIS SCAN ERROR", err);
    }
  );
};

client.all = (match, key, cb = null, count = 100) => {
  if (typeof key === "function") count = cb;

  client.scanner.scan(match, (err, scan_res) => {
    if (err) console.log("REDIS SCAN ERROR", err);
    if (count) scan_res = scan_res.slice(0, count);

    let res = {};
    let promises = [];
    scan_res.map((key) => {
      promises.push(
        new Promise((resolve) => {
          client.hgetall(key, (err, hget_res) => {
            res[key] = hget_res;
            resolve(hget_res || {});
          });
        })
      );
    });
    Promise.all(promises).then(() => {
      let ret = res;
      if (count === 1) ret = res[Object.keys(res)[0]];
      cb(ret);
    });
  });
  return client;
};

client.one = (match, cb = null) => {
  return client.all(match, cb, cb, 1);
};

client.on("connect", () => {});
client.on("error", (err) => console.log("REDIS ERROR", err));

module.exports = client;
