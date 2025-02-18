import { create } from 'zustand';
import { Balloon, Trajectory } from './types';

interface BalloonStore {
  balloons: Balloon[];
  selectedBalloonId: string | null;
  trajectories: Record<string, Trajectory>;
  setSelectedBalloon: (id: string | null) => void;
  addBalloon: (balloon: Balloon) => void;
  updateTrajectory: (balloonId: string, trajectory: Trajectory) => void;
  popBalloon: (id: string) => void;
  animatingBalloonId: string | null;
  setAnimatingBalloonId: (id: string | null) => void;
}

// Enhanced mock data with more balloons
const mockBalloons: Balloon[] = [
  {
    id: '1',
    name: 'NOAA-A1',
    latitude: 40.7128,
    longitude: -74.0060,
    altitude: 30000,
    speed: 25,
    direction: 45,
    timestamp: new Date(),
  },
  {
    id: '2',
    name: 'NOAA-B2',
    latitude: 34.0522,
    longitude: -118.2437,
    altitude: 25000,
    speed: 30,
    direction: 90,
    timestamp: new Date(),
  },
  {
    id: '3',
    name: 'Weather-X1',
    latitude: 41.8781,
    longitude: -87.6298,
    altitude: 28000,
    speed: 35,
    direction: 180,
    timestamp: new Date(),
  },
  {
    id: '4',
    name: 'Atmos-P3',
    latitude: 29.7604,
    longitude: -95.3698,
    altitude: 32000,
    speed: 40,
    direction: 270,
    timestamp: new Date(),
  },
  {
    id: '5',
    name: 'Strato-Z9',
    latitude: 39.7392,
    longitude: -104.9903,
    altitude: 35000,
    speed: 28,
    direction: 135,
    timestamp: new Date(),
  },
  {
    id: '6',
    name: 'High-Alt-M5',
    latitude: 47.6062,
    longitude: -122.3321,
    altitude: 40000,
    speed: 32,
    direction: 225,
    timestamp: new Date(),
  }
];

export const useBalloonStore = create<BalloonStore>((set) => ({
  balloons: mockBalloons,
  selectedBalloonId: null,
  trajectories: {},
  animatingBalloonId: null,
  setSelectedBalloon: (id) => set({ selectedBalloonId: id }),
  addBalloon: (balloon) => 
    set((state) => ({ balloons: [...state.balloons, balloon] })),
  updateTrajectory: (balloonId, trajectory) =>
    set((state) => ({
      trajectories: { ...state.trajectories, [balloonId]: trajectory }
    })),
  popBalloon: (id) => set({ animatingBalloonId: id }),
  setAnimatingBalloonId: (id) => set({ animatingBalloonId: id }),
}));