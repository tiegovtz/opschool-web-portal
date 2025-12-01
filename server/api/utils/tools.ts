import { tool } from "ai";
import { z } from "zod";

export const studentTools = {
  // Convert Fahrenheit to Celsius
  convertFahrenheitToCelsius: tool({
    description: "Convert a temperature in Fahrenheit to Celsius",
    inputSchema: z.object({ temperature: z.number() }),
    execute: async ({ temperature }) => ({
      celsius: Math.round((temperature - 32) * (5 / 9)),
    }),
  }),

  // Simple Math Evaluator
  math: tool({
    description: "Evaluate basic math expressions",
    inputSchema: z.object({ expression: z.string() }),
    execute: async ({ expression }) => {
      try {
        const result = eval(expression); // basic, replace with safer parser in prod
        return { result };
      } catch {
        return { result: "Invalid expression" };
      }
    },
  }),

  // Temperature generator (example tool)
  weather: tool({
    description: "Get the weather in a location (Fahrenheit)",
    inputSchema: z.object({ location: z.string() }),
    execute: async ({ location }) => ({
      location,
      temperature: Math.round(Math.random() * (90 - 32) + 32),
    }),
  }),
};
