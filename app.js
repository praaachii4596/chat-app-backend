const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
// const messageRoutes = require('./routes/messageRoutes');

// const { notFound, errorHandler } = require('./middleware/errorHandler');

app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
// app.use('/api/messages', messageRoutes);

// app.use(notFound);
// app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("Chat App Backend Running");
});

module.exports = app;
