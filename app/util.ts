export const fetchRoutes = async (setRoutes: any, setActiveRoute: any) => {
  try {
    const response = await fetch("/routes.json");
    const data = await response.json();
    setRoutes(data);
    setActiveRoute(Object.keys(data)[0]);
  } catch (error) {
    console.error("Error fetching routes:", error);
  }
};

export const updateMapRegion = (routeKey: string, routes: any, setMapRegion: any, padding: number = 0.02) => {
  const route = routes[routeKey];
  if (!route || !Array.isArray(route)) return;

  let [minLat, maxLat, minLon, maxLon] = [Infinity, -Infinity, Infinity, -Infinity];

  route.forEach((trip: any) => {
    if (Array.isArray(trip.coordinates)) {
      trip.coordinates.forEach((coords: any) => {
        const [lat, lon] = coords;
        if (typeof lat === "number" && typeof lon === "number") {
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLon = Math.min(minLon, lon);
          maxLon = Math.max(maxLon, lon);
        } else {
          console.error("Invalid coordinates:", coords);
        }
      });
    }
  });

  if (isFinite(minLat) && isFinite(maxLat) && isFinite(minLon) && isFinite(maxLon)) {
    const latDelta = (maxLat - minLat) * (1 + padding);
    const lonDelta = (maxLon - minLon) * (1 + padding);
    setMapRegion({
      centerLatitude: (minLat + maxLat) / 2,
      centerLongitude: (minLon + maxLon) / 2,
      latitudeDelta: latDelta > 0 ? latDelta : 0.05,
      longitudeDelta: lonDelta > 0 ? lonDelta : 0.05,
    });
  } else {
    console.error("No valid coordinates found for the route:", routeKey);
  }
};

export const updateChartData = (routeKey: string, routes: any, setChartData: any) => {
  const route = routes[routeKey];
  if (!route || !Array.isArray(route)) return;

  const counts = route.reduce((acc: Record<string, number>, trip: any) => {
    if (Array.isArray(trip.coordinates) && trip.coordinates.length > 0) {
      const date = new Date(trip.coordinates[0][2]).toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
    }
    return acc;
  }, {});

  const labels = Object.keys(counts).sort();
  setChartData({
    labels,
    datasets: [{ label: "Number of Routes", data: labels.map((date) => counts[date]), borderColor: "#4BC0C0" }],
  });
};

export const updateStats = (routeKey: string, routes: any, setStats: any) => {
  const route = routes[routeKey];
  if (!route || !Array.isArray(route)) return;

  const totalRoutes = route.length;
  const totalDistance = route.reduce((acc: number, trip: any) => {
    if (Array.isArray(trip.coordinates)) {
      return (
        trip.coordinates.reduce((tripAcc: number, coords: any, idx: number) => {
          const [lat, lon] = coords;
          if (typeof lat === "number" && typeof lon === "number" && idx > 0) {
            const [prevLat, prevLon] = trip.coordinates[idx - 1];
            const distance = calculateDistance(prevLat, prevLon, lat, lon);
            return tripAcc + distance;
          }
          return tripAcc;
        }, 0) + acc
      );
    }
    return acc;
  }, 0);

  const dates = route.map((trip: any) =>
    Array.isArray(trip.coordinates) && trip.coordinates.length > 0 ? new Date(trip.coordinates[0][2]).getTime() : 0
  );
  const validDates = dates.filter((date) => date > 0);
  const dateRange = validDates.length
    ? `${new Date(Math.min(...validDates)).toLocaleDateString()} - ${new Date(
        Math.max(...validDates)
      ).toLocaleDateString()}`
    : "No valid dates";

  setStats({ totalRoutes, totalDistance: totalDistance.toFixed(2), dateRange });
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  if (typeof lat1 !== "number" || typeof lon1 !== "number" || typeof lat2 !== "number" || typeof lon2 !== "number") {
    console.error("Invalid coordinates for distance calculation:", { lat1, lon1, lat2, lon2 });
    return 0;
  }

  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
