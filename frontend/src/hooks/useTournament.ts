import { useState, useEffect } from 'react';
import { Tournament, Player } from '@/types/tournament';
import { tournamentApi } from '@/services/api';
import { useWebSocket } from '@/hooks/useWebSocket';

export function useTournament(tournamentId: string) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WebSocket for real-time updates
  const { sendMessage, lastMessage } = useWebSocket(
    `ws://localhost/ws/tournament/${tournamentId}`
  );

  useEffect(() => {
    loadTournament();
  }, [tournamentId]);

  useEffect(() => {
    if (lastMessage) {
      handleWebSocketMessage(lastMessage);
    }
  }, [lastMessage]);

  async function loadTournament() {
    try {
      setLoading(true);
      const data = await tournamentApi.getTournament(tournamentId);
      setTournament(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tournament');
    } finally {
      setLoading(false);
    }
  }

  async function joinTournament(alias: string): Promise<boolean> {
    try {
      const result = await tournamentApi.joinTournament(tournamentId, alias);
      if (result.success) {
        // Tournament will be updated via WebSocket
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join tournament');
      return false;
    }
  }

  function handleWebSocketMessage(message: any) {
    const data = JSON.parse(message.data);
    
    switch (data.type) {
      case 'player_joined':
        setTournament(prev => prev ? {
          ...prev,
          players: [...prev.players, data.player]
        } : null);
        break;
      
      case 'tournament_started':
        setTournament(prev => prev ? {
          ...prev,
          status: 'active',
          bracket: data.bracket
        } : null);
        break;
      
      case 'match_completed':
        setTournament(prev => prev ? {
          ...prev,
          matches: prev.matches.map(match => 
            match.id === data.matchId ? { ...match, ...data.matchResult } : match
          )
        } : null);
        break;
    }
  }

  return {
    tournament,
    loading,
    error,
    joinTournament,
    refreshTournament: loadTournament
  };
}