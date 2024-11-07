"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import MapComponent from "./MapComponent";
import StatsComponent from "./StatsComponent";
import RouteInfo from "./RouteInfo";
import ClusterInfo from "./ClusterInfo"; 
import { fetchRoutes, updateMapRegion, updateChartData, updateStats } from "./util";
import "./globals.css";
import "./raster.js";

interface Route {
  [key: string]: Array<Array<[number, number, string]>>;
}

const Home: React.FC = () => {
  const [routes, setRoutes] = useState<Route>({});
  const [activeRoute, setActiveRoute] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [showClusters, setShowClusters] = useState<boolean>(true);
  const [showMarkers, setShowMarkers] = useState<boolean>(true);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);
  const [view, setView] = useState<"route" | "statistics" | "clusters">("route" as "route" | "statistics" | "clusters");
  const [clusterRegions, setClusterRegions] = useState<any[]>([]); // New state for clusters

  useEffect(() => {
    setIsClient(true);
    fetchRoutes(setRoutes, setActiveRoute);
  }, []);

  useEffect(() => {
    if (activeRoute && routes) {
      updateMapRegion(activeRoute, routes, setMapRegion);
      updateChartData(activeRoute, routes, setChartData);
      updateStats(activeRoute, routes, setStats);
    }
  }, [activeRoute, routes]);

  return (
    <div className="flex flex-col h-screen p-10">
      <Head>
        <title>Route Visualizer</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <link rel="apple-touch-icon" sizes="57x57" href="/favicon.ico" />
      </Head>

      <header className="p-4 text-xl">
        <div className="mx-auto flex items-center gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">Route Visualizer</h1>

          <select
            className="rounded bg-clear p-2 dark:bg-black"
            onChange={(e) => setActiveRoute(e.target.value)}
            value={activeRoute || ""}>
            {Object.keys(routes).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>

          <button
            className="border-gray-500 rounded p-2"
            onClick={() =>
              setActiveRoute(
                (current) =>
                  Object.keys(routes)[
                    (Object.keys(routes).indexOf(current as string) - 1 + Object.keys(routes).length) %
                      Object.keys(routes).length
                  ]
              )
            }>
            &larr;
          </button>
          <button
            className="border-gray-500 rounded p-2"
            onClick={() =>
              setActiveRoute(
                (current) =>
                  Object.keys(routes)[(Object.keys(routes).indexOf(current as string) + 1) % Object.keys(routes).length]
              )
            }>
            &rarr;
          </button>

          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={showClusters} onChange={() => setShowClusters(!showClusters)} />
            <span>Show Clusters</span>
          </label>

          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={showMarkers} onChange={() => setShowMarkers(!showMarkers)} />
            <span>Show Markers</span>
          </label>
        </div>
      </header>

      <main className="flex-grow flex flex-row md:flex-row p-4 gap-4">
        <section className="w-full md:w-1/2 rounded-lg">
          {isClient && activeRoute && (
            <MapComponent
              mapRegion={mapRegion}
              routes={routes}
              activeRoute={activeRoute}
              showClusters={showClusters}
              showMarkers={showMarkers}
              onSelectRoute={setSelectedRouteIndex}
              setClusterRegions={setClusterRegions}
              moveToCluster={() => {} /* Placeholder for moveToCluster function */}
            />
          )}
        </section>

        <aside className="w-full md:w-1/2 space-y-4 ">
          <div className="flex justify-left  space-x-2  border rounded-lg">
            {["route", "statistics", "clusters"].map((type) => (
              <button
                key={type}
                className={`flex-1 text-base font-medium py-2 px-4 rounded-lg
                  ${view === type ? " bg-gray-100 dark:bg-gray-800" : "bg-gray-200 dark:bg-gray-700"}`}
                onClick={() => setView(type as "route" | "statistics" | "clusters")}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <div className="m-2">
            {view === "route" ? (
              <div className="overflow-y-auto max-h-svh">
                <RouteInfo route={activeRoute ? routes[activeRoute] : null} selectedRouteIndex={selectedRouteIndex} />
              </div>
            ) : view === "statistics" ? (
              <div className="overflow-y-auto max-h-svh">
                <StatsComponent stats={stats} chartData={chartData} purposeData={undefined} modeData={undefined} />
              </div>
            ) : view === "clusters" ? (
              <div className="overflow-y-auto max-h-svh">
                <ClusterInfo
                  clusters={clusterRegions}
                  trips={activeRoute ? routes[activeRoute] : {}}
                  moveToCluster={() => {}}
                />
              </div>
            ) : null}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default Home;
