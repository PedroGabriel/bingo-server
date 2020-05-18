import AbstractRoom from "@/Abstract/Room";

const name = __filename.slice(__dirname.length + 1, -3);
const options = {};

class Room extends AbstractRoom {
  constructor(App, User = null) {
    super(App, name, User, options);
  }

  onCreate = () => {
    // console.log("room", this.name, "created");
  };

  onUpdate = () => {
    // console.log("update");
  };

  onMessage = (User, action, payload) => {
    // console.log(`room ${this.name}:`, User.name, "said", action, payload);
    if (action == "join" && payload.id) {
      User.goId(payload.id);
    }
  };

  onJoin = (User) => {
    // console.log(`room ${this.name}:`, User.name, "joined the room");
    User.sub(this.name);

    User.do({
      action: this.name,
      payload: this.app.getLobbyRooms(),
    });
  };

  onLeave = (User) => {
    // console.log(User.id, "left room", this.name);
    User.unsub("lobby");
  };
}

export default Room;
