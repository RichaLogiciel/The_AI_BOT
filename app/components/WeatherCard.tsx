"use client";

interface WeatherCardProps {
  temperature: number;
  isDay: boolean;
  isRainy: boolean;
  location: string;
  windSpeed?: number;
  humidity?: number;
  uvIndex?: number;
}

export default function WeatherCard({
  temperature,
  isDay,
  isRainy,
  location,
  windSpeed = 16,
  humidity = 83,
  uvIndex = 2,
}: WeatherCardProps) {
  const backgroundClass = isDay
    ? "bg-gradient-to-br from-blue-400 to-blue-600"
    : "bg-gradient-to-br from-indigo-900 to-indigo-700";

  return (
    <div
      className={`relative rounded-3xl p-6 ${backgroundClass} text-white shadow-2xl border-2 border-white/20 backdrop-blur-sm`}
    >
      {/* Cloud background effect */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute top-4 right-8 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
        <div className="absolute top-12 left-12 w-32 h-32 bg-white/15 rounded-full blur-2xl"></div>
        <div className="absolute bottom-8 right-16 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Location */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold opacity-90">{location}</h3>
        </div>

        {/* Main weather display */}
        <div className="flex items-center justify-between mb-6">
          {/* Weather icon */}
          <div className="flex-shrink-0">
            {isRainy ? (
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="w-20 h-20"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm-1.47 13.5L9 15l1.47-1.5L8 12l2.47-1.5L9 9l1.47-1.5L9 6l3 3-3 3zm6 0L15 15l1.47-1.5L14 12l2.47-1.5L15 9l1.47-1.5L15 6l3 3-3 3z" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="w-20 h-20 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="5" fill="currentColor" />
                    <path
                      d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                {/* Cloud overlay for partly cloudy */}
                <div className="absolute top-2 right-2 w-12 h-12 bg-white/30 rounded-full blur-sm"></div>
              </div>
            )}
          </div>

          {/* Temperature */}
          <div className="flex-1 text-right">
            <div className="text-6xl font-bold">{temperature}°C</div>
            <div className="text-sm opacity-80 mt-1">
              {isDay ? "Day" : "Night"} • {isRainy ? "Rainy" : "Sunny"}
            </div>
          </div>
        </div>

        {/* Additional info panel */}
        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30">
          <div className="flex justify-around items-center">
            {/* Wind */}
            <div className="flex flex-col items-center">
              <svg
                className="w-6 h-6 mb-1 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="text-xs opacity-90">{windSpeed} km/h</span>
            </div>

            {/* Humidity */}
            <div className="flex flex-col items-center">
              <svg
                className="w-6 h-6 mb-1 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
              </svg>

              <span className="text-xs opacity-90">{humidity}%</span>
            </div>

            {/* UV Index */}
            <div className="flex flex-col items-center">
              <svg
                className="w-6 h-6 mb-1 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="5" />
                <path
                  d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-xs opacity-90">{uvIndex} of 10</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
