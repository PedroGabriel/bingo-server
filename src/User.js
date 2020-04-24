import AbstractUser from "@/Abstract/User";

class User extends AbstractUser {
  actions = {};

  constructor(App, ws) {
    super(App, ws);
  }
}

export default User;
