
// server.ts — Entry point for Local Development
import app from "./src/app";

const PORT = Number(process.env.PORT) || 5174;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
    console.log(`🚀 Solonova backend running at http://${HOST}:${PORT}`);
    if (Array.isArray(app.locals?.allowedOrigins)) {
        console.log(`✅ CORS allowed origins: ${app.locals.allowedOrigins.join(", ")}`);
    }
});
