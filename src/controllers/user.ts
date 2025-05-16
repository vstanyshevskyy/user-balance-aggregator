import { Request, Response } from "express";
import Transaction from "../models/Transaction";
import sequelize from "../config/database";
import { TransactionType } from "../types";

interface TransactionSum {
  type: TransactionType;
  totalAmount: number;
}

const TOTAL_AMOUNT_COLUMN = "totalAmount";

export class UserController {
  public async getUserTransactions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;

      if (!userId) {
        res.status(400).json({ message: "User ID is required." });
        return;
      }

      const transactionSums = (await Transaction.findAll({
        attributes: [
          "type",
          [sequelize.fn("SUM", sequelize.col("amount")), TOTAL_AMOUNT_COLUMN],
        ],
        where: { userId },
        group: ["type"],
        raw: true,
      })) as unknown as TransactionSum[];

      if (transactionSums.length === 0) {
        res.status(200).json({
          userId,
          balance: 0,
          [TransactionType.Earned]: 0,
          [TransactionType.Spent]: 0,
          [TransactionType.PaidOut]: 0,
          [TransactionType.Payout]: 0,
        });
        return;
      }

      res.status(200).json(this.formatResponse(userId, transactionSums));
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  public async getUserPayouts(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;

      if (!userId) {
        res.status(400).json({ message: "User ID is required." });
        return;
      }

      const transactionSums = (await Transaction.findAll({
        attributes: [
          "type",
          [sequelize.fn("SUM", sequelize.col("amount")), TOTAL_AMOUNT_COLUMN],
        ],
        where: {
          userId,
          type: [TransactionType.Payout, TransactionType.PaidOut],
        },
        group: ["type"],
        raw: true,
      })) as unknown as TransactionSum[];

      if (transactionSums.length === 0) {
        res.status(200).json({
          userId,
          totalPayoutAmount: 0,
        });
        return;
      }

      console.log(transactionSums);

      res.status(200).json({
        userId,
        totalPayoutAmount:
          this.getTotalAmount(transactionSums, TransactionType.Payout) -
          this.getTotalAmount(transactionSums, TransactionType.PaidOut),
      });
    } catch (error) {
      console.error("Error fetching user payouts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  private calculateBalance(transactionSums: TransactionSum[]): number {
    return transactionSums.reduce((acc, transaction) => {
      switch (transaction.type) {
        case TransactionType.Earned:
          return acc + transaction.totalAmount;
        case TransactionType.Spent:
          return acc - transaction.totalAmount;
        case TransactionType.PaidOut:
          return acc - transaction.totalAmount;
        default:
          return acc;
      }
    }, 0);
  }

  private getTotalAmount = (
    transactionSums: TransactionSum[],
    type: TransactionType
  ): number => transactionSums.find((t) => t.type === type)?.totalAmount || 0;

  private formatResponse(
    userId: string,
    transactionSums: TransactionSum[]
  ): object {
    return {
      userId,
      balance: this.calculateBalance(transactionSums),
      [TransactionType.Earned]: this.getTotalAmount(
        transactionSums,
        TransactionType.Earned
      ),
      [TransactionType.Spent]: this.getTotalAmount(
        transactionSums,
        TransactionType.Spent
      ),
      [TransactionType.PaidOut]: this.getTotalAmount(
        transactionSums,
        TransactionType.PaidOut
      ),
      [TransactionType.Payout]: this.getTotalAmount(
        transactionSums,
        TransactionType.Payout
      ),
    };
  }
}
