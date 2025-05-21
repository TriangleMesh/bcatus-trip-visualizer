import React from "react";

interface RouteInfoProps {
  route: any;
  selectedRouteIndex: number | null;
  setRouteIndex: any;
}

const RouteInfo: React.FC<RouteInfoProps> = ({ route, selectedRouteIndex, setRouteIndex  }) => {
  if (selectedRouteIndex === null || !route) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Select a route to see the details.</p>
        </div>
      </div>
    );
  }

  const selectedRoute = route[selectedRouteIndex];

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateTotalDistance = (coordinates: Array<[number, number, string]>): number => {
    return coordinates.reduce((acc, coord, idx) => {
      if (idx === 0) return acc;
      const [prevLat, prevLon] = coordinates[idx - 1];
      const [lat, lon] = coord;
      return acc + calculateDistance(prevLat, prevLon, lat, lon);
    }, 0);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return `${hours} hrs ${minutes} mins`;
  };

  const totalDistance = calculateTotalDistance(selectedRoute.coordinates);
  const startPoint = selectedRoute.coordinates[0];
  const endPoint = selectedRoute.coordinates[selectedRoute.coordinates.length - 1];
  const startTime = formatTimestamp(startPoint[2]);
  const endTime = formatTimestamp(endPoint[2]);
  const duration = calculateDuration(startPoint[2], endPoint[2]);
  const next=route.length>selectedRouteIndex+1?selectedRouteIndex+1:-1
  const previous=selectedRouteIndex>0?selectedRouteIndex-1:-1

  return (
    <div className="space-y-4">
      <h3 className="text-3xl font-semibold tracking-tight mb-4">Route Information</h3>
      <p className="mb-2">
        <span className="font-semibold">Route Index:</span> <button
          onClick={() => setRouteIndex(previous)}
          className={`flex-1 text-base font-medium py-2 px-3 rounded-lg bg-gray-200 dark:bg-gray-700`}
        >prev</button> {selectedRouteIndex + 1} <button
          onClick={() => setRouteIndex(next)}
          className={`flex-1 text-base font-medium py-2 px-3 rounded-lg bg-gray-200 dark:bg-gray-700`}
        >next</button>
      </p>
      <p className="mb-2">
        <span className="font-semibold">Number of Points:</span> {selectedRoute.coordinates.length}
      </p>
      <p className="mb-2">
        <span className="font-semibold">Travel Mode:</span> {selectedRoute.mode_of_travel}
      </p>
      <p className="mb-2">
        <span className="font-semibold">Identifier</span> {selectedRoute.identifier}
      </p>
      <p className="mb-2">
        <span className="font-semibold">Purpose of Travel:</span> {selectedRoute.purpose_of_travel}
      </p>
      <p className="mb-2">
        <span className="font-semibold">Total Distance:</span> {totalDistance.toFixed(2)} km
      </p>
      <p className="mb-2">
        <span className="font-semibold">Start Point:</span>{" "}
        {`(${startPoint[0].toFixed(4)}, ${startPoint[1].toFixed(4)}) at ${startTime}`}
      </p>
      <p className="mb-2">
        <span className="font-semibold">End Point:</span>{" "}
        {`(${endPoint[0].toFixed(4)}, ${endPoint[1].toFixed(4)}) at ${endTime}`}
      </p>
      <p className="mb-2">
        <span className="font-semibold">Duration of Travel:</span> {duration}
      </p>
    </div>
  );
};

export default RouteInfo;
