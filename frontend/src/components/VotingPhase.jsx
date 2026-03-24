import Chat from './Chat';

// Since VotingPhase can be effectively handled inside GamePhase or seamlessly transitioned,
// let's create a dedicated VotingPhase just in case someone else triggers it first.
export default function VotingPhase({ socket, roomState, socketId }) {
  const me = roomState.players.find(p => p.id === socketId);
  const isHost = roomState.host === socketId;

  const handleVote = (targetId) => {
    socket.emit('vote', { roomId: roomState.id, targetId });
  };

  const handleEndVoting = () => {
    socket.emit('endVoting', { roomId: roomState.id });
  };

  const totalVoted = roomState.players.filter(p => p.hasVoted).length;

  return (
    <div className="glass-panel" style={{ margin: 'auto', width: '100%', maxWidth: '400px' }}>
      <h2>¡Tiempo de votar!</h2>
      {roomState.timer !== null && (
        <div className="timer-badge">
          ⏱️ {Math.floor(roomState.timer / 60)}:{(roomState.timer % 60).toString().padStart(2, '0')}
        </div>
      )}
      <p style={{ marginBottom: '20px' }}>¿Quién es el impostor? El voto es único y no se puede cambiar.</p>

      <div className="player-list">
        {roomState.players.map(p => {
          const isMySelectedTarget = me.votedFor === p.id;
          return (
            <button 
              key={p.id} 
              className={`player-item ${me.hasVoted ? '' : 'pulse'}`} 
              disabled={me.hasVoted}
              onClick={() => handleVote(p.id)}
              style={{ 
                width: '100%', 
                cursor: me.hasVoted ? 'default' : 'pointer',
                background: isMySelectedTarget ? 'rgba(255, 102, 102, 0.2)' : 'rgba(255,255,255,0.05)', 
                color: 'white', 
                border: isMySelectedTarget ? '2px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.2)',
                marginBottom: '10px',
                transition: 'all 0.3s',
                opacity: me.hasVoted && !isMySelectedTarget ? 0.6 : 1
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span>{p.name} {p.id === socketId ? '(Tú)' : ''}</span>
                <div style={{ display: 'flex', gap: '5px' }}>
                    {isMySelectedTarget && <span>🎯</span>}
                    {p.hasVoted && <span style={{fontSize: '0.8rem', color: 'var(--success-color)'}}>✔</span>}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <p style={{ marginTop: '20px', color: 'var(--crew-color)' }}>
        Han votado {totalVoted} / {roomState.players.length}
      </p>

      {isHost && (
        <button 
          className={`btn-primary ${totalVoted < roomState.players.length ? 'btn-disabled' : 'pulse'}`} 
          style={{ marginTop: '20px' }} 
          onClick={handleEndVoting}
          disabled={totalVoted < roomState.players.length}
        >
          {totalVoted < roomState.players.length ? 'Esperando votos...' : 'Cerrar Votación'}
        </button>
      )}

      <Chat socket={socket} roomId={roomState.id} messages={roomState.messages} />
    </div>
  );
}
