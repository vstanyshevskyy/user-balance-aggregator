import express, { Request, Response } from "express";
import { setRoutes } from "./routes";
import sequelize from "./config/database";
import Transaction from "./models/Transaction";
import { startTransactionJob } from "./cron/transactionJob";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize routes
setRoutes(app);

// Sync the database and start the server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");

    // Sync models with the database
    await sequelize.sync({ force: false }); // Use `force: true` to reset the database
    console.log("Database synced.");

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};


startServer();

startTransactionJob();
