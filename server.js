const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(" MongoDB Connected"))
  .catch(err => console.log(" Connection Error:", err));

// 2. Create the Room Schema (The structure for our data)
const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  code: String,
  language: String,
  updatedAt: { type: Date, default: Date.now }
});

const Room = mongoose.model('Room', RoomSchema);

// 3. API: Save Code (The Autosave endpoint)
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

// 4. API: Load Code (When a user joins)
app.get('/load-code/:roomId', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    res.status(200).json(room);
  } catch (err) {
    res.status(500).send(err);
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));