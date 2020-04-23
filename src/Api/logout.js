import { readJson } from "@/Libs";
import Auth from "@/Auth.js";

export default {
  name: "logout",
  path: "/logout",
  type: "get",
  page: (res, req) => {
    res.writeHeader("Content-Type", "application/json");
    Auth.logout(res).then(() => {
      res.end(JSON.stringify({ status: true }));
    });
  },
};
