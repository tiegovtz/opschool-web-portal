import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export async function shouldUseRAG(
  message: string,
  apiKey: string
): Promise<boolean> {
  const openai = createOpenAI({ apiKey });

  const prompt = `Decide if the following question needs to retrieve knowledge from notes or textbooks to answer accurately. Return "yes" or "no".\n\nQuestion: "${message}"\nAnswer:`;

  const response = await generateText({
    model: openai("gpt-3.5-turbo"),
    prompt: prompt,
    temperature: 0,
  });

  const answer = response.text.toLowerCase();
  return answer.includes("yes");
}
