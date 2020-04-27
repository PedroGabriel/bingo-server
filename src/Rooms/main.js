import { db, uuid, unix } from "@/Libs";
import AbstractRoom from "@/Abstract/Room";

class Room extends AbstractRoom {
  constructor(App, User) {
    super(App, "main", User);
  }
}

export default Room;
