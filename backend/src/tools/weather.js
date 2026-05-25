require('dotenv').config();
const { tool } = require("langchain");
const { z } = require("zod");
const axios = require("axios");
const { getUnsplashPhoto } = require("../services/unsplash.js");

const API_BASE = "http://api.weatherapi.com/v1"

const isValidYYYYMMDD = (yyyyMMdd) => { // yyyy-MM-dd
 const year = Number(yyyyMMdd.slice(0, 4));
  const month = Number(yyyyMMdd.slice(5, 7));
  const day = Number(yyyyMMdd.slice(8, 10));

  const d = new Date(year, month - 1, day);

  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

function daysFromToday(yyyyMMdd) { // yyyy-MM-dd
  const year = Number(yyyyMMdd.slice(0, 4));
  const month = Number(yyyyMMdd.slice(5, 7));
  const day = Number(yyyyMMdd.slice(8, 10));

  const inputDate = new Date(year, month - 1, day);
  const today = new Date();

  // normalize both to midnight
  inputDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffMs = inputDate - today;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

const getWeatherFunction = async (input) => {
  // current.json // future.json // forecast.json

  // Input validity check yyyy-MM-dd - seies of 
  const {city, currentOrForecast, day} = input;
  
  if (typeof day === "string" && !isValidYYYYMMDD(day)) {
    throw new Error("Invalid date");
  }
  const offset =
    typeof day === "number" ? day :
    typeof day === "string" ? daysFromToday(day) :
    0;
  if (offset < 0) {
    throw new Error("Past dates not supported");
  }
  if (currentOrForecast === "forecast"){
    if (((typeof day === "string") && ((daysFromToday(day) > 14))) || ((typeof day === "int") && (day > 14))){
      const call = "future";
    } else{
      const call = "forecast";
    }
  } else{
    const call = "current";
  }

  const call =
    currentOrForecast === "current"
      ? "current"
      : offset > 14
        ? "future"
        : "forecast";

  const payload = {
    city,
    ...(typeof day === "number"
      ? { offsetDays: day }
      : { offsetDays: offset, date: day })
  };


  const { data } = await axios.get(`${API_BASE}/${call}.json`, {
    params: {
      key: process.env.WEATHER_API_KEY,
      q: city,
      aqi: "no",
      days: day,
      alerts: "no",
      dt: day
    }
  });

  console.log(`${API_BASE}/${call}.json`);

  
  const photo = await getUnsplashPhoto(`${city} city landscape`);

  const weather =
  call === "current"
    ? {
        city,
        photo,
        type: call,
        temperature: data.current.temp_c,
        condition: data.current.condition.text,
        icon: data.current.condition.icon,
        humidity: data.current.humidity,
        wind_kph: data.current.wind_kph,
        uv: data.current.uv,
      }
    : (() => {
        const dayData = data.forecast.forecastday[0].day;
        return {
          city,
          photo,
          type: call,
          max_temperature: dayData.maxtemp_c,
          min_temperature: dayData.mintemp_c,
          average_temperature: dayData.avgtemp_c,
          max_wind: dayData.maxwind_kph,
          average_humidity: dayData.avghumidity,
          uv: dayData.uv,
          condition: dayData.condition.text,
          icon: dayData.condition.icon,
        };
      })();
  
  
  console.log(weather);

  return JSON.stringify(weather);

};

const getWeather = tool(
  (input) => getWeatherFunction(input),
  {
    name: "get_weather",
    description:
      "Get weather information for a specific city. " +
      "Returns either current conditions or a forecast depending on the request. " +
      "Use 'current' for present weather and 'forecast' for upcoming weather. " +
      "The 'day' field can be a specific date (yyyy-MM-dd) or a relative offset like 'in X days'. " +
      "Do not assume weather beyond available forecast range; the system will handle invalid or out-of-range requests.",
    schema: z.object({
      city: z.string().describe("The city to get the weather for."),
      currentOrForecast: z
        .enum(["current", "forecast"])
        .describe("Whether it is current or forecast weather."),
      day: z.union([
        z.number().int().min(0).describe("Forecast offset in days from today"),
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Specific date in yyyy-MM-dd format")
      ]).optional().describe(
        "Weather time selector. Use a number for forecast days ahead, or yyyy-MM-dd if the user explicitly gives a date."
      )
    }),
  }
);

module.exports = { getWeather };
