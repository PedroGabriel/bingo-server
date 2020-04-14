const { uuid, md5, mysql, cookie, db } = require("./utils");
const room_list = require("./rooms");
const rooms = {};

module.exports = {
  join: (user, name) => {
    if (!room_list[name]) return false;

    console.log(room_list[name].options.single_room);

    db.one("room*main*online*open", (res) => {
      console.log(res);
    });
  },
};
