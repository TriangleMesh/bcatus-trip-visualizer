import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Annotation, Map, Marker, Polyline, Polygon } from "mapkit-react";
import {
  FaWalking,
  FaCar,
  FaBicycle,
  FaBus,
  FaTrain,
  FaShip,
  FaTaxi,
  FaFlag,
  FaFlagCheckered,
  FaMotorcycle,
  FaSchool,
  FaQuestion,
} from "react-icons/fa";
import { MdOutlineElectricScooter } from "react-icons/md";
import { GiHealthNormal } from "react-icons/gi";

interface MapComponentProps {
  mapRegion: any;
  routes: any;
  activeRoute: string;
  showClusters: boolean;
  showMarkers: boolean;
  onSelectRoute: (index: number | null) => void;
  setClusterRegions: (clusters: any[]) => void;
  moveToCluster: (center: { latitude: number; longitude: number }) => void;
}

type TravelMode =
  | "Auto Driver"
  | "Auto Passenger"
  | "Transit Bus"
  | "SkyTrain"
  | "West Coast Express"
  | "SeaBus"
  | "Walk"
  | "Bike"
  | "Shared Bike"
  | "Taxi"
  | "Car Share"
  | "HandyDart"
  | "Ride-hailing"
  | "Motorcycle"
  | "Shared E-scooter"
  | "School Bus"
  | "Other"
  | "Transit"
  | "Not Selected";

const getIconForMode = (mode: TravelMode): JSX.Element => {
  const modeLowerCase = mode.toLowerCase();

  if (modeLowerCase.includes('walk')) return <FaWalking className="text-gray-500 dark:text-gray-200" />;
  if (modeLowerCase.includes('auto')) return <FaCar className="text-gray-500 dark:text-gray-200" />;
  if (modeLowerCase.includes('bike') && !modeLowerCase.includes('e-scooter')) return <FaBicycle className="text-gray-500 dark:text-gray-200" />;
  if (modeLowerCase.includes('bus') && !modeLowerCase.includes('school')) return <FaBus className="text-gray-500 dark:text-gray-200" />;
  if (modeLowerCase.includes('train')) return <FaTrain className="text-gray-500 dark:text-gray-200" />;
  if (modeLowerCase.includes('seabus')) return <FaShip className="text-gray-500 dark:text-gray-200" />;
  if (modeLowerCase.includes('taxi') || modeLowerCase.includes('ride-hailing')) return <FaTaxi className="text-gray-500 dark:text-gray-200" />;
  if (modeLowerCase.includes('handydart')) return <GiHealthNormal className="text-gray-500 dark:text-gray-200" />;
  if (modeLowerCase.includes('motorcycle')) return <FaMotorcycle className="text-gray-500 dark:text-gray-200" />;
  if (modeLowerCase.includes('e-scooter')) return <MdOutlineElectricScooter className="text-gray-500 dark:text-gray-200" />;
  if (modeLowerCase.includes('school bus')) return <FaSchool className="text-gray-500 dark:text-gray-200" />;

  return <FaQuestion className="text-gray-500 dark:text-gray-200" />; // Default case
};

export { getIconForMode };

const MapComponent: React.FC<MapComponentProps> = ({
  mapRegion,
  routes,
  activeRoute,
  showClusters,
  showMarkers,
  onSelectRoute,
  setClusterRegions,
  moveToCluster,
}) => {
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const calculateCentroid = useCallback((points: any[]) => {
    const latitude = points.reduce((sum, point) => sum + point.latitude, 0) / points.length;
    const longitude = points.reduce((sum, point) => sum + point.longitude, 0) / points.length;
    return { latitude, longitude };
  }, []);

  const getDistance = useCallback((point1: any, point2: any) => {
    const R = 6371;
    const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.latitude * Math.PI) / 180) *
      Math.cos((point2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const calculateRadius = useCallback((center: any, points: any[]) => {
    const distances = points.map((point) => getDistance(center, point));
    return Math.max(...distances);
  }, [getDistance]);

  const generateCirclePoints = useCallback((center: any, radius: number, numPoints: number = 100) => {
    const points = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * (2 * Math.PI);
      const latitude = center.latitude + (radius / 111) * Math.cos(angle);
      const longitude =
        center.longitude + (radius / (111 * Math.cos((center.latitude * Math.PI) / 180))) * Math.sin(angle);
      points.push({ latitude, longitude });
    }
    return points;
  }, []);

  const findClusters = useCallback((points: any[]) => {
    const data = points.map((point) => [point.latitude, point.longitude]);
    const clustering = require("density-clustering");
    const dbscan = new clustering.DBSCAN();
    const clusters = dbscan.run(data, 0.0005, 8);

    const clusteredPoints = clusters.map((cluster: any[]) => cluster.map((index) => points[index]));
    return clusteredPoints;
  }, []);

  const calculateClusters = useCallback(
    (trips: any) => {
      const points = trips.flatMap((trip: any) =>
        trip.coordinates.map(([latitude, longitude]: [number, number]) => ({ latitude, longitude }))
      );
      const clusters = findClusters(points);

      return clusters.map((cluster: any) => {
        const center = calculateCentroid(cluster);
        const radius = calculateRadius(center, cluster);
        return { center, radius };
      });
    },
    [findClusters, calculateCentroid, calculateRadius]
  );

  const calculateStartPointClusters = useCallback(
    (trips: any) => {
      const startPoints = trips.map((trip: any) => ({
        latitude: trip.coordinates[0][0],
        longitude: trip.coordinates[0][1],
      }));
      const clusters = findClusters(startPoints);

      return clusters
        .map((cluster: any) => {
          if (cluster.length <= 2) return null;
          const center = calculateCentroid(cluster);
          const radius = calculateRadius(center, cluster);
          return { center, radius };
        })
        .filter(Boolean);
    },
    [findClusters, calculateCentroid, calculateRadius]
  );

  const calculateEndPointClusters = useCallback(
    (trips: any) => {
      const endPoints = trips.map((trip: any) => ({
        latitude: trip.coordinates[trip.coordinates.length - 1][0],
        longitude: trip.coordinates[trip.coordinates.length - 1][1],
      }));
      const clusters = findClusters(endPoints);

      return clusters
        .map((cluster: any) => {
          if (cluster.length <= 2) return null;
          const center = calculateCentroid(cluster);
          const radius = calculateRadius(center, cluster);
          return { center, radius };
        })
        .filter(Boolean);
    },
    [findClusters, calculateCentroid, calculateRadius]
  );

  const clusters = useMemo(() => {
    return routes && routes[activeRoute] ? calculateClusters(routes[activeRoute]) : null;
  }, [routes, activeRoute, calculateClusters]);
  const startClusters = useMemo(
    () => {
      return routes && routes[activeRoute] ? calculateStartPointClusters(routes[activeRoute]) : null;
    },
    [routes, activeRoute, calculateStartPointClusters]
  );
  const endClusters = useMemo(
    () => {
      return routes && routes[activeRoute] ? calculateEndPointClusters(routes[activeRoute]) : null

    },
    [routes, activeRoute, calculateEndPointClusters]
  );

  useEffect(() => {
    setClusterRegions(clusters);
  }, [clusters, setClusterRegions]);

  const handlePolylineClick = useCallback((index: number) => {
    setSelectedRouteIndex(index);
    onSelectRoute(index);
  }, [onSelectRoute]);

  const handleMapClick = useCallback(() => {
    setSelectedRouteIndex(null);
    onSelectRoute(null);
  }, [onSelectRoute]);

  const handleRegionChange = useCallback((region: any) => {
    setZoomLevel(region.latitudeDelta < 0.1 ? 3 : region.latitudeDelta < 0.5 ? 2 : 1);
  }, []);

  const renderCalloutContent = useCallback((markerType: string, tripIndex: number, latitude: number, longitude: number) => (
    <div>
      <h3>{`${markerType} of Trip ${tripIndex + 1}`}</h3>
      <p>Latitude: {latitude.toFixed(4)}</p>
      <p>Longitude: {longitude.toFixed(4)}</p>
    </div>
  ), []);

  return (
    <Map
      colorScheme={2}
      distances={0}
      showsPointsOfInterest
      token={process.env.NEXT_PUBLIC_MAPKIT_TOKEN || ''}
      cameraBoundary={mapRegion}
      initialRegion={mapRegion}
      onClick={handleMapClick}
      onRegionChangeStart={handleRegionChange}
      onRegionChangeEnd={handleRegionChange}
    >
      {showClusters && clusters &&
        clusters.map((region: { center: any; radius: number }, index: React.Key | null | undefined) => (
          <Polygon
            key={index}
            points={generateCirclePoints(region.center, region.radius)}
            lineWidth={2}
            lineJoin="round"
            fillColor={"#F59E0B"}
            strokeColor={"#F59E0B"}
            visible
            enabled
          />
        ))}
      {showClusters && startClusters &&
        startClusters.map((region: { center: any; radius: number }, index: React.Key | null | undefined) => (
          <Polygon
            key={index}
            points={generateCirclePoints(region.center, region.radius)}
            lineWidth={6}
            lineJoin="round"
            fillColor={"#10B981"}
            strokeColor={"#10B981"}
            visible
            enabled
          />
        ))}
      {showClusters && endClusters &&
        endClusters.map((region: { center: any; radius: number }, index: React.Key | null | undefined) => (
          <Polygon
            key={index}
            points={generateCirclePoints(region.center, region.radius)}
            lineWidth={6}
            lineJoin="round"
            fillColor={"#EF4444"}
            strokeColor={"#EF4444"}
            visible
            enabled
          />
        ))}
      {
        routes && routes[activeRoute] &&
        routes[activeRoute].map((trip: any, index: number) => (
          <React.Fragment key={index}>
            <Polyline
              points={trip.coordinates.map(([latitude, longitude]: [number, number]) => ({ latitude, longitude }))}
              strokeColor={selectedRouteIndex === index ? "#F1A31D" : "#2564EBBB"}
              lineWidth={selectedRouteIndex === index ? 4 : 2}
              onSelect={() => handlePolylineClick(index)}
              onDeselect={handleMapClick}
            />
            {showMarkers && (
              <React.Fragment>
                <Marker
                  latitude={trip.coordinates[0][0]}
                  longitude={trip.coordinates[0][1]}
                  color={"#F59E0B"}
                  clusteringIdentifier="startMarkers"
                  title={`Start #${index + 1}`}
                  onSelect={() => handlePolylineClick(index)}
                  onDeselect={handleMapClick}
                  calloutContent={renderCalloutContent("Start", index, trip.coordinates[0][0], trip.coordinates[0][1])}
                />
                <Marker
                  latitude={trip.coordinates[trip.coordinates.length - 1][0]}
                  longitude={trip.coordinates[trip.coordinates.length - 1][1]}
                  clusteringIdentifier="endMarkers"
                  color="#EF4444"
                  title={`End #${index + 1}`}
                  onSelect={() => handlePolylineClick(index)}
                  onDeselect={handleMapClick}
                  calloutContent={renderCalloutContent(
                    "End",
                    index,
                    trip.coordinates[trip.coordinates.length - 1][0],
                    trip.coordinates[trip.coordinates.length - 1][1]
                  )}
                />
                {trip.mode_of_travel && (
                  <Annotation
                    latitude={trip.coordinates[Math.floor(trip.coordinates.length / 2)][0]}
                    longitude={trip.coordinates[Math.floor(trip.coordinates.length / 2)][1]}
                    title={trip.mode_of_travel}
                    onSelect={() => handlePolylineClick(index)}
                    onDeselect={handleMapClick}
                  >
                    <div
                      className="flex items-center justify-center bg-white dark:bg-gray-600 
                  rounded-full px-4 py-1 border-2 border-gray-500 dark:border-gray-300">
                      {getIconForMode(trip.mode_of_travel as TravelMode)}
                    </div>
                  </Annotation>
                )}
              </React.Fragment>
            )}
          </React.Fragment>
        ))}
    </Map>
  );
};

export default MapComponent;
