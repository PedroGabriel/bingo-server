const msgpack = require("@msgpack/msgpack");

const encoder = {
  encode: buf => msgpack.encode(buf),
  decode: obj => msgpack.decode(obj)
};

module.exports = encoder;
