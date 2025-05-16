import cron from "node-cron";
import { faker } from "@faker-js/faker";
import Transaction from "../models/Transaction";
import { TransactionType } from "../types/index";

const CRON_SCHEDULE = "*/5 * * * * *";

const types: string[] = Object.values(TransactionType);

export const startTransactionJob = () => {
  console.log("Starting transaction cron job...");
  cron.schedule(CRON_SCHEDULE, async () => {
    try {
      const fakeTransaction = {
        id: faker.string.uuid(),
        userId: faker.number.int({ min: 12, max: 12 }).toString(),
        createdAt: new Date(),
        type: types[faker.number.int({ min: 0, max: types.length - 1 })],
        amount: faker.number.float({ min: 1, max: 1000, fractionDigits: 0}),
      };

      await Transaction.create(fakeTransaction);

      console.log("Fake transaction saved:", fakeTransaction);
    } catch (error) {
      console.error("Error in cron job:", error);
    }
  });
};
