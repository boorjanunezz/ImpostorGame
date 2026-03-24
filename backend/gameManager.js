// gameManager.js

// Categories and Words
const WORDS = {
  Objetos: ['Tenedor', 'Cuchara', 'Silla', 'Mesa', 'Reloj', 'Gafas', 'Espejo', 'Llave', 'Teléfono', 'Cartera', 'Bolígrafo', 'Botella', 'Cargador', 'Auriculares', 'Vaper'],
  Animales: ['Perro', 'Gato', 'Elefante', 'León', 'Tigre', 'Cebra', 'Jirafa', 'Mono', 'Oso', 'Lobo', 'Delfín', 'Pingüino', 'Capibara', 'Mapache'],
  Comida: ['Pizza', 'Hamburguesa', 'Sushi', 'Taco', 'Pasta', 'Ensalada', 'Sopa', 'Queso', 'Pan', 'Huevo', 'Manzana', 'Kebab', 'Shawarma', 'Burrito'],
  Profesiones: ['Médico', 'Abogado', 'Profesor', 'Ingeniero', 'Bombero', 'Policía', 'Pintor', 'Músico', 'Cocinero', 'Actor', 'Piloto', 'Carpintero', 'Influencer', 'Streamer', 'Tiktoker', 'Cajero', 'Camello'],
  Peliculas: ['Titanic', 'Avatar', 'Matrix', 'Inception', 'Star Wars', 'Jurassic Park', 'El Padrino', 'Gladiator', 'Rocky', 'Jaws', 'Alien', 'Terminator', 'Spiderman', 'Shrek'],
  GeneracionZ: ['Tinder', 'TikTok', 'Instagram', 'Ghosting', 'Red Flag', 'Cringe', 'Stalkear', 'Meme', 'Hater', 'Outfit', 'Crush', 'Beef', 'Flow', 'Shippear', 'NPC', 'POV'],
  HumorNegro: ['Funeral', 'Divorcio', 'Ataúd', 'Orfanato', 'Cementerio', 'Impuestos', 'Suicidio', 'Morgue', 'Calvicie', 'Infidelidad', 'Bancarrota', 'Inyección', 'Depresión', 'Hemorroides'],
  Fiesta: ['Discoteca', 'Resaca', 'Chupito', 'Garrafón', 'Vómito', 'Cubata', 'Portero', 'After', 'Borracho', 'Cerveza', 'Rave', 'Botellón', 'VIP', 'Puta Vuelta'],
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
    impostorIds: [],
    timer: null,
    timerActive: false,
    messages: [], // Array of { sender: string, text: string, timestamp: string }
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
    votedFor: null,
    votesReceived: 0,
  };

  room.players.push(newPlayer);
  
  // Add system message
  addChatMessage(roomId, 'Sistema', `${playerName} se ha unido.`);

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

      // Add system message if not empty
      if (room.players.length > 0) {
        addChatMessage(roomId, 'Sistema', `Alguien se ha ido.`);
      }
    }
  }
  return roomsAffected;
}

function startGame(roomId, categoryName, impostorCount = 1) {
  const room = rooms[roomId];
  if (!room) return { error: 'Room not found' };
  if (room.players.length < 3) return { error: 'Mínimo 3 jugadores' };
  
  // Cap impostor count to players / half roughly
  let actualImpostors = parseInt(impostorCount) || 1;
  const maxImpostors = Math.max(1, Math.floor(room.players.length / 2) - 1) || 1;
  if (actualImpostors > maxImpostors) actualImpostors = maxImpostors;

  const cats = Object.keys(WORDS);
  const selectedCategory = categoryName && WORDS[categoryName] ? categoryName : cats[Math.floor(Math.random() * cats.length)];
  const wordList = WORDS[selectedCategory];
  const secretWord = wordList[Math.floor(Math.random() * wordList.length)];

  room.category = selectedCategory;
  room.secretWord = secretWord;
  room.state = 'Playing';
  room.impostorIds = [];

  // Reset votes and roles
  room.players.forEach(p => {
    p.hasVoted = false;
    p.votedFor = null;
    p.votesReceived = 0;
    p.role = 'crew';
  });

  // Assign impostors randomly
  const availableIndices = Array.from({length: room.players.length}, (_, i) => i);
  for (let i = 0; i < actualImpostors; i++) {
    const randomPick = Math.floor(Math.random() * availableIndices.length);
    const chosenIndex = availableIndices.splice(randomPick, 1)[0];
    room.players[chosenIndex].role = 'impostor';
    room.impostorIds.push(room.players[chosenIndex].id);
  }

  // Set a default timer for Playing phase
  room.timer = 120; // 2 minutes to talk
  room.timerActive = true;

  return { success: true };
}

function registerVote(roomId, socketId, targetId) {
  const room = rooms[roomId];
  if (!room) return null;
  
  const voter = room.players.find(p => p.id === socketId);
  const target = room.players.find(p => p.id === targetId);
  
  if (!voter || !target) return null;

  // Prevent voting more than once if already voted
  if (voter.hasVoted) return null;

  voter.hasVoted = true;
  voter.votedFor = targetId;
  target.votesReceived += 1;
  
  if(room.state !== 'Voting') {
      room.state = 'Voting';
      room.timer = 60; // 1 minute to vote
      room.timerActive = true;
  }

  return { votingFinished: false };
}

function endVotingPhase(roomId) {
  const room = rooms[roomId];
  if (!room) return null;

  // Check if everyone has voted
  const everyoneVoted = room.players.every(p => p.hasVoted);
  if (!everyoneVoted) {
    return { error: 'Todavía faltan jugadores por votar.' };
  }

  room.state = 'Results';
  room.timer = null;
  room.timerActive = false;
  return { success: true };
}

function resetRoom(roomId) {
  const room = rooms[roomId];
  if (!room) return null;

  room.state = 'Lobby';
  room.secretWord = null;
  room.category = null;
  room.impostorIds = [];
  room.timer = null;
  room.timerActive = false;
  room.messages = [];

  room.players.forEach(p => {
    p.role = null;
    p.hasVoted = false;
    p.votedFor = null;
    p.votesReceived = 0;
  });

  return { success: true };
}

function getRoomStateForPlayer(roomId, socketId) {
  const room = rooms[roomId];
  if (!room) return null;

  // Deep copy to avoid mutating the original room state
  const state = JSON.parse(JSON.stringify(room));

  const me = room.players.find(p => p.id === socketId);
  const isImpostor = me && me.role === 'impostor';

  // Security: only reveal roles and secret word if the game is over (Results)
  if (room.state !== 'Results') {
    // Hide secretWord if not crew
    if (isImpostor) {
        state.secretWord = '???';
    } else if (room.state !== 'Playing') {
        state.secretWord = null;
    }
    
    // Hide ROLES of other players
    state.players.forEach(p => {
        if (p.id !== socketId) {
            p.role = null;
        }
    });

    // Hide all impostorIds
    state.impostorIds = [];
  }

  return state;
}

function tickRooms() {
  const affectedRooms = [];
  for (const roomId in rooms) {
    const room = rooms[roomId];
    if (room.timerActive && room.timer !== null) {
      room.timer--;
      affectedRooms.push(roomId);

      if (room.timer <= 0) {
        room.timerActive = false;
        room.timer = 0;
        // Auto-transition to Voting if Playing, or to Results if Voting
        if (room.state === 'Playing') {
          room.state = 'Voting';
          room.timer = 60;
          room.timerActive = true;
        } else if (room.state === 'Voting') {
          room.state = 'Results';
          room.timer = null;
          room.timerActive = false;
        }
      }
    }
  }
  return affectedRooms;
}

function addChatMessage(roomId, senderName, text) {
  const room = rooms[roomId];
  if (!room) return;

  room.messages.push({
    sender: senderName,
    text: text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type: senderName === 'Sistema' ? 'system' : 'chat'
  });

  // Keep only the last 50 messages
  if (room.messages.length > 50) room.messages.shift();
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  registerVote,
  endVotingPhase,
  resetRoom,
  getRoomStateForPlayer,
  getRoomState: (id) => rooms[id], 
  tickRooms,
  addChatMessage,
  WORDS
};
