// gameManager.js

// Categories and Words
const WORDS = {
  Objetos: ['Tenedor', 'Cuchara', 'Silla', 'Mesa', 'Reloj', 'Gafas', 'Espejo', 'Llave', 'Teléfono', 'Cartera', 'Bolígrafo', 'Botella'],
  Animales: ['Perro', 'Gato', 'Elefante', 'León', 'Tigre', 'Cebra', 'Jirafa', 'Mono', 'Oso', 'Lobo', 'Delfín', 'Pingüino'],
  Comida: ['Pizza', 'Hamburguesa', 'Sushi', 'Taco', 'Pasta', 'Ensalada', 'Sopa', 'Queso', 'Pan', 'Huevo', 'Manzana', 'Plátano'],
  Profesiones: ['Médico', 'Abogado', 'Profesor', 'Ingeniero', 'Bombero', 'Policía', 'Pintor', 'Músico', 'Cocinero', 'Actor', 'Piloto', 'Carpintero'],
  Peliculas: ['Titanic', 'Avatar', 'Matrix', 'Inception', 'Star Wars', 'Jurassic Park', 'El Padrino', 'Gladiator', 'Rocky', 'Jaws', 'Alien', 'Terminator'],
};

// In-memory state
// rooms[roomId] = {
//   id: roomId,
//   host: socketId,
//   state: 'Lobby' | 'Playing' | 'Voting' | 'Results',
//   players: [ { id: socketId, name: string, role: 'crew' | 'impostor', hasVoted: boolean, votesReceived: number } ],
//   secretWord: string,
//   category: string,
//   impostorId: socketId,
// }
const rooms = {};

// Utils
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function createRoom(socketId, hostName) {
  let roomId;
  do {
    roomId = generateRoomCode();
  } while (rooms[roomId]);

  const hostPlayer = {
    id: socketId,
    name: hostName,
    role: null,
    hasVoted: false,
    votesReceived: 0,
  };

  rooms[roomId] = {
    id: roomId,
    host: socketId,
    state: 'Lobby',
    players: [hostPlayer],
    secretWord: null,
    category: null,
    impostorId: null,
  };

  return { roomId, player: hostPlayer };
}

function joinRoom(roomId, socketId, playerName) {
  const room = rooms[roomId.toUpperCase()];
  if (!room) {
    return { error: 'La partida no existe.' };
  }
  if (room.state !== 'Lobby') {
    return { error: 'La partida ya ha comenzado.' };
  }
  
  if (room.players.length >= 8) {
      return { error: 'La sala está llena (máximo 8 jugadores).' };
  }

  const newPlayer = {
    id: socketId,
    name: playerName,
    role: null,
    hasVoted: false,
    votesReceived: 0,
  };

  room.players.push(newPlayer);
  return { player: newPlayer };
}

function leaveRoom(socketId) {
  const roomsAffected = [];
  for (const roomId in rooms) {
    const room = rooms[roomId];
    const pIndex = room.players.findIndex(p => p.id === socketId);
    if (pIndex !== -1) {
      room.players.splice(pIndex, 1);
      roomsAffected.push(roomId);
      
      // If room is empty, delete it
      if (room.players.length === 0) {
        delete rooms[roomId];
      } else if (room.host === socketId) {
        // Assign new host
        room.host = room.players[0].id;
      }
    }
  }
  return roomsAffected;
}

function startGame(roomId, categoryName) {
  const room = rooms[roomId];
  if (!room) return { error: 'Room not found' };
  if (room.players.length < 3) return { error: 'Mínimo 3 jugadores' };

  const cats = Object.keys(WORDS);
  const selectedCategory = categoryName && WORDS[categoryName] ? categoryName : cats[Math.floor(Math.random() * cats.length)];
  const wordList = WORDS[selectedCategory];
  const secretWord = wordList[Math.floor(Math.random() * wordList.length)];

  room.category = selectedCategory;
  room.secretWord = secretWord;
  room.state = 'Playing';

  // Reset votes
  room.players.forEach(p => {
    p.hasVoted = false;
    p.votesReceived = 0;
    p.role = 'crew';
  });

  // Assign impostor
  const impostorIndex = Math.floor(Math.random() * room.players.length);
  room.players[impostorIndex].role = 'impostor';
  room.impostorId = room.players[impostorIndex].id;

  return { success: true };
}

function registerVote(roomId, socketId, targetId) {
  const room = rooms[roomId];
  if (!room) return null;
  
  const voter = room.players.find(p => p.id === socketId);
  const target = room.players.find(p => p.id === targetId);
  
  if (!voter || !target || voter.hasVoted) return null;

  voter.hasVoted = true;
  target.votesReceived += 1;
  
  // Transition to Voting if not already (safeguard)
  if(room.state !== 'Voting') {
      room.state = 'Voting';
  }

  const allVoted = room.players.every(p => p.hasVoted);
  if (allVoted) {
    room.state = 'Results';
    return { votingFinished: true };
  }

  return { votingFinished: false };
}

function getRoomState(roomId) {
  const room = rooms[roomId];
  if (!room) return null;

  // We should not send the secretWord and impostorId to everyone unless it's Results phase.
  // Actually, wait, the client needs to know its own role.
  // To keep it clean, we'll send the full state and let the client filter in the frontend based on its socket.id.
  // In a super secure app, we'd emit individual states to each socket. For this fun project with friends, sending full state is easier to debug and manage.
  return room;
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  registerVote,
  getRoomState,
  WORDS
};
