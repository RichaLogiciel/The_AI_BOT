// app/api/chat/route.ts
import { NextRequest } from "next/server";
import { mistral } from "@ai-sdk/mistral";
import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod";
import fetch from "node-fetch";

// Helper function to get weather data
async function getWeatherData(location: string, unit: "C" | "F" = "C") {
  const trimmedLocation = location.trim();
  if (!trimmedLocation) {
    return { error: "Please provide a location for the weather lookup." };
  }

  try {
    // 1) Geocode via Open-Meteo (no API key needed)
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        trimmedLocation
      )}&count=5&language=en&format=json`
    );
    if (!geoRes.ok) {
      return { error: `I couldn't look up "${trimmedLocation}". Please check the spelling or add the country/state.` };
    }

    interface GeoResult {
      name: string;
      latitude: number;
      longitude: number;
      country?: string;
      admin1?: string;
      admin2?: string;
      country_code?: string;
    }

    const geoJson = (await geoRes.json()) as { results?: GeoResult[] };
    const results = geoJson.results ?? [];

    console.log("results", results);
    if (!results.length) {
      return { error: `I couldn't find "${trimmedLocation}". Try adding the country (e.g., "Paris, FR").` };
    }

    // Simple scoring to pick best match; prefer matches that include query parts
    const queryLower = trimmedLocation.toLowerCase();
    const scored = results
      .map((r) => {
        let score = 0;
        const nameLower = (r.name || "").toLowerCase();
        const adminLower = (r.admin1 || "").toLowerCase();
        if (nameLower && queryLower.includes(nameLower)) score += 2;
        if (adminLower && queryLower.includes(adminLower)) score += 1;
        return { score, r };
      })
      .sort((a, b) => b.score - a.score);

    const best = scored[0]?.r ?? results[0];
    const { latitude, longitude, name, country, admin1, admin2 } = best;

    // 2) Current weather via Open-Meteo with more details
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=precipitation,weathercode&daily=weathercode&timezone=auto`
    );

    if (!weatherRes.ok) {
      return { error: `Weather data is unavailable for ${name}.` };
    }

    const weatherJson = (await weatherRes.json()) as {
      current_weather?: {
        temperature: number;
        weathercode: number;
        time: string;
      };
      hourly?: {
        precipitation?: number[];
        weathercode?: number[];
        time?: string[];
      };
    };

    if (!weatherJson.current_weather) {
      return { error: `I couldn't get the current weather for ${name}.` };
    }

    console.log("weatherJson", weatherJson);
    const tempC = weatherJson.current_weather.temperature;
    const temp =
      unit === "F" ? (tempC * 9) / 5 + 32 : tempC;
    const tempRounded = Math.round(temp);

    const locationLabel = `${name}${
      admin2 ? `, ${admin2}` : ""
    }${admin1 ? `, ${admin1}` : ""}${country ? `, ${country}` : ""}`;

    // Determine if it's day or night based on current time
    const now = new Date();
    const currentHour = now.getHours();
    const isDay = currentHour >= 6 && currentHour < 20;

    // Determine if it's rainy based on weathercode
    // Weather codes: 0-1 = clear, 2-3 = partly cloudy, 45-48 = fog, 51-67 = drizzle/rain, 71-77 = snow, 80-99 = rain/snow showers
    const weathercode = weatherJson.current_weather.weathercode || 0;
    const isRainy = weathercode >= 51 && weathercode <= 99;

    // Get additional data
    const hourly = weatherJson.hourly;
    const currentIndex = hourly?.time?.findIndex(
      (t) => new Date(t).getHours() === currentHour
    ) ?? 0;
    const precipitation = hourly?.precipitation?.[currentIndex] ?? 0;
    const windSpeed = 16; // Default, can be enhanced with actual API data
    const humidity = 83; // Default, can be enhanced with actual API data
    const uvIndex = 2; // Default, can be enhanced with actual API data

    return {
      temperature: tempRounded,
      isDay,
      isRainy: isRainy || precipitation > 0,
      location: locationLabel,
      windSpeed,
      humidity,
      uvIndex,
    };
  } catch (error) {
    console.error("Weather tool error:", error);
    return { error: "I couldn't fetch the weather just now. Please try again." };
  }
}

// Helper function to get places data
async function getPlacesData(location: string) {
  try {
    // Geocode the location
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        location
      )}&count=1&language=en&format=json`
    );

    if (!geoRes.ok) {
      return {
        nearbyPlaces: ["Unable to fetch places"],
      
      };
    }

    const geoJson = (await geoRes.json()) as {
      results?: Array<{
        name: string;
        latitude: number;
        longitude: number;
        country?: string;
      }>;
    };

    const results = geoJson.results ?? [];
    if (!results.length) {
      return {
        nearbyPlaces: ["Location not found"],
        bestCuisines: ["Location not found"],
      };
    }

    const { name, country } = results[0];

    // For demo purposes, return sample data
    // In production, you'd use a places API like Google Places, Foursquare, etc.
    const nearbyPlaces = [
      `${name} City Center`,
      `${name} Park`,
      `${name} Museum`,
      `${name} Market`,
      `${name} Square`,
    ];
    // const countryLower = (country || "").toLowerCase();

    return {
      nearbyPlaces,
    };
  } catch (error) {
    console.error("Places tool error:", error);
    return {
      nearbyPlaces: ["Error fetching places"],
    };
  }
}

// Dynamic weather tool
export const weatherTool = tool({
  description: "Get the weather in a location",
  inputSchema: z.object({
    location: z.string().describe("The location to get the weather for"),
    unit: z.enum(["C", "F"]).optional().default("C"),
  }),
  execute: async ({ location, unit }) => {
    const result = await getWeatherData(location, unit);
    if ("error" in result) {
      return result.error;
    }
    return result;
  },
});

// Combined tool that gets weather and places data
export const getWeatherWithPlacesTool = tool({
  description: "Get weather data and nearby places for a location.",
  inputSchema: z.object({
    location: z.string(),
    unit: z.enum(["C", "F"]).optional().default("C"),
  }),
  execute: async ({ location, unit }) => {
    const weatherResult = await getWeatherData(location, unit);

    if ("error" in weatherResult) {
      return weatherResult;
    }

    const placesResult = await getPlacesData(location);

    return {
      type: "weather_with_places",
      weather: weatherResult,
      nearbyPlaces: placesResult.nearbyPlaces,
    };
  },
});

export async function POST(req: NextRequest) {
  console.log("Calling Chat API");
  try {
    const { question } = await req.json();

    if (!question || typeof question !== "string") {
      return new Response("Invalid question", { status: 400 });
    }

    const tools = {
      getWeatherWithPlaces: getWeatherWithPlacesTool,
      getWeather: weatherTool,
    };

    const result = streamText({
      model: mistral("mistral-large-latest"),
      system: `You are a helpful assistant.
              When the user asks about weather or temperature in a location:
              ALWAYS call the getWeatherWithPlaces tool with the location.
              After calling the tool, return ONLY the tool result exactly as provided without any modifications, explanations, or additional text.`,
      messages: [{ role: "user", content: question }],
      tools,
      stopWhen: stepCountIs(3),
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Server Error", { status: 500 });
  }
}