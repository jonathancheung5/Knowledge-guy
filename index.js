const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const MEETINGS_FILE = path.join(__dirname, "meetings.json");

app.use(express.json());

app.post("/webhook", (req, res) => {
  const meeting = req.body;

  if (!meeting || typeof meeting !== "object" || !meeting.id) {
    return res.status(400).json({ success: false, error: "Invalid meeting data" });
  }

  let meetings = [];
  try {
    if (fs.existsSync(MEETINGS_FILE)) {
      const raw = fs.readFileSync(MEETINGS_FILE, "utf-8");
      meetings = JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading meetings.json:", err.message);
  }

  meetings.push(meeting);

  try {
    fs.writeFileSync(MEETINGS_FILE, JSON.stringify(meetings, null, 2));
  } catch (err) {
    console.error("Error writing meetings.json:", err.message);
    return res.status(500).json({ success: false, error: "Failed to save meeting" });
  }

  console.log(`Saved meeting: "${meeting.name}" (${meeting.createdAt})`);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Webhook receiver listening on port ${PORT}`);
});
