import React, { useEffect, useState } from "react";
import { geocode } from "./geocodeUtil"; 

interface ClusterInfoProps {
  clusters: any[];
  trips: { [key: string]: Array<[number, number, string]> } | {};
  moveToCluster: (center: { latitude: number; longitude: number }) => void;
}

const ClusterInfo: React.FC<ClusterInfoProps> = ({ clusters, trips, moveToCluster }) => {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [visitCounts, setVisitCounts] = useState<number[]>([]);
  const [averageDurations, setAverageDurations] = useState<number[]>([]);
  const [mostLikelyTimes, setMostLikelyTimes] = useState<string[]>([]);

  useEffect(() => {
    const fetchClusterInfo = async () => {
      const addressesPromises = clusters.map((cluster) => geocode(cluster.center.latitude, cluster.center.longitude));
      const addressesResults = await Promise.all(addressesPromises);

      const visitCountsResults = clusters.map((cluster) => calculateVisitCount(cluster, trips));
      const averageDurationsResults = clusters.map((cluster) => calculateAverageDuration(cluster, trips));
      const mostLikelyTimesResults = clusters.map((cluster) => calculateMostLikelyTime(cluster, trips));

      setAddresses(addressesResults);
      setVisitCounts(visitCountsResults);
      setAverageDurations(averageDurationsResults);
      setMostLikelyTimes(mostLikelyTimesResults);
    };

    fetchClusterInfo();
  }, [clusters, trips]);

  const calculateVisitCount = (cluster: any, trips: { [key: string]: any[] }) => {
    return Object.values(trips)
      .flat()
      .filter(
        (trip) => Array.isArray(trip.coordinates) && trip.coordinates.some((point: any) => isInCluster(cluster, point))
      ).length;
  };

  const calculateAverageDuration = (cluster: any, trips: { [key: string]: any[] }) => {
    const durations = Object.values(trips)
      .flat()
      .filter((trip) => Array.isArray(trip.coordinates))
      .map((trip) => trip.coordinates.filter((point: any) => isInCluster(cluster, point)))
      .filter((clusterPoints) => clusterPoints.length > 1)
      .map((clusterPoints) => {
        const startTime = new Date(clusterPoints[0][2]).getTime();
        const endTime = new Date(clusterPoints[clusterPoints.length - 1][2]).getTime();
        return (endTime - startTime) / (1000 * 60); // Duration in minutes
      });
    return durations.length > 0 ? durations.reduce((a, b) => a + b) / durations.length : 0;
  };

  const calculateMostLikelyTime = (cluster: any, trips: { [key: string]: any[] }) => {
    const times = Object.values(trips)
      .flat()
      .filter((trip) => Array.isArray(trip.coordinates))
      .map((trip) => trip.coordinates.filter((point: any) => isInCluster(cluster, point)))
      .filter((clusterPoints) => clusterPoints.length > 0)
      .map((clusterPoints) => new Date(clusterPoints[0][2]).getHours());

    if (times.length === 0) return "N/A";

    const timeCounts = times.reduce((acc: any, time: number) => {
      acc[time] = (acc[time] || 0) + 1;
      return acc;
    }, {});

    const mostLikelyTime = Object.keys(timeCounts).reduce((a, b) => (timeCounts[a] > timeCounts[b] ? a : b));
    return `${mostLikelyTime}:00 - ${parseInt(mostLikelyTime) + 1}:00`;
  };

  const isInCluster = (cluster: any, point: any) => {
    const distance = Math.sqrt(
      Math.pow(cluster.center.latitude - point[0], 2) + Math.pow(cluster.center.longitude - point[1], 2)
    );
    return distance <= cluster.radius / 111; // Approximate radius in degrees
  };

  return (
    <div className=" rounded-lg shadow-md ">
      <h2 className="text-3xl font-semibold tracking-tight mb-4">Cluster Information</h2>
      {clusters.map((cluster, index) => (
        <div
          key={index}
          className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"
          onClick={() => moveToCluster(cluster.center)} // Handle click to move camera
        >
          <h4 className="text-xl font-medium mb-2">{addresses[index]}</h4>
          <p className="mb-1">
            <span className="font-semibold">Visit Count:</span> {visitCounts[index]}
          </p>
          <p className="mb-1">
            <span className="font-semibold">Average Duration:</span>{" "}
            {averageDurations[index] ? averageDurations[index].toFixed(2) : "N/A"} minutes
          </p>
          <p>
            <span className="font-semibold">Most Likely Time:</span> {mostLikelyTimes[index]}
          </p>
        </div>
      ))}
    </div>
  );
};

export default ClusterInfo;
