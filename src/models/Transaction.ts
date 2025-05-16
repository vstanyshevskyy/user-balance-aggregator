import { DataTypes } from "sequelize";
import sequelize from "../config/database";
import { TransactionType } from "../types/index";

const Transaction = sequelize.define(
  "Transaction",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(TransactionType)),
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    tableName: "transactions",
    timestamps: false,
  }
);

export default Transaction;
