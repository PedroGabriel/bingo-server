import { db, uuid, unix } from "@/Libs";
import AbstractRoom from "@/Abstract/Room";

class Room extends AbstractRoom {
  static name = "home";

  static options = {
    single: true,
    allowParty: false,
    announce: false,
    lobby: false,
    maxUsers: 0,
    minUsers: 0,
    canClose: false,
  };

  constructor(app, party = null) {
    super(app, name, party, options);
  }
}

export default Room;
