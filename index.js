console.log("-".repeat(50) + "\n".repeat(8));
require("dotenv").config();

// {
//   key_file_name: "misc/key.pem",
//     cert_file_name: "misc/cert.pem",
//     passphrase: "1234",
// }

const App = require("./src/App");
const Bingo = new App(process.env.PORT_BINGO || 5000);
