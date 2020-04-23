if (!process.env.LOGLEVEL) process.env.LOGLEVEL = "dev";

export default {
  test: function () {
    log("test", arguments);
  },
  prod: function () {
    log("prod", arguments);
  },
  dev: function () {
    log("dev", arguments);
  },
  log: function () {
    if (process.env.LOGLEVEL.toLowerCase() != "prod")
      log(process.env.LOGLEVEL.toLowerCase(), arguments);
  },
};

const log = function (type, args) {
  console.log(...args);
  return;
  if (!type || !args.length) return;
  if (!process.env.LOGLEVEL || process.env.LOGLEVEL.toLowerCase() == type) {
    console.log(...args);
  }
};
