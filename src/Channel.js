import { uuid, encoder } from "@/Libs";
class Channel {
  app = null;

  channels = {}; // all channels this group belongs to key:Channel

  say = (key, message) => this.ws.publish(key, encoder.encode(message));

  constructor(app, ws) {
    this.app = app;

    this.id = uuid();
    this.key = `group:${this.id}`;
  }
}

export default Channel;
