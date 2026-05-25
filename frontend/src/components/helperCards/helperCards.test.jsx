import { render, screen } from "@testing-library/react";
import HelperCard from "./helperCards";

jest.mock("react-markdown", () => ({ children }) => <>{children}</>);

test("renders persisted weather helper output", () => {
  render(
    <HelperCard
      msg={{
        speaker: 3,
        helper_name: "get_weather",
        helper_payload: {
          city: "Vienna",
          type: "current",
          temperature: 29.2,
          condition: "Partly Cloudy",
          icon: "//cdn.weatherapi.com/weather/64x64/day/116.png",
          humidity: 37,
          wind_kph: 16.2,
          uv: 2.7,
        },
      }}
      onSuggestionSelect={() => {}}
    />
  );

  expect(screen.getByText("Vienna")).toBeInTheDocument();
  expect(screen.getByText("29 C")).toBeInTheDocument();
  expect(screen.getByText("Partly Cloudy")).toBeInTheDocument();
  expect(screen.getByText("Wind 16 kph")).toBeInTheDocument();
});

test("renders persisted suggested answers helper output", () => {
  render(
    <HelperCard
      msg={{
        speaker: 3,
        helper_name: "suggestAnswers",
        helper_payload: ["Easy", "Moderate"],
      }}
      onSuggestionSelect={() => {}}
    />
  );

  expect(screen.getByText("Easy")).toBeInTheDocument();
  expect(screen.getByText("Moderate")).toBeInTheDocument();
});
