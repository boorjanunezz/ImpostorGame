export default function Lobby({ socket, roomState, socketId, playerName }) {
  const isHost = roomState.host === socketId;

  const handleStartGame = () => {
    socket.emit('startGame', { roomId: roomState.id, category: null }); // null category means random
  };

  return (
    <div className="glass-panel" style={{ margin: 'auto', width: '100%' }}>
      <h2>Sala Pública</h2>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <p>Código de la sala:</p>
        <h1 style={{ letterSpacing: '5px', color: 'var(--crew-color)' }}>{roomState.id}</h1>
      </div>

      <p>{roomState.players.length} / 8 Jugadores</p>
      
      <div className="player-list">
        {roomState.players.map((p) => (
          <div 
            key={p.id} 
            className={`player-item ${p.id === roomState.host ? 'host' : ''} ${p.id === socketId ? 'me' : ''}`}
          >
            <span style={{ fontWeight: '600' }}>{p.name} {p.id === socketId && '(Tú)'}</span>
            {p.id === roomState.host && <span style={{ fontSize: '0.8rem', color: 'gold' }}>★ Host</span>}
          </div>
        ))}
      </div>

      {isHost ? (
        <button 
          className={`btn-primary ${roomState.players.length < 3 ? 'btn-disabled' : 'pulse'}`} 
          onClick={handleStartGame}
          disabled={roomState.players.length < 3}
        >
          {roomState.players.length < 3 ? 'Faltan jugadores (Mín. 3)' : 'Comenzar Juego'}
        </button>
      ) : (
        <p style={{ marginTop: '20px' }}>Esperando a que el host inicie...</p>
      )}
    </div>
  );
}
