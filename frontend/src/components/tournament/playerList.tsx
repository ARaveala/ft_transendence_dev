import React from 'react';
import { Player } from '@/types/tournament';

interface PlayerListProps {
  players: Player[];
  currentUserId?: string;
}

export function PlayerList({ players, currentUserId }: PlayerListProps) {
  return (
    <div className="space-y-3">
      {players.map((player) => (
        <div
          key={player.id}
          className={`
            flex items-center justify-between p-3 rounded-lg transition-all
            ${player.id === currentUserId 
              ? 'bg-blue-900/30 border border-blue-500/30' 
              : 'bg-gray-800/50'
            }
          `}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-sm">
              {player.alias.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-white">{player.alias}</span>
            {player.id === currentUserId && (
              <span className="text-xs bg-blue-500 px-2 py-1 rounded text-white">You</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              player.status === 'ready' ? 'bg-green-400' : 
              player.status === 'playing' ? 'bg-yellow-400' : 'bg-gray-400'
            }`} />
            <span className={`text-sm capitalize ${
              player.status === 'ready' ? 'text-green-400' : 
              player.status === 'playing' ? 'text-yellow-400' : 'text-gray-400'
            }`}>
              {player.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}