import React from 'react';
import { Map } from './components/Map';
import { BalloonList } from './components/BalloonList';
import { Navigation } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
          <Navigation className="w-8 h-8 text-green-400" />
          Weather Balloon Tracker
          <span className="text-sm bg-green-500 text-white px-3 py-1 rounded-full ml-4">
            Live Tracking
          </span>
        </h1>
        <div className="grid grid-cols-4 gap-4 h-[calc(100vh-8rem)]">
          <div className="col-span-1">
            <BalloonList />
          </div>
          <div className="col-span-3 bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
            <Map />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;