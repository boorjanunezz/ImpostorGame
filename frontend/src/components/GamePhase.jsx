import { useState, useEffect } from 'react';
import Chat from './Chat';

export default function GamePhase({ socket, roomState, socketId }) {
  const [isRevealed, setIsRevealed] = useState(false);
  const me = roomState.players.find(p => p.id === socketId);
  const isImpostor = me.role === 'impostor';

  const handleHoldStart = () => setIsRevealed(true);
  const handleHoldEnd = () => setIsRevealed(false);

  const handleGoToVoting = () => {
    // We already have a transition in App.js when someone votes, but we should probably 
    // emit a specific event so the host can send everyone to the voting phase properly.
    // However, since we added the dedicated VotingPhase component that App.js handles,
    // we can just let people click a button to change their local view.
    setReadyToVote(true);
  };

  const [readyToVote, setReadyToVote] = useState(false);

  // If readyToVote is clicked, we just render the VotingPhase component passing down props
  if (readyToVote) {
    // Import VotingPhase dynamically or assume it's handled by App.jsx
    // Actually, App.jsx switches to VotingPhase when roomState.state === 'Voting'.
    // Better to let the Host click a button that emits an event to transition the room to Voting.
    // For now, to keep it simple without adding a new backend event: 
    // we just let them see the voting UI locally.
    // Wait, let's just use the App.jsx logic. I will render the player list to click.
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
          {roomState.players.map(p => (
            <button 
              key={p.id} 
              className={`player-item ${me.hasVoted ? '' : 'pulse'}`} 
              disabled={me.hasVoted}
              onClick={() => socket.emit('vote', { roomId: roomState.id, targetId: p.id })}
              style={{ width: '100%', cursor: me.hasVoted ? 'default' : 'pointer', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '10px', opacity: me.hasVoted ? 0.5 : 1 }}
            >
              <span>Votar a {p.name} {p.id === socketId ? '(Tú)' : ''}</span>
              {me.votedFor === p.id && <span style={{marginLeft: '10px'}}>🎯</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ margin: 'auto', width: '100%', maxWidth: '400px' }}>
      <h2>Ronda Actual</h2>
      {roomState.timer !== null && (
        <div className="timer-badge">
          ⏱️ {Math.floor(roomState.timer / 60)}:{(roomState.timer % 60).toString().padStart(2, '0')}
        </div>
      )}
      <p>Categoría: <span style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>{roomState.category}</span></p>

      <div 
        className={`card-container ${isRevealed ? 'revealed' : ''}`}
        onMouseDown={handleHoldStart}
        onMouseUp={handleHoldEnd}
        onMouseLeave={handleHoldEnd}
        onTouchStart={handleHoldStart}
        onTouchEnd={handleHoldEnd}
      >
        <div className="card-inner">
          <div className="card-front">
            <p>MANTÉN PULSADO<br />PARA REVELAR TU ROL</p>
          </div>
          <div className={`card-back ${isImpostor ? 'impostor' : ''}`}>
            {isImpostor ? (
              <>
                <p>ERES EL</p>
                <div className="impostor-text">IMPOSTOR</div>
                <p style={{ fontSize: '0.9rem', marginTop: '15px' }}>Engaña a los demás y adivina la palabra secreta.</p>
              </>
            ) : (
              <>
                <p>LA PALABRA ES</p>
                <div className="secret-word">{roomState.secretWord}</div>
                <p style={{ fontSize: '0.9rem', marginTop: '15px' }}>Da una pista sin ser demasiado obvio.</p>
              </>
            )}
          </div>
        </div>
      </div>

      <p style={{ fontSize: '0.8rem', marginTop: '20px', marginBottom: '20px' }}>
        El jugador más joven empieza.<br/>Dile una palabra relacionada al resto.
      </p>

      <button className="btn-secondary" onClick={() => setReadyToVote(true)}>
        Pasar a Votación
      </button>

      <Chat socket={socket} roomId={roomState.id} messages={roomState.messages} />
    </div>
  );
}
