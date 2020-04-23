import { readJson } from "@/Libs";
import Auth from "@/Auth.js";

export default {
  name: "register",
  path: "/register",
  type: "post",
  page: (res, req) => {
    res.writeHeader("Content-Type", "application/json");
    readJson(res, (obj) => {
      Auth.register(res, obj.name, obj.email, obj.password)
        .then((user) => {
          res.end(JSON.stringify(user));
        })
        .catch((msg) => {
          res.end(msg);
        });
    });
  },
};
