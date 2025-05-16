import { Express } from "express";
import { userController } from "../controllers/index";

export const setRoutes = (app: Express) => {
  app.get("/user/:id", userController.getUserTransactions.bind(userController));
  app.get("/user/:id/payouts", userController.getUserPayouts.bind(userController));
};
