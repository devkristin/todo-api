import express from "express";
import cors from "cors";
import { supabase } from "./supabase";

const app = express();

app.use(cors());
app.use(express.json());

// Health Check
app.get("/health", async (req, res) => {
  const { error } = await supabase.from("todo").select("id").limit(1);

  if (error) {
    return res
      .status(500)
      .json({ status: "Database Error", details: error.message });
  }

  res.status(200).json({ status: "OK", database: "Connected" });
});

// Fallback Hello World
app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello World" });
});

export default app;
