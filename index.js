const express = require("express");
const rootRouter = require("./routes/index");
const cors = require("cors");

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "https://pay-karo-frontend-navy.vercel.app",
    "https://pay-karo-backend-rho.vercel.app" // Add backend deployment URL
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true // Ensure credentials are allowed
}));

app.use(express.json());
app.use('/api/v1', rootRouter);

// Add a route for the root path
app.get('/', (req, res) => {
    res.send("Welcome to the PayKaro API!");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Please use a different port.`);
        process.exit(1); // Exit the process
    } else {
        console.error("Server error:", err);
    }
});