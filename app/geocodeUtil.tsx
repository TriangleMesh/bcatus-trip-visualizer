export const geocode = async (latitude: number, longitude: number): Promise<string> => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY||'';
  const url = process.env.NEXT_PUBLIC_API_URL||'';

  if (!apiKey) {
    console.error("Google Maps API key is not defined.");
    return "Unknown location";
  }

  try {
    const response = await fetch(
      `${url}/geocode/json/?latlng=${latitude},${longitude}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const result = data.results[0];
      const premise = result.address_components.find((component: any) => component.types.includes("premise"));
      const poi = result.address_components.find((component: any) => component.types.includes("point_of_interest"));
      return premise?.long_name || poi?.long_name || result.formatted_address || "Unknown location";
    } else {
      return "Unknown location";
    }
  } catch (error) {
    console.error("Error fetching address:", error);
    return "Error fetching address";
  }
};
