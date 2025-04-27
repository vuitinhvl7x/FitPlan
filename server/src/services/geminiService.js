// server/src/services/geminiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("GEMINI_API_KEY is not set in environment variables.");
  // Depending on your setup, you might want to throw an error here
  // or handle it gracefully later. For now, we'll just log.
}

// Initialize the Google Generative AI client
const genAI = APIGenerations(API_KEY); // Use the correct constructor

// Choose a model (gemini-pro is generally suitable for text generation)
// gemini-1.5-pro has a much larger context window if needed, but is more expensive
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const geminiService = {
  /**
   * Sends a prompt to the Gemini API and attempts to get a JSON response.
   * @param {string} prompt The text prompt for Gemini.
   * @returns {Promise<object>} A promise that resolves with the parsed JSON object.
   * @throws {Error} If the API call fails, the response is empty, or the response is not valid JSON.
   */
  generateJson: async (prompt) => {
    if (!API_KEY) {
      throw new Error("Gemini API key is not configured.");
    }
    try {
      console.log("Sending prompt to Gemini API...");
      // Use generateContent for a single turn conversation
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error("Gemini API returned an empty response.");
      }

      console.log(
        "Received response from Gemini API. Attempting to parse JSON..."
      );

      // Attempt to parse the text as JSON
      // Sometimes the API might include markdown ```json ... ```
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      let jsonString = text;
      if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1];
      }

      const parsedJson = JSON.parse(jsonString);

      console.log("JSON parsed successfully.");
      return parsedJson;
    } catch (error) {
      console.error("Error calling Gemini API or parsing response:", error);
      // Re-throw a more specific error
      if (error instanceof SyntaxError) {
        throw new Error(
          `Failed to parse Gemini response as JSON: ${error.message}. Response text: ${text}`
        );
      }
      throw new Error(`Gemini API generation failed: ${error.message}`);
    }
  },

  // You could add other methods here for different Gemini capabilities if needed
};

// Helper function to handle potential API key issues during initialization
function APIGenerations(apiKey) {
  if (!apiKey) {
    console.warn(
      "Gemini API key is missing. Gemini service will not be functional."
    );
    // Return a mock object or throw, depending on desired behavior
    return {
      getGenerativeModel: () => ({
        generateContent: async (prompt) => {
          console.error("Gemini API key missing. Cannot generate content.");
          // Return a mock response structure that indicates failure
          return {
            response: {
              text: () => JSON.stringify({ error: "Gemini API key missing" }),
            },
          };
        },
      }),
    };
  }
  return new GoogleGenerativeAI(apiKey);
}

export default geminiService;
