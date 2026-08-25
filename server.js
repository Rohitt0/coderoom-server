const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Liveblocks } = require("@liveblocks/node");
require('dotenv').config();

const app = express();

// Initialize Liveblocks
const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY,
});

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://coderoom-pied.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ Connection Error:", err));

// 2. Create the Room Schema
const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  code: String,
  language: String,
  updatedAt: { type: Date, default: Date.now }
});

const Room = mongoose.model('Room', RoomSchema);

// --- NEW: Liveblocks Auth Endpoint ---
app.post("/api/liveblocks-auth", async (req, res) => {
  try {
    const session = liveblocks.prepareSession(
      `user-${Math.floor(Math.random() * 1000)}`, 
      { userInfo: { name: "Anonymous", color: "#00bfff" } }
    );

    session.allow("*", session.FULL_ACCESS);

    const { status, body } = await session.authorize();
    res.status(status).send(body);
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(500).send("Authentication failed");
  }
});

// 3. API: Save Code
app.post('/save-code', async (req, res) => {
  const { roomId, code, language } = req.body;
  try {
    const room = await Room.findOneAndUpdate(
      { roomId },
      { code, language, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    res.status(200).json(room);
  } catch (err) {
    res.status(500).send(err);
  }
});

// 4. API: Load Code
app.get('/load-code/:roomId', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    res.status(200).json(room);
  } catch (err) {
    res.status(500).send(err);
  }
});

// --- UPDATED: Dynamic Port for Render ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "CodeRoom Server",
  });
});