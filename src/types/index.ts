export interface Request extends Express.Request {

}

export interface Response extends Express.Response {

}

export enum TransactionType {
  Payout = "payout",
  Spent = "spent",
  Earned = "earned",
  PaidOut = "paid_out",
}
