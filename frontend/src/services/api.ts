import { Tournament, Player } from '@/types/tournament';

const API_BASE_URL = '/api';
const MOCK_MODE = process.env.NODE_ENV === 'development';

class TournamentAPI {
  async getTournament(id: string): Promise<Tournament> {
    if (MOCK_MODE) {
      // Return mock data during development
      return {
        id,
        status: 'waiting',
        players: [],
        matches: [],
        bracket: [],
        createdAt: new Date()
      };
    }

    const response = await fetch(`${API_BASE_URL}/tournaments/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tournament: ${response.statusText}`);
    }
    return response.json();
  }

  async joinTournament(tournamentId: string, alias: string) {
    const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ alias }),
    });

    if (!response.ok) {
      throw new Error(`Failed to join tournament: ${response.statusText}`);
    }
    
    return response.json();
  }

  async startTournament(tournamentId: string) {
    const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/start`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to start tournament: ${response.statusText}`);
    }
    
    return response.json();
  }
}

export const tournamentApi = new TournamentAPI();