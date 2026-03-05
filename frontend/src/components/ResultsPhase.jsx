import { useEffect, useState } from 'react';

export default function ResultsPhase({ socket, roomState, socketId }) {
  const [showImpostor, setShowImpostor] = useState(false);
  const isHost = roomState.host === socketId;

  // Find the player with most votes
  const maxVotes = Math.max(...roomState.players.map(p => p.votesReceived));
  const votedOut = roomState.players.filter(p => p.votesReceived === maxVotes);
  
  const impostor = roomState.players.find(p => p.id === roomState.impostorId);
  const impostorVotedOut = votedOut.some(p => p.id === impostor.id);
  const crewWon = impostorVotedOut;

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
        <h2>Habéis expulsado a <span style={{color: 'var(--accent-color)'}}>{votedOut[0].name}</span></h2>
      )}

      <div style={{ margin: '30px 0', padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '15px' }}>
        <h3 style={{ marginBottom: '10px' }}>
          {crewWon ? '¡LOS TRIPULANTES GANAN!' : '¡EL IMPOSTOR GANA!'}
        </h3>
        {crewWon ? (
          <p style={{ color: 'var(--success-color)', fontSize: '1.2rem', fontWeight: 'bold' }}>¡Descubristeis al impostor!</p>
        ) : (
          <p style={{ color: 'var(--impostor-color)', fontSize: '1.2rem', fontWeight: 'bold' }}>El impostor sobrevivió...</p>
        )}
      </div>

      <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}>
        El impostor era: <span style={{ fontWeight: 'bold', color: 'var(--impostor-color)', fontSize: '1.5rem' }}>{impostor.name}</span>
      </p>
      
      <p style={{ fontSize: '1.1rem', marginBottom: '30px' }}>
        La palabra secreta era: <span style={{ fontWeight: 'bold', color: 'var(--crew-color)', fontSize: '1.5rem' }}>{roomState.secretWord}</span>
      </p>

      {isHost ? (
        <button className="btn-primary pulse" onClick={handlePlayAgain}>Volver a la Sala</button>
      ) : (
        <p style={{ opacity: 0.7 }}>Esperando a que el Host reinicie la sala...</p>
      )}
    </div>
  );
}
