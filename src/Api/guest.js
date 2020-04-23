import { readJson } from "@/Libs";
import Auth from "@/Auth.js";

export default {
  name: "guest",
  path: "/guest",
  type: "post",
  page: (res, req) => {
    res.writeHeader("Content-Type", "application/json");
    readJson(res, (obj) => {
      Auth.guest(res)
        .then((user) => {
          res.end(JSON.stringify(user));
        })
        .catch((msg) => {
          res.end(msg);
        });
    });
  },
};
