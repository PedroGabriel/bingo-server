const now = () => Math.floor(new Date() / 1000);
export default {
  now: now,
  add: (seconds = 0, time = null) => (time ?? now()) + seconds,
  sub: (seconds = 0, time = null) => (time ?? now()) - seconds,
};
