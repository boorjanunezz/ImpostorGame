import { useEffect, useState } from 'react';

export default function ResultsPhase({ socket, roomState, socketId }) {
  const [showImpostor, setShowImpostor] = useState(false);
  const isHost = roomState.host === socketId;

  // Find the player with most votes
  const maxVotes = Math.max(...roomState.players.map(p => p.votesReceived));
  const votedOut = roomState.players.filter(p => p.votesReceived === maxVotes);
  
  const impostorIds = roomState.impostorIds || [];
  const impostors = roomState.players.filter(p => impostorIds.includes(p.id));
  
  // Did crew win? If ANY impostor survived, the impostors win (or adjust rules if preferred, but usually all must die or it's a loss. Let's say crew wins only if ALL impostors are voted out. Since they only have 1 vote session, multiple impostors win if they don't get voted out).
  // Actually, standard game: one vote phase. If you catch an impostor, good. If multiple, perhaps they win if they catch ALL? Or if they catch ANY? Let's go with "Catching ANY impostor is a win for the crew" to keep it fun and easy for now.
  const impostorsVotedOut = votedOut.filter(p => impostorIds.includes(p.id));
  const crewWon = impostorsVotedOut.length > 0;

  useEffect(() => {
    // Dramatic reveal delay
    const timer = setTimeout(() => {
      setShowImpostor(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handlePlayAgain = () => {
    socket.emit('returnToLobby', { roomId: roomState.id });
  };

  if (!showImpostor) {
    return (
      <div className="glass-panel" style={{ margin: 'auto', textAlign: 'center' }}>
        <h2 className="pulse" style={{ color: 'var(--accent-color)' }}>Procesando votos...</h2>
        <p>¿A quién habéis echado?</p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ margin: 'auto', textAlign: 'center', maxWidth: '450px' }}>
      {votedOut.length > 1 ? (
        <h2>Hubo un empate de votos.</h2>
      ) : (
        <h2>Habéis expulsado a <span style={{color: 'var(--accent-color)'}}>{votedOut[0]?.name || 'Nadie'}</span></h2>
      )}

      <div style={{ margin: '30px 0', padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '15px' }}>
        <h3 style={{ marginBottom: '10px' }}>
          {crewWon ? '¡LOS TRIPULANTES GANAN!' : '¡LOS IMPOSTORES GANAN!'}
        </h3>
        {crewWon ? (
          <p style={{ color: 'var(--success-color)', fontSize: '1.2rem', fontWeight: 'bold' }}>
            ¡Habéis pillado a {impostorsVotedOut.length > 1 ? 'los impostores' : 'un impostor'}!
          </p>
        ) : (
          <p style={{ color: 'var(--impostor-color)', fontSize: '1.2rem', fontWeight: 'bold' }}>Los impostores sobrevivieron...</p>
        )}
      </div>

      <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}>
        {impostors.length > 1 ? 'Los impostores eran:' : 'El impostor era:'} <br/>
        <span style={{ fontWeight: 'bold', color: 'var(--impostor-color)', fontSize: '1.5rem' }}>
          {impostors.map(i => i.name).join(', ')}
        </span>
      </p>
      
      <p style={{ fontSize: '1.1rem', marginBottom: '30px' }}>
        La palabra secreta era: <br/>
        <span style={{ fontWeight: 'bold', color: 'var(--crew-color)', fontSize: '1.5rem' }}>{roomState.secretWord}</span>
      </p>

      {isHost ? (
        <button className="btn-primary pulse" onClick={handlePlayAgain}>Volver a la Sala</button>
      ) : (
        <p style={{ opacity: 0.7 }}>Esperando a que el Host reinicie la sala...</p>
      )}
    </div>
  );
}
