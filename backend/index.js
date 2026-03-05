const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const {
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  registerVote,
  getRoomState,
} = require("./gameManager");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("createRoom", ({ hostName }, callback) => {
    const { roomId, player } = createRoom(socket.id, hostName);
    socket.join(roomId);
    callback({ roomId, player });
    io.to(roomId).emit("roomUpdated", getRoomState(roomId));
  });

  socket.on("joinRoom", ({ roomId, playerName }, callback) => {
    const result = joinRoom(roomId, socket.id, playerName);
    if (result.error) {
      callback({ error: result.error });
      return;
    }
    socket.join(roomId);
    callback({ player: result.player });
    io.to(roomId).emit("roomUpdated", getRoomState(roomId));
  });

  socket.on("startGame", ({ roomId, category, impostorCount }) => {
    const result = startGame(roomId, category, impostorCount);
    if (!result.error) {
      io.to(roomId).emit("gameStarted", getRoomState(roomId));
    }
  });

  socket.on("vote", ({ roomId, targetId }) => {
    const result = registerVote(roomId, socket.id, targetId);
    if (result) {
      io.to(roomId).emit("roomUpdated", getRoomState(roomId));
    }
  });

  socket.on("endVoting", ({ roomId }) => {
    const { endVotingPhase } = require("./gameManager");
    const result = endVotingPhase(roomId);
    if (result && result.success) {
      io.to(roomId).emit("gameEnded", getRoomState(roomId));
    }
  });

  socket.on("returnToLobby", ({ roomId }) => {
    const { resetRoom } = require("./gameManager"); // We didn't import it at the top, but we can do it here or add it above
    const result = resetRoom(roomId);
    if (result && result.success) {
      io.to(roomId).emit("roomUpdated", getRoomState(roomId));
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    const roomsAffected = leaveRoom(socket.id);
    roomsAffected.forEach((roomId) => {
      io.to(roomId).emit("roomUpdated", getRoomState(roomId));
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
