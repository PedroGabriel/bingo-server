import AbstractUser from "@/Abstract/User";

class User extends AbstractUser {
  constructor(App, ws) {
    super(App, ws);

    this.store.coins = 500;
  }
}

export default User;
