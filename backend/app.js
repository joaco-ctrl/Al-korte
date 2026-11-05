require("dotenv").config();

const express = require("express");
const cors = require("cors");
const routes = require("./routes/rutas");

const app = express();
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim());

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Origen no permitido por CORS."));
    },
    credentials: false,
}));
app.use(express.json({ limit: "1mb" }));
app.use("/api", routes);
app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada." }));
app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = Number.isInteger(error.status) ? error.status : 500;
    if (status >= 500) console.error(error);
    return res.status(status).json({
        error: status >= 500 ? "Ocurrió un error interno. Revisá la configuración del servidor." : error.message,
    });
});

if (require.main === module) {
    const port = Number(process.env.PORT) || 3000;
    app.listen(port, () => console.log(`Al-Korte API escuchando en http://localhost:${port}`));
}

module.exports = app;
