const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:UMFKsIdAjbxvAJlBsFyBLGNSPwFcCcXb@postgres.railway.internal:5432/railway',
  ssl: false,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      name TEXT,
      date TIMESTAMPTZ,
      attendees JSONB,
      notes JSONB,
      action_items JSONB,
      transcript JSONB,
      tags JSONB
    )
  `);
  console.log("Database initialized — meetings table ready");
}

app.use(express.json());

app.post("/webhook", async (req, res) => {
  const meeting = req.body;

  if (!meeting || typeof meeting !== "object" || !meeting.id) {
    return res.status(400).json({ success: false, error: "Invalid meeting data" });
  }

  try {
    await pool.query(
      `INSERT INTO meetings (id, name, date, attendees, notes, action_items, transcript, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         date = EXCLUDED.date,
         attendees = EXCLUDED.attendees,
         notes = EXCLUDED.notes,
         action_items = EXCLUDED.action_items,
         transcript = EXCLUDED.transcript,
         tags = EXCLUDED.tags`,
      [
        meeting.id,
        meeting.name || null,
        meeting.date || meeting.createdAt || null,
        JSON.stringify(meeting.attendees || []),
        JSON.stringify(meeting.notes || []),
        JSON.stringify(meeting.action_items || meeting.actionItems || []),
        JSON.stringify(meeting.transcript || []),
        JSON.stringify(meeting.tags || []),
      ]
    );

    console.log(`Saved meeting: "${meeting.name}" (${meeting.date || meeting.createdAt})`);
    res.json({ success: true });
  } catch (err) {
    console.error("Error saving meeting:", err.message);
    res.status(500).json({ success: false, error: "Failed to save meeting" });
  }
});

app.listen(PORT, async () => {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const masked = dbUrl.replace(/:([^@]+)@/, ":****@");
    console.log(`Connecting to database: ${masked}`);
  } else {
    console.error("WARNING: DATABASE_URL is not set — pg will fall back to localhost!");
  }
  await initDb();
  console.log(`Webhook receiver listening on port ${PORT}`);
});
