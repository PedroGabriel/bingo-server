import { readJson } from "@/Libs";
import Auth from "@/Auth.js";

export default {
  name: "login",
  path: "/login",
  type: "post",
  page: (res, req) => {
    res.writeHeader("Content-Type", "application/json");
    readJson(res, (obj) => {
      Auth.login(res, obj.email, obj.password)
        .then((user) => {
          res.end(JSON.stringify(user));
        })
        .catch((msg) => {
          res.end(msg);
        });
    });
  },
};
