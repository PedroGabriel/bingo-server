import { db, uuid, unix } from "@/Libs";
import AbstractChannel from "@/Abstract/Channel";

class Channel extends AbstractChannel {
  static name = "home";

  static options = {
    single: true, // If there's only one of this room always available
    announce: true, // Announce when new player join
    max_users: 0, // Max users in this room
    min_users: 1, // Min players to start the room
  };

  constructor(app, party = null) {
    super(app, name, party, options);
  }
}

export default Channel;
