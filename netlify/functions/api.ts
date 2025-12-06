
import serverless from "serverless-http";
import app from "../../src/app"; // Reuse the same app logic

// Create a handler for Netlify Functions
export const handler = serverless(app);
