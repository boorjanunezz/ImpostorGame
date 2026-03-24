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
  endVotingPhase,
  resetRoom,
  getRoomStateForPlayer,
  getRoomState,
  addChatMessage,
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

// Broadcast helper to send filtered state to each player
function broadcastRoom(roomId) {
  const room = getRoomState(roomId);
  if (!room) return;

  room.players.forEach((player) => {
    io.to(player.id).emit("roomUpdated", getRoomStateForPlayer(roomId, player.id));
  });
}

// Timer logic is handled by the tickRooms loop at the bottom.

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("createRoom", ({ hostName }, callback) => {
    const { roomId, player } = createRoom(socket.id, hostName);
    socket.join(roomId);
    callback({ roomId, player });
    broadcastRoom(roomId);
  });

  socket.on("joinRoom", ({ roomId, playerName }, callback) => {
    const result = joinRoom(roomId, socket.id, playerName);
    if (result.error) {
      callback({ error: result.error });
      return;
    }
    socket.join(roomId);
    callback({ player: result.player });
    broadcastRoom(roomId);
  });

  socket.on("startGame", ({ roomId, category, impostorCount }) => {
    const result = startGame(roomId, category, impostorCount);
    if (!result.error) {
      broadcastRoom(roomId);
    }
  });

  socket.on("vote", ({ roomId, targetId }) => {
    const result = registerVote(roomId, socket.id, targetId);
    if (result) {
      broadcastRoom(roomId);
    }
  });

  socket.on("sendMessage", ({ roomId, text }) => {
    const room = getRoomState(roomId);
    const player = room?.players.find(p => p.id === socket.id);
    if (player) {
        addChatMessage(roomId, player.name, text);
        broadcastRoom(roomId);
    }
  });

  socket.on("endVoting", ({ roomId }) => {
    const result = endVotingPhase(roomId);
    if (result && result.success) {
      broadcastRoom(roomId);
    }
  });

  socket.on("returnToLobby", ({ roomId }) => {
    const result = resetRoom(roomId);
    if (result && result.success) {
      broadcastRoom(roomId);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    const roomsAffected = leaveRoom(socket.id);
    roomsAffected.forEach((roomId) => {
      broadcastRoom(roomId);
    });
  });
});

// Simple ticker within index.js to handle time
setInterval(() => {
    const { tickRooms } = require("./gameManager");
    const affectedRooms = tickRooms();
    affectedRooms.forEach(roomId => {
        broadcastRoom(roomId);
    });
}, 1000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
