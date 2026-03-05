// Since VotingPhase can be effectively handled inside GamePhase or seamlessly transitioned,
// let's create a dedicated VotingPhase just in case someone else triggers it first.
export default function VotingPhase({ socket, roomState, socketId }) {
  const me = roomState.players.find(p => p.id === socketId);

  const handleVote = (targetId) => {
    if (!me.hasVoted) {
      socket.emit('vote', { roomId: roomState.id, targetId });
    }
  };

  return (
    <div className="glass-panel" style={{ margin: 'auto', width: '100%', maxWidth: '400px' }}>
      <h2>¡Tiempo de votar!</h2>
      <p style={{ marginBottom: '20px' }}>¿Quién es el impostor?</p>

      <div className="player-list">
        {roomState.players.map(p => (
          <button 
            key={p.id} 
            className={`player-item ${me.hasVoted ? 'btn-disabled' : 'pulse'}`} 
            onClick={() => handleVote(p.id)}
            disabled={me.hasVoted}
            style={{ 
              width: '100%', 
              cursor: me.hasVoted ? 'default' : 'pointer', 
              background: 'rgba(255,255,255,0.05)', 
              color: 'white', 
              border: '1px solid rgba(255,255,255,0.2)',
              marginBottom: '10px'
            }}
          >
            <span>{p.name} {p.id === socketId ? '(Tú)' : ''}</span>
            {p.hasVoted && <span style={{fontSize: '0.8rem', color: 'var(--success-color)'}}>✔ Votó</span>}
          </button>
        ))}
      </div>

      {me.hasVoted && (
        <p style={{ marginTop: '20px', color: 'var(--crew-color)' }}>Esperando a los demás jugadores...</p>
      )}
    </div>
  );
}
