"use client";

import { useState, useRef, useEffect } from "react";
import { SendIcon } from "../assets/svg/sendIcon";
import { WhiteTheme } from "../assets/svg/whiteTheme";
import { DarkTheme } from "../assets/svg/darkTheme";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import WeatherCard from "./WeatherCard";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  weatherData?: {
    temperature: number;
    isDay: boolean;
    isRainy: boolean;
    location: string;
    windSpeed?: number;
    humidity?: number;
    uvIndex?: number;
  };
  placesData?: {
    nearbyPlaces: string[];
    bestCuisines: string[];
  };
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Hi! I'm here to help you.", sender: "bot" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isDark, setIsDark] = useState(false); // Default to light theme
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: "user",
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    const sendWithDelay = async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: userMessage.text }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              text:
                errorText || "Sorry, I couldn't process that request right now.",
              sender: "bot",
            },
          ]);
          setIsTyping(false);
          return;
        }

        if (!res.body) {
          throw new Error("Response body is null");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        let botMessage = "";
        const botMsgId = (Date.now() + 1).toString();

        // Add empty bot message first (live updating)
        setMessages((prev) => [
          ...prev,
          { id: botMsgId, text: "", sender: "bot" },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          botMessage += chunk;

          // Parse for weather card and places data
          // Try multiple patterns to catch the data
          let weatherData = undefined;
          let placesData = undefined;
          let displayText = botMessage;

          // Debug: log the message to see what we're receiving
          if (botMessage.length > 0 && botMessage.includes("temperature")) {
            console.log(
              "Bot message contains weather data:",
              botMessage.substring(0, 200)
            );
          }

          // Pattern 1: With markers [WEATHER_CARD]...[/WEATHER_CARD]
          const weatherCardMatch = botMessage.match(
            /\[WEATHER_CARD\]\s*(\{[\s\S]*?\})\s*\[\/WEATHER_CARD\]/
          );

          // Pattern 2: Just JSON object (fallback) - look for JSON with temperature field
          // Handle JSON that might have newlines and spaces
          const jsonMatch = botMessage.match(/\{[^{}]*"temperature"[^{}]*\}/);

          // Pattern 3: More flexible JSON match (handles nested objects, newlines, spaces)
          // This regex looks for { ... "temperature" ... } even with newlines
          const flexibleJsonMatch = botMessage.match(
            /\{[\s\S]*?"temperature"[\s\S]*?"uvIndex"[\s\S]*?\}/
          );

          // Pattern 4: Even more flexible - just find any JSON object with temperature
          const anyJsonMatch = botMessage.match(
            /\{[\s\S]{20,500}?"temperature"[\s\S]{10,300}?\}/
          );

          if (weatherCardMatch) {
            try {
              weatherData = JSON.parse(weatherCardMatch[1]);
              console.log("Parsed weather data from card markers:", weatherData);
              displayText = displayText.replace(
                /\[WEATHER_CARD\][\s\S]*?\[\/WEATHER_CARD\]/,
                ""
              );
            } catch (e) {
              console.error(
                "Failed to parse weather data from card:",
                e,
                weatherCardMatch[1]
              );
            }
          } else if (jsonMatch && !weatherData) {
            // Try to parse as direct JSON
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              if (
                parsed.temperature !== undefined &&
                typeof parsed.temperature === "number"
              ) {
                weatherData = parsed;
                console.log(
                  "Parsed weather data from JSON match:",
                  weatherData
                );
                displayText = displayText.replace(jsonMatch[0], "");
              }
            } catch (e) {
              console.error("Failed to parse JSON:", e, jsonMatch[0]);
            }
          } else if (flexibleJsonMatch && !weatherData) {
            // Try flexible match
            try {
              const parsed = JSON.parse(flexibleJsonMatch[0]);
              if (
                parsed.temperature !== undefined &&
                typeof parsed.temperature === "number"
              ) {
                weatherData = parsed;
                console.log(
                  "Parsed weather data from flexible match:",
                  weatherData
                );
                displayText = displayText.replace(flexibleJsonMatch[0], "");
              }
            } catch (e) {
              console.error("Failed to parse flexible JSON:", e);
            }
          } else if (anyJsonMatch && !weatherData) {
            // Try any JSON match as last resort
            try {
              const parsed = JSON.parse(anyJsonMatch[0]);
              if (
                parsed.temperature !== undefined &&
                typeof parsed.temperature === "number"
              ) {
                weatherData = parsed;
                console.log(
                  "Parsed weather data from any JSON match:",
                  weatherData
                );
                displayText = displayText.replace(anyJsonMatch[0], "");
              }
            } catch (e) {
              console.error("Failed to parse any JSON:", e);
            }
          }

          // Final fallback: try to find and parse any JSON object in the message
          if (!weatherData && botMessage.includes("temperature")) {
            try {
              // Find the first { and try to parse until matching }
              const startIdx = botMessage.indexOf("{");
              if (startIdx !== -1) {
                let braceCount = 0;
                let endIdx = startIdx;
                for (
                  let i = startIdx;
                  i < botMessage.length && i < startIdx + 1000;
                  i++
                ) {
                  if (botMessage[i] === "{") braceCount++;
                  if (botMessage[i] === "}") braceCount--;
                  if (braceCount === 0) {
                    endIdx = i;
                    break;
                  }
                }
                if (endIdx > startIdx) {
                  const jsonStr = botMessage.substring(startIdx, endIdx + 1);
                  const parsed = JSON.parse(jsonStr);
                  if (
                    parsed.temperature !== undefined &&
                    typeof parsed.temperature === "number"
                  ) {
                    weatherData = parsed;
                    console.log(
                      "Parsed weather data from fallback:",
                      weatherData
                    );
                    displayText = displayText.replace(jsonStr, "");
                  }
                }
              }
            } catch (e) {
              // Silently fail - this is just a fallback
            }
          }

          // Parse places info
          const placesInfoMatch = botMessage.match(
            /\[PLACES_INFO\]([\s\S]*?)\[\/PLACES_INFO\]/
          );

          if (placesInfoMatch) {
            const placesText = placesInfoMatch[1].trim();
            // Extract places and cuisines from text
            const nearbyPlacesMatch = placesText.match(
              /Nearby Places:\s*([\s\S]+?)(?:\n|Best Cuisines:|$)/
            );
            const bestCuisinesMatch = placesText.match(
              /Best Cuisines:\s*([\s\S]+?)$/
            );

            placesData = {
              nearbyPlaces: nearbyPlacesMatch
                ? nearbyPlacesMatch[1]
                    .split(",")
                    .map((p) => p.trim())
                    .filter((p) => p)
                : [],
              bestCuisines: bestCuisinesMatch
                ? bestCuisinesMatch[1]
                    .split(",")
                    .map((c) => c.trim())
                    .filter((c) => c)
                : [],
            };
            // Remove places info from display text
            displayText = displayText.replace(
              /\[PLACES_INFO\][\s\S]*?\[\/PLACES_INFO\]/,
              ""
            );
          } else {
            // Try to extract places from text without markers
            const nearbyPlacesText = botMessage.match(
              /Nearby Places:\s*([^\n]+)/
            );
            const bestCuisinesText = botMessage.match(
              /Best Cuisines:\s*([^\n]+)/
            );

            if (nearbyPlacesText || bestCuisinesText) {
              placesData = {
                nearbyPlaces: nearbyPlacesText
                  ? nearbyPlacesText[1]
                      .split(",")
                      .map((p) => p.trim())
                      .filter((p) => p)
                  : [],
                bestCuisines: bestCuisinesText
                  ? bestCuisinesText[1]
                      .split(",")
                      .map((c) => c.trim())
                      .filter((c) => c)
                  : [],
              };
            }
          }

          // Update last bot message LIVE
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? {
                    ...m,
                    text: displayText.trim(),
                    weatherData,
                    placesData,
                  }
                : m
            )
          );
        }
      } catch (err) {
        console.error(err);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: "Something went wrong. Please try again.",
            sender: "bot",
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    };

    // Delay the actual API call so the typing indicator shows for 3.5s
    setTimeout(() => {
      void sendWithDelay();
    }, 3500);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const themeClasses = isDark
    ? {
        container: "bg-gray-900 text-gray-100",
        chatArea: "bg-gray-900",
        inputArea: "bg-gray-800 border-gray-700",
        input: "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400",
        botMessage: "bg-gray-700 text-gray-100",
        userMessage: "bg-blue-600 text-white",
        sendButton: "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600",
        header: "bg-gray-800 border-gray-700",
        toggleButton: "bg-gray-700 hover:bg-gray-600",
      }
    : {
        container: "bg-white text-gray-900",
        chatArea: "bg-gray-50",
        inputArea: "bg-white border-gray-200",
        input: "bg-white border-gray-300 text-gray-900 placeholder-gray-500",
        botMessage: "bg-gray-100 text-gray-900",
        userMessage: "bg-blue-500 text-white",
        sendButton: "bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300",
        header: "bg-white border-gray-200 shadow-sm",
        toggleButton: "bg-gray-100 hover:bg-gray-200",
      };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <div
        className={`flex flex-col w-full max-w-4xl h-[780px] ${themeClasses.container} rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700`}
      >
        {/* Header with Theme Toggle */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-b ${themeClasses.header}`}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <h2 className="font-semibold text-base">AiBot</h2>
          </div>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${themeClasses.toggleButton}`}
            aria-label="Toggle theme"
          >
            {isDark ? <DarkTheme /> : <WhiteTheme />}
          </button>
        </div>

        {/* Chat Area */}
        <div
          className={`flex-grow overflow-y-auto p-4 space-y-3 ${themeClasses.chatArea}`}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              {/* Weather Card - render outside message bubble if present */}
              {message.sender === "bot" && message.weatherData && (
                <div className="w-full max-w-md mb-3">
                  <WeatherCard {...message.weatherData} />
                </div>
              )}

              {/* Message bubble */}
              {(message.text || (message.sender === "bot" && message.placesData)) && (
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                    message.sender === "user"
                      ? themeClasses.userMessage
                      : themeClasses.botMessage
                  }`}
                  style={{
                    borderRadius:
                      message.sender === "user"
                        ? "1rem 1rem 0.25rem 1rem"
                        : "1rem 1rem 1rem 0.25rem",
                  }}
                >
                  {message.sender === "bot" ? (
                    <div className="space-y-3">
                      {/* Places Info */}
                      {message.placesData && (
                        <div className="space-y-2 text-sm">
                          <p className="font-semibold">
                            <strong>Nearby Places:</strong>{" "}
                            {message.placesData.nearbyPlaces.join(", ")}
                          </p>
                          <p className="font-semibold">
                            <strong>Best Cuisines:</strong>{" "}
                            {message.placesData.bestCuisines.join(", ")}
                          </p>
                        </div>
                      )}
                      {/* Regular text content */}
                      {message.text && message.text.trim() && (
                        <div
                          className="prose prose-sm max-w-none dark:prose-invert
                   prose-table:w-full
                   prose-table:border
                   prose-table:border-gray-300 dark:prose-table:border-gray-600
                   prose-th:border prose-td:border
                   prose-th:px-3 prose-th:py-2
                   prose-td:px-3 prose-td:py-2
                   prose-th:text-left
                   prose-table:border-collapse"
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.text}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.text}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div
                className={`max-w-[20%] rounded-2xl px-4 py-3  ${themeClasses.botMessage}`}
                style={{ borderRadius: "1rem 1rem 1rem 0.25rem" }}
              >
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-current opacity-70 animate-bounce" />
                  <span
                    className="w-2 h-2 rounded-full bg-current opacity-70 animate-bounce"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-current opacity-70 animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`border-t ${themeClasses.inputArea} p-3`}>
          <div className="flex items-end gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows={1}
              className={`flex-grow resize-none rounded-xl border px-4 py-2.5 text-sm ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
              style={{
                maxHeight: "100px",
                overflowY: "auto",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 100)}px`;
              }}
            />
            <button
              onClick={handleSend}
              disabled={inputValue.trim() === ""}
              className={`flex-shrink-0 h-10 w-10 rounded-xl ${themeClasses.sendButton} disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-md hover:shadow-lg disabled:opacity-50`}
              aria-label="Send message"
            >
              {" "}
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
