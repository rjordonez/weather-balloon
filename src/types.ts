export interface Balloon {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  direction: number;
  timestamp: Date;
}

export interface Trajectory {
  points: google.maps.LatLngLiteral[];
  landingPoint: google.maps.LatLngLiteral;
  estimatedLandingTime: Date;
}