const cookie_parser = require("cookie");

module.exports = {
  set: (res, key, value = undefined) => {
    if (!key) return false;
    if (typeof value !== "undefined") {
      res.writeHeader("Set-Cookie", cookie_parser.serialize(key, value));
      return true;
    }
    Object.keys(key).forEach((k) => {
      res.writeHeader("Set-Cookie", cookie_parser.serialize(k, key[k]));
    });
    return true;
  },
  get: (req, key = undefined) => {
    if (!key) return false;
    let c = cookie_parser.parse(req.getHeader("cookie") || "");
    if (typeof key !== "undefined") return c[key] || "";
    return c;
  },
  del: (res, key) => {
    if (!key) return false;
    if (typeof key === "string") {
      res.writeHeader(
        "Set-Cookie",
        cookie_parser.serialize(key, "", { maxAge: 0 })
      );
      return true;
    }
    key.forEach((k) => {
      res.writeHeader(
        "Set-Cookie",
        cookie_parser.serialize(k, "", { maxAge: 0 })
      );
    });
    return true;
  },
};
