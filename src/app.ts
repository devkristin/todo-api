import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Fallback Hello World
app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello World" });
});

export default app;
