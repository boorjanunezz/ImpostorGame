import { useState, useEffect } from 'react';

export default function GamePhase({ socket, roomState, socketId }) {
  const [isRevealed, setIsRevealed] = useState(false);
  const me = roomState.players.find(p => p.id === socketId);
  const isImpostor = me.role === 'impostor';

  const handleHoldStart = () => setIsRevealed(true);
  const handleHoldEnd = () => setIsRevealed(false);

  // Allow proceeding to voting
  const handleGoToVoting = () => {
    // In a real app, anyone could perhaps trigger voting phase, or just host.
    // For simplicity, let's let anyone trigger voting phase when ready,
    // or we'd just need a "vote" screen action. We'll emit 'goToVoting' but we didn't add it in backend yet.
    // Let's implement a quick workaround: since any vote transitions to voting phase in backend, we can just show "Vote Player" button that switches local view, or emit a goToVoting event.
    
    // Instead of adding more backend events now, let's render a "Votar al Impostor" button directly that switches local state if we had one, OR we could just send a dummy vote? 
    // Actually, we can just show a button that anyone can click, and we emit a custom event. But wait, I didn't add that to backend.
    // Let's just show the players and let them vote immediately if they want, but the design asked for a game phase then voting.
    // I will add a local state override.
  };

  const [readyToVote, setReadyToVote] = useState(false);

  // If someone already started voting (voted someone), the backend state would be 'Voting', but wait, the backend transitions only AFTER the first vote. That's fine.
  
  if (readyToVote) {
    return (
      <div className="glass-panel" style={{ margin: 'auto', width: '100%', maxWidth: '400px' }}>
        <h2>¿Quién es el impostor?</h2>
        <p style={{ marginBottom: '20px' }}>Vota por quien crees que miente.</p>
        <div className="player-list">
          {roomState.players.map(p => {
             if (p.id === socketId && !p.hasVoted) return null; // Can't vote yourself normally, but let's allow it or hide it
             return (
               <button 
                 key={p.id} 
                 className={`player-item ${me.hasVoted ? 'btn-disabled' : 'pulse'}`} 
                 onClick={() => {
                   if(!me.hasVoted) {
                     socket.emit('vote', { roomId: roomState.id, targetId: p.id });
                   }
                 }}
                 style={{ width: '100%', cursor: me.hasVoted ? 'default' : 'pointer', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
               >
                 <span>{p.name} {p.id === socketId ? '(Tú)' : ''}</span>
                 {p.hasVoted && <span style={{fontSize: '0.8rem', color: 'var(--success-color)'}}>✔ Votó</span>}
               </button>
             );
          })}
        </div>
        {me.hasVoted && <p style={{ marginTop: '20px', color: 'var(--crew-color)' }}>Esperando al resto...</p>}
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ margin: 'auto', width: '100%', maxWidth: '400px' }}>
      <h2>Ronda Actual</h2>
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
    </div>
  );
}
