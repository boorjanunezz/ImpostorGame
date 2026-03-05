import { useState } from 'react';

export default function Home({ socket, setPlayerName, playerName }) {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [mode, setMode] = useState('menu'); // 'menu', 'create', 'join'

  const handleCreate = () => {
    if (!playerName.trim()) {
      setErrorMsg('Nombre requerido');
      return;
    }
    socket.emit('createRoom', { hostName: playerName }, (response) => {
        // App.jsx will handle state changes based on 'roomUpdated'
    });
  };

  const handleJoin = () => {
    if (!playerName.trim() || !roomIdInput.trim()) {
      setErrorMsg('Nombre y Código requeridos');
      return;
    }
    socket.emit('joinRoom', { roomId: roomIdInput.toUpperCase(), playerName }, (response) => {
      if (response.error) {
        setErrorMsg(response.error);
      }
    });
  };

  return (
    <div className="glass-panel" style={{ margin: 'auto' }}>
      <h1>El Impostor</h1>
      <p style={{ marginBottom: '30px' }}>Encuentra al impostor entre tus amigos</p>

      {mode === 'menu' && (
        <div className="input-group">
          <button className="btn-primary" onClick={() => setMode('create')}>Crear Partida (Host)</button>
          <button className="btn-secondary" onClick={() => setMode('join')}>Unirse a Partida</button>
        </div>
      )}

      {mode === 'create' && (
        <div className="input-group">
          <input 
            type="text" 
            placeholder="Tu Alias (Ej: Borja)" 
            value={playerName} 
            onChange={e => setPlayerName(e.target.value)} 
            maxLength={12}
          />
          {errorMsg && <p style={{ color: 'var(--accent-color)' }}>{errorMsg}</p>}
          <button className="btn-primary pulse" onClick={handleCreate}>Crear Sala</button>
          <button className="btn-secondary" onClick={() => { setMode('menu'); setErrorMsg(''); }}>Atrás</button>
        </div>
      )}

      {mode === 'join' && (
        <div className="input-group">
          <input 
            type="text" 
            placeholder="Tu Alias" 
            value={playerName} 
            onChange={e => setPlayerName(e.target.value)} 
            maxLength={12}
          />
          <input 
            type="text" 
            placeholder="Código de Sala (Ej: A4B2)" 
            value={roomIdInput} 
            onChange={e => setRoomIdInput(e.target.value.toUpperCase())} 
            maxLength={4}
            style={{ textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'center', fontWeight: 'bold' }}
          />
          {errorMsg && <p style={{ color: 'var(--accent-color)' }}>{errorMsg}</p>}
          <button className="btn-primary pulse" onClick={handleJoin}>Entrar</button>
          <button className="btn-secondary" onClick={() => { setMode('menu'); setErrorMsg(''); }}>Atrás</button>
        </div>
      )}
    </div>
  );
}
