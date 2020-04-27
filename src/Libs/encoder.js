import { encode, decode } from "@msgpack/msgpack";
export default {
  encode: (buf) => encode(buf),
  decode: (obj) => {
    if (obj.type && obj.type == "binary") return decode(obj.binaryData);
    let json;
    try {
      json = JSON.parse(new TextDecoder().decode(obj));
    } catch (error) {
      return new TextDecoder().decode(obj);
    }
    return json;
  },
};
