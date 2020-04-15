const { db, uuid, unix } = require("../Utils");
const AbstractRoom = require("../Abstract/Room");

class Room extends AbstractRoom {
  static name = "home";

  static options = {
    single: true,
    announce: true, // Announce when new player join
    max_users: 0, // Max users in this room
    min_users: 1, // Min players to start the room
  };

  constructor(app, party = null) {
    super(app, name, party, options);
  }
}

module.exports = Room;
