const { uuid, md5, mysql, cookie, db } = require("./Libs");
const Ws = require("./Ws");
const User = require("./User");
const Party = require("./Party");
const Channel = require("./Channel");

// const channels = require("./Channels");

class App extends Ws {
  users = {};
  party = {};
  channels = {};

  constructor(port, ssl) {
    super();
    this.init(port, ssl, this.on);
  }

  on = {
    open: (ws) => {
      User.create(this, ws);
    },
    message: (ws, msg) => {
      if (!msg.state || !msg.action) return;
      msg.state = msg.state.toLowerCase();
      msg.action = msg.action.toLowerCase();

      let user = this.users[ws.id] ? this.users[ws.id] : null;
      let args = { this: this, user, msg };

      if (msg.state == "party" && Party.actions[msg.action])
        Party.actions[msg.action](...args);

      if (msg.state == "channel" && Channel.actions[msg.action])
        Channel.actions[msg.action](...args);

      if (msg.state == "user" && User.actions[msg.action])
        User.actions[msg.action](...args);
    },
    close: (ws) => {
      let user = this.users[ws.id] ? this.users[ws.id] : null;
      if (user) user.remove();

      console.log(this.users);
    },
  };
}

module.exports = App;
