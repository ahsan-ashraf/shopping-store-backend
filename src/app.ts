import express, { type Application } from "express";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

const app: Application = express();

app.listen(PORT, (error?: Error) => {
  if (error) {
    console.error("Error starting Server!");
  } else {
    console.log(`Server running on port: ${PORT}`);
  }
});
