module.exports = {
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
  if (!type || !args.length) return;
  if (process.env.LOGLEVEL.toLowerCase() == type) {
    console.log(...args);
  }
};
