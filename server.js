const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// NeonDB PostgreSQL connection
const pool = new Pool({
  connectionString:
    "postgresql://neondb_owner:npg_Ngib4lsXvo3F@ep-polished-dream-adyqzkrw-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: { rejectUnauthorized: false },
});

// Create table if not exists
(async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS order1 (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(15) NOT NULL,
      address TEXT NOT NULL,
      quantity INT NOT NULL,
      date DATE NOT NULL,
      slot VARCHAR(50) NOT NULL,
      comments TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(createTableQuery);
    console.log("✅ Table 'orders' is ready!");
  } catch (err) {
    console.error("❌ Failed to create table:", err);
  }
})();

// Submit order endpoint
app.post("/submit-order", async (req, res) => {
  console.log("Received order:", req.body);
  try {
    const { name, phone, address, quantity, date, slot, comments } = req.body;

    if (!name || !phone || !address || !quantity || !date || !slot) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing required fields." });
    }

    const query = `
      INSERT INTO order1 (name, phone, address, quantity, date, slot, comments)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [
      name,
      phone,
      address,
      parseInt(quantity),
      date,
      slot,
      comments || null,
    ];

    const result = await pool.query(query, values);
    console.log("✅ Order inserted:", result.rows[0]);
    res.json({ status: "success", order: result.rows[0] });
  } catch (err) {
    console.error("❌ Error inserting order:", err);
    res
      .status(500)
      .json({ status: "error", message: "Failed to submit order." });
  }
});

// Admin endpoint
app.get("/admin/orders", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM order1 ORDER BY created_at DESC;"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch orders." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
