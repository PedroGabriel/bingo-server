import { encode, decode } from "@msgpack/msgpack";
export default {
  encode: (buf) => encode(buf),
  decode: (obj) => {
    if (obj.type && obj.type == "binary") return decode(obj.binaryData);
    return JSON.parse(new TextDecoder().decode(obj));
  },
};
