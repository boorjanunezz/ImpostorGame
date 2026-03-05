import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Home from './components/Home';
import Lobby from './components/Lobby';
import GamePhase from './components/GamePhase';
import VotingPhase from './components/VotingPhase';
import ResultsPhase from './components/ResultsPhase';
import './index.css';

// For production on Vercel, we connect to the live Render.com backend.
// Note: Render free tier sleeps after 15 mins of inactivity.
const isLocal = window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168');
const backendUrl = isLocal ? `http://${window.location.hostname}:3001` : 'https://impostor-backend-72jv.onrender.com';
const socket = io(backendUrl);

function App() {
  const [roomState, setRoomState] = useState(null);
  const [socketId, setSocketId] = useState(null);
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    socket.on('connect', () => {
      setSocketId(socket.id);
    });

    socket.on('roomUpdated', (state) => {
      setRoomState(state);
    });

    socket.on('gameStarted', (state) => {
      setRoomState(state);
    });

    socket.on('gameEnded', (state) => {
      setRoomState(state);
    });

    return () => {
      socket.off('connect');
      socket.off('roomUpdated');
      socket.off('gameStarted');
      socket.off('gameEnded');
    };
  }, []);

  // Determine current screen
  if (!roomState) {
    return (
      <Home 
        socket={socket} 
        setPlayerName={setPlayerName} 
        playerName={playerName} 
      />
    );
  }

  if (roomState.state === 'Lobby') {
    return (
      <Lobby 
        socket={socket} 
        roomState={roomState} 
        socketId={socketId} 
        playerName={playerName} 
      />
    );
  }

  if (roomState.state === 'Playing') {
    return (
      <GamePhase 
        socket={socket} 
        roomState={roomState} 
        socketId={socketId} 
      />
    );
  }

  if (roomState.state === 'Voting') {
    return (
      <VotingPhase 
        socket={socket} 
        roomState={roomState} 
        socketId={socketId} 
      />
    );
  }

  if (roomState.state === 'Results') {
    return (
      <ResultsPhase 
        socket={socket} 
        roomState={roomState} 
        socketId={socketId} 
      />
    );
  }

  return <div className="app-container">Cargando estado...</div>;
}

export default App;
