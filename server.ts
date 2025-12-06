
// server.ts — Entry point for Local Development
import app from "./src/app";

const PORT = process.env.PORT || 5174;

app.listen(PORT, () => {
    console.log(`🚀 Solonova backend running at http://localhost:${PORT}`);
});
