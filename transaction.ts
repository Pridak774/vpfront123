import { verify } from "./wallet";

export interface Transaction {
  from: string; // publicKey hex
  to: string; // publicKey hex
  amount: number;
  signature: string;
}

export function isValidTransaction(tx: Transaction): boolean {
  if (!tx.from || !tx.to || !tx.signature) return false;
  const data = `${tx.from}:${tx.to}:${tx.amount}`;
  return verify(data, tx.signature, tx.from);
}
