import React from "react";
import SuggestAnswers from "./suggestions/SuggestAnswers";
import WeatherCard from "./weather/WeatherCard";
import CalendarCard from "./calendar/CalendarCard";
import TrailCard from "./trail/TrailCard";
import { getHelperPayload, normalizeHelperMessage } from "./common/helperUtils";

const HelperCard = ({ msg, onSuggestionSelect }) => {
  const helperName = msg.helper_name || msg.helperName;

  if (helperName === "suggestAnswers" || (!helperName && Array.isArray(getHelperPayload(msg)))) {
    return <SuggestAnswers msg={msg} onSelect={onSuggestionSelect}/>;
  }

  if (helperName === "get_weather") return <WeatherCard msg={msg}/>;
  if (helperName === "create_calendar_event") return <CalendarCard msg={msg}/>;
  if (helperName === "get_trail") return <TrailCard msg={msg}/>;

  return null;
};

export { normalizeHelperMessage };
export default HelperCard;
