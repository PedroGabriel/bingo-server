export default {
  name: "404",
  path: "/*",
  page: (res, req) => {
    res.end("404");
  },
};
