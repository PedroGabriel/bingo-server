const msgpack = require("@msgpack/msgpack");
module.exports = {
  encode: (buf) => msgpack.encode(buf),
  decode: (obj) => {
    if (obj.type && obj.type == "binary") return msgpack.decode(obj.binaryData);
    return JSON.parse(new TextDecoder().decode(obj));
  },
};
