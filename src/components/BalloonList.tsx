import React from 'react';
import { useBalloonStore } from '../store';
import { Navigation, Wind, Ruler, ArrowDown, Bomb } from 'lucide-react';

export function BalloonList() {
  const { balloons, selectedBalloonId, setSelectedBalloon, popBalloon } = useBalloonStore();

  return (
    <div className="bg-gray-900 rounded-lg shadow-xl p-4 max-h-[calc(100vh-2rem)] overflow-y-auto text-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-green-400 flex items-center gap-2">
        <Navigation className="w-6 h-6" />
        Weather Balloons
      </h2>
      <div className="space-y-3">
        {balloons.map((balloon) => (
          <div
            key={balloon.id}
            className={`w-full p-4 rounded-lg ${
              selectedBalloonId === balloon.id
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-gray-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setSelectedBalloon(balloon.id)}
                className="flex items-center space-x-2"
              >
                <Navigation className="w-5 h-5" />
                <span className="font-medium text-lg">{balloon.name}</span>
              </button>
              <button
                onClick={() => popBalloon(balloon.id)}
                className="p-2 hover:bg-red-500 rounded-full transition-colors duration-200"
                title="Pop Balloon"
              >
                <Bomb className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-blue-400" />
                <span>{balloon.altitude.toLocaleString()}ft</span>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-yellow-400" />
                <span>{balloon.speed}mph</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowDown className="w-4 h-4 text-red-400" 
                  style={{ transform: `rotate(${balloon.direction}deg)` }}/>
                <span>{balloon.direction}°</span>
              </div>
              <div className="text-gray-400">
                ID: {balloon.id}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}