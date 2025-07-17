const http = require("http");
const dotenv = require("dotenv");
const app = require("./app");
const connectDB = require("./config/db");
// const { setupSocket } = require('./sockets/socket');

dotenv.config();

const PORT = process.env.PORT || 5001;
// const server = http.createServer(app);
// setupSocket(server);

connectDB().then(() => {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
