import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useBalloonStore } from '../store';
import { MapPin, Navigation } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyD5lLAFNc7f79MaXpHpXq1R3HBrESJ0IQI';

const mapStyles = [
  {
    "elementType": "geometry",
    "stylers": [{"color": "#1d2c4d"}]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#8ec3b9"}]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{"color": "#1a3646"}]
  },
  {
    "featureType": "administrative.country",
    "elementType": "geometry.stroke",
    "stylers": [{"color": "#4b6878"}]
  },
  {
    "featureType": "administrative.province",
    "elementType": "geometry.stroke",
    "stylers": [{"color": "#4b6878"}]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{"color": "#0e1626"}]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#4e6d70"}]
  }
];

interface AnimationInfo {
  altitude: number;
  distanceTraveled: number;
  timeElapsed: number;
  currentSpeed: number;
}

export function Map() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markers = useRef<Record<string, google.maps.Marker>>({});
  const trajectoryLines = useRef<Record<string, google.maps.Polyline>>({});
  const landingMarkers = useRef<Record<string, google.maps.Marker>>({});
  const streetViewService = useRef<google.maps.StreetViewService | null>(null);
  const panorama = useRef<google.maps.StreetViewPanorama | null>(null);
  const infoWindow = useRef<google.maps.InfoWindow | null>(null);
  
  const [animationInfo, setAnimationInfo] = useState<AnimationInfo | null>(null);
  
  const { 
    balloons, 
    selectedBalloonId, 
    trajectories, 
    animatingBalloonId,
    setAnimatingBalloonId 
  } = useBalloonStore();

  // Calculate mock landing point based on balloon direction and speed
  const calculateLandingPoint = (balloon: any) => {
    const R = 6371e3; // Earth's radius in meters
    const d = balloon.speed * 3600; // Distance traveled in one hour (m)
    const δ = d / R; // Angular distance
    const θ = balloon.direction * Math.PI / 180; // Direction in radians
    const φ1 = balloon.latitude * Math.PI / 180;
    const λ1 = balloon.longitude * Math.PI / 180;
    
    const φ2 = Math.asin(
      Math.sin(φ1) * Math.cos(δ) +
      Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
    );
    
    const λ2 = λ1 + Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
    );
    
    return {
      lat: φ2 * 180 / Math.PI,
      lng: λ2 * 180 / Math.PI
    };
  };

  const findNearestStreetView = async (location: google.maps.LatLngLiteral, radius: number = 50): Promise<google.maps.StreetViewLocation | null> => {
    if (!streetViewService.current) return null;

    try {
      const result = await new Promise<google.maps.StreetViewPanoramaData>((resolve, reject) => {
        streetViewService.current!.getPanorama({
          location,
          radius,
          source: google.maps.StreetViewSource.OUTDOOR
        }, (data, status) => {
          if (status === 'OK') resolve(data);
          else reject(status);
        });
      });
      return result.location!;
    } catch (error) {
      // If no street view found, try with a larger radius
      if (radius < 5000) {
        return findNearestStreetView(location, radius * 2);
      }
      return null;
    }
  };

  // Animation function for popping balloon
  const animateBalloonPop = async (balloon: any) => {
    if (!mapInstance.current) return;

    const startPosition = { lat: balloon.latitude, lng: balloon.longitude };
    const landingPoint = calculateLandingPoint(balloon);
    const steps = 100; // Increased steps for smoother animation
    const duration = 5000; // 5 seconds
    const stepDuration = duration / steps;

    // Calculate total distance
    const totalDistance = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(startPosition),
      new google.maps.LatLng(landingPoint)
    );

    // Create info window if it doesn't exist
    if (!infoWindow.current) {
      infoWindow.current = new google.maps.InfoWindow();
    }

    // Create animation marker
    const animationMarker = new google.maps.Marker({
      position: startPosition,
      map: mapInstance.current,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#ef4444',
        fillOpacity: 0.9,
        strokeWeight: 2,
        strokeColor: '#fff',
      },
    });

    // Follow trajectory animation
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const lat = startPosition.lat + (landingPoint.lat - startPosition.lat) * progress;
      const lng = startPosition.lng + (landingPoint.lng - startPosition.lng) * progress;
      
      // Calculate current metrics
      const currentPosition = { lat, lng };
      const distanceTraveled = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(startPosition),
        new google.maps.LatLng(currentPosition)
      );
      
      const currentAltitude = balloon.altitude * (1 - Math.pow(progress, 0.5));
      const currentSpeed = balloon.speed * (1 - progress * 0.7);
      const timeElapsed = (progress * duration) / 1000;

      // Update animation info
      setAnimationInfo({
        altitude: currentAltitude,
        distanceTraveled,
        timeElapsed,
        currentSpeed,
      });

      // Update info window content
      const content = `
        <div class="p-2">
          <div class="font-bold text-lg mb-2">${balloon.name}</div>
          <div class="grid gap-1">
            <div>Altitude: ${Math.round(currentAltitude).toLocaleString()}ft</div>
            <div>Distance: ${Math.round(distanceTraveled / 1000).toLocaleString()}km</div>
            <div>Speed: ${Math.round(currentSpeed)}mph</div>
            <div>Time: ${timeElapsed.toFixed(1)}s</div>
          </div>
        </div>
      `;
      
      infoWindow.current.setContent(content);
      infoWindow.current.setPosition(currentPosition);
      infoWindow.current.open(mapInstance.current);
      
      await new Promise(resolve => setTimeout(resolve, stepDuration));
      animationMarker.setPosition(currentPosition);
      
      if (mapInstance.current) {
        mapInstance.current.panTo(currentPosition);
      }
    }

    // Remove animation marker and info window
    animationMarker.setMap(null);
    infoWindow.current.close();
    setAnimationInfo(null);

    // Find nearest street view
    try {
      const nearestLocation = await findNearestStreetView(landingPoint);
      
      if (nearestLocation && mapInstance.current && mapRef.current) {
        panorama.current = new google.maps.StreetViewPanorama(
          mapRef.current,
          {
            position: nearestLocation.latLng!,
            pov: {
              heading: balloon.direction,
              pitch: 0,
            },
            zoom: 1,
          }
        );
        mapInstance.current.setStreetView(panorama.current);
      }
    } catch (error) {
      console.error('Could not find street view:', error);
    }

    // Reset animation state
    setAnimatingBalloonId(null);
  };

  useEffect(() => {
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['geometry'],
    });

    loader.load().then(() => {
      if (mapRef.current && !mapInstance.current) {
        const bounds = {
          north: 49.382808,
          south: 24.396308,
          east: -66.934570,
          west: -125.000000,
        };

        mapInstance.current = new google.maps.Map(mapRef.current, {
          center: { lat: 39.8283, lng: -98.5795 },
          zoom: 4,
          styles: mapStyles,
          restriction: {
            latLngBounds: bounds,
            strictBounds: true,
          },
          minZoom: 3,
          maxZoom: 12,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER
          },
          streetViewControl: true,
        });

        streetViewService.current = new google.maps.StreetViewService();
      }
    });
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;

    // Update markers for each balloon
    balloons.forEach((balloon) => {
      const position = { lat: balloon.latitude, lng: balloon.longitude };
      const landingPoint = calculateLandingPoint(balloon);
      
      if (!markers.current[balloon.id]) {
        markers.current[balloon.id] = new google.maps.Marker({
          position,
          map: mapInstance.current,
          title: balloon.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: selectedBalloonId === balloon.id ? '#22c55e' : '#3b82f6',
            fillOpacity: 0.9,
            strokeWeight: 2,
            strokeColor: '#fff',
          },
        });

        markers.current[balloon.id].addListener('click', () => {
          if (mapInstance.current) {
            mapInstance.current.panTo(position);
            mapInstance.current.setZoom(6);
          }
        });
      } else {
        markers.current[balloon.id].setPosition(position);
        markers.current[balloon.id].setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: selectedBalloonId === balloon.id ? '#22c55e' : '#3b82f6',
          fillOpacity: 0.9,
          strokeWeight: 2,
          strokeColor: '#fff',
        });
      }

      if (!landingMarkers.current[balloon.id]) {
        landingMarkers.current[balloon.id] = new google.maps.Marker({
          position: landingPoint,
          map: mapInstance.current,
          title: `${balloon.name} Landing Point`,
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: '#ef4444',
            fillOpacity: 0.9,
            strokeWeight: 2,
            strokeColor: '#fff',
            rotation: balloon.direction,
          },
        });

        trajectoryLines.current[balloon.id] = new google.maps.Polyline({
          path: [position, landingPoint],
          geodesic: true,
          strokeColor: '#ef4444',
          strokeOpacity: 0.5,
          strokeWeight: 2,
          map: mapInstance.current,
        });
      } else {
        landingMarkers.current[balloon.id].setPosition(landingPoint);
        landingMarkers.current[balloon.id].setIcon({
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#ef4444',
          fillOpacity: 0.9,
          strokeWeight: 2,
          strokeColor: '#fff',
          rotation: balloon.direction,
        });
        trajectoryLines.current[balloon.id].setPath([position, landingPoint]);
      }
    });

    if (selectedBalloonId) {
      const selectedBalloon = balloons.find(b => b.id === selectedBalloonId);
      if (selectedBalloon && mapInstance.current) {
        mapInstance.current.panTo({ 
          lat: selectedBalloon.latitude, 
          lng: selectedBalloon.longitude 
        });
        mapInstance.current.setZoom(6);
      }
    }
  }, [balloons, selectedBalloonId, trajectories]);

  // Handle balloon pop animation
  useEffect(() => {
    if (animatingBalloonId) {
      const balloon = balloons.find(b => b.id === animatingBalloonId);
      if (balloon) {
        animateBalloonPop(balloon);
      }
    }
  }, [animatingBalloonId, balloons]);

  return (
    <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" />
  );
}