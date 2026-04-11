import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Pool (We will configure this later)
// const pool = new pg.Pool({ ... });

// Basic Route to test
app.get('/', (req, res) => {
    res.json({ message: 'Los Santos Hoops API is running! 🏀' });
});

app.get('/season', (req, res) => {
    // TODO: Fetch from Database
    res.json({
        startDate: "2026-01-15T12:00:00",
        currentRound: 1,
        phase: 'regular'
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
