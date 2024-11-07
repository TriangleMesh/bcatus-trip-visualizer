import React from "react";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

interface StatsComponentProps {
  stats: any;
  chartData: any;
  purposeData: any;
  modeData: any;
}

const calculateDistance = (coord1: any, coord2: any) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2[0] - coord1[0]) * Math.PI) / 180;
  const dLon = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((coord1[0] * Math.PI) / 180) * Math.cos((coord2[0] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const parseData = (data: any) => {
  let stats = {
    totalRoutes: 0,
    totalDistance: 0,
    dateRange: "",
    timeRange: "",
    commonPurpose: "Unavailable",
    commonMode: "Unavailable",
    totalCoordinates: 0,
  };

  let purposes = new Map();
  let modes = new Map();
  let minDate = new Date();
  let maxDate = new Date(0);

  Object.keys(data).forEach((key) => {
    const routes = data[key];
    stats.totalRoutes += routes.length;

    routes.forEach((route: { coordinates: any[]; purpose_of_travel: string; mode_of_travel: string }) => {
      stats.totalCoordinates += route.coordinates.length;

      route.coordinates.forEach((coord, index) => {
        let date = new Date(coord[2]);
        if (date < minDate) minDate = date;
        if (date > maxDate) maxDate = date;

        if (index > 0) {
          const prevCoord = route.coordinates[index - 1];
          stats.totalDistance += calculateDistance(prevCoord, coord);
        }
      });

      const purpose = route.purpose_of_travel || "Not Selected";
      const mode = route.mode_of_travel || "Not Selected";
      purposes.set(purpose, (purposes.get(purpose) || 0) + 1);
      modes.set(mode, (modes.get(mode) || 0) + 1);
    });
  });

  stats.dateRange = `${minDate.toISOString().split("T")[0]} - ${maxDate.toISOString().split("T")[0]}`;
  stats.timeRange = `${minDate.toTimeString().split(" ")[0]} - ${maxDate.toTimeString().split(" ")[0]}`;

  stats.commonPurpose = [...purposes.entries()].reduce((a, b) => (a[1] > b[1] ? a : b), ["Unavailable", 0])[0];
  stats.commonMode = [...modes.entries()].reduce((a, b) => (a[1] > b[1] ? a : b), ["Unavailable", 0])[0];

  // Generate chart data for purposes and modes
  const purposeData = generateChartData(purposes);
  const modeData = generateChartData(modes);

  return { stats, chartData: generateChartData(data), purposeData, modeData };
};

const generateChartData = (data: Map<any, any>) => ({
  labels: Array.from(data.keys()),
  datasets: [
    {
      label: "Count",
      data: Array.from(data.values()),
      backgroundColor: Array.from(data.keys()).map(
        () =>
          `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(
            Math.random() * 255
          )}, 0.2)`
      ),
      borderColor: Array.from(data.keys()).map(
        () =>
          `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(
            Math.random() * 255
          )}, 1)`
      ),
      borderWidth: 1,
    },
  ],
});

const StatsComponent: React.FC<StatsComponentProps> = ({ stats, chartData, purposeData, modeData }) => (
  <div className="space-y-4">
    <h2 className="text-3xl font-semibold tracking-tight ">Statistics</h2>
    <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md">
      <p>
        Total Routes: <span className="font-bold">{stats?.totalRoutes}</span>
      </p>
      <p>
        Total Distance: <span className="font-bold">{stats?.totalDistance} km</span>
      </p>
      <p>
        Date Range: <span className="font-bold">{stats?.dateRange}</span>
      </p>
      {stats?.commonPurpose && (
        <p>
          Most Common Purpose: <span className="font-bold">{stats?.commonPurpose}</span>
        </p>
      )}
      {stats?.commonMode && (
        <p>
          Most Common Mode: <span className="font-bold">{stats?.commonMode}</span>
        </p>
      )}
    </div>
    <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md">
      {chartData && (
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-center">Route Data Over Time</h3>
          <Line data={chartData} />
        </div>
      )}
      {purposeData && (
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-center">Purposes of Travel</h3>
          <Bar data={purposeData} />
        </div>
      )}
      {modeData && (
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-center">Modes of Travel</h3>
          <Pie data={modeData} />
        </div>
      )}
    </div>
  </div>
);

export default StatsComponent;
