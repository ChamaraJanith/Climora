const axios = require("axios");

const ORS_API_KEY = process.env.ORS_API_KEY;

async function getTravelMatrix(userPoint, shelterPoints) {
  if (!ORS_API_KEY) {
    throw new Error("ORS_API_KEY is not defined in environment variables");
  }
  if (!userPoint || !Array.isArray(shelterPoints) || shelterPoints.length === 0) {
    throw new Error("Invalid input: userPoint and shelterPoints are required");
  }

  const locations = [
    [userPoint.lng, userPoint.lat],
    ...shelterPoints.map((s) => [s.lng, s.lat]),
  ];

  const body = {
    locations,
    metrics: ["distance", "duration"],
    units: "km",
    sources: [0],
    destinations: shelterPoints.map((_, index) => index + 1),
  };

  const url = "https://api.openrouteservice.org/v2/matrix/driving-car";

  const response = await axios.post(url, body, {
    headers: {
      Authorization: ORS_API_KEY,
      "Content-Type": "application/json",
    },
    timeout: 15000,
  });

  console.log("✅ ORS matrix status:", response.status);

  const data = response.data;

  const distances = data.distances?.[0] || [];
  const durations = data.durations?.[0] || [];

  return shelterPoints.map((_, index) => ({
    distanceKm: distances[index] ?? null,
    durationMin: durations[index] != null ? durations[index] / 60 : null,
  }));
}

module.exports = {
  getTravelMatrix,
};
