import AbstractGroup from "@/Abstract/Group";

class Group extends AbstractGroup {
  constructor(App, User) {
    super(App, User);
  }

  actions = {
    chat: (User, payload = {}) => this.chat(User, payload),
    leader: (User, payload = {}) => this.newLeader(User, payload),
    join: (User) => this.join(User),
    leave: (User) => this.leave(User),
  };
}

export default Group;
