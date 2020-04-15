const { uuid, md5, mysql, cookie, db } = require("./Utils");
const Ws = require("./Ws");
// const Room = require("./Room");
// const User = require("./User");
// const Party = require("./Party");

class App extends Ws {
  ws = null;

  users = {};
  rooms = {};
  room = {};
  party = {};

  rooms = {
    list: require("./Rooms"),
    instance: {},
  };

  room = {};

  constructor(port, ssl) {
    super();
    this.init(port, ssl);
  }
}

// console.log(room.list["main"].options.single);

module.exports = App;
