const separator = ":";

export default function (key, byArgs = false) {
  let parsed;

  if (byArgs) {
    return [...arguments].join(separator);
  }

  if (typeof key === typeof "") {
    parsed = {};
    let pairs = key.split(":");
    for (let i = 0; i < pairs.length; i++) {
      parsed[pairs[i]] = pairs[i + 1] ? pairs[i + 1] : null;
      i++;
    }
    return parsed;
  }

  if (Array.isArray(key)) {
    return key.join(separator);
  }

  if (typeof key === typeof {}) {
    parsed = "";
    Object.keys(key).forEach((k) => {
      parsed += `${k}${separator}${key[k]}:`;
    });
    return parsed.substring(0, parsed.length - 1);
  }

  return "";
}
