import { Transaction, isValidTransaction } from "./transaction";
import { createWallet } from "./wallet";
import crypto from "crypto";
import fs from "fs";

const USERS_FILE = "./data.json";

export interface Block {
  index: number;
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  nonce: number;
  hash: string;
}

export class Blockchain {
  chain: Block[] = [];
  pendingTransactions: Transaction[] = [];
  difficulty: number = 3;
  users: {
    username: string;
    address: string;
    privateKey?: string;
    registeredAt: number;
    lastMinedAt?: number;
  }[] = [];

  constructor() {
    if (this.chain.length === 0) {
      this.createGenesisBlock();
    }
    this.loadUsers();
  }

  createGenesisBlock() {
    const genesis: Block = {
      index: 0,
      timestamp: Date.now(),
      transactions: [],
      previousHash: "0",
      nonce: 0,
      hash: "GENESIS",
    };
    this.chain.push(genesis);
  }

  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  addTransaction(tx: Transaction) {
    if (isValidTransaction(tx)) {
      this.pendingTransactions.push(tx);
      return true;
    }
    return false;
  }

  loadUsers() {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const data = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
        if (data.users) this.users = data.users;
      }
    } catch (e) {
      this.users = [];
    }
  }

  saveUsers() {
    let data: {
      users: {
        username: string;
        address: string;
        privateKey?: string;
        registeredAt: number;
        lastMinedAt?: number;
      }[];
    } = { users: [] };
    if (fs.existsSync(USERS_FILE)) {
      try {
        data = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
      } catch {}
    }
    data.users = this.users ?? [];
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
  }

  registerUser(username: string) {
    // Check if user already exists
    let user = this.users.find((u) => u.username === username);
    if (user) {
      return {
        success: false,
        message: "Username already registered",
        address: user.address,
        privateKey: user.privateKey ?? null,
      };
    }
    const registeredAt = Date.now();
    // Generează chei wallet pentru user
    const wallet = createWallet();
    user = {
      username,
      address: wallet.publicKey,
      privateKey: wallet.privateKey,
      registeredAt,
    };
    this.users.push(user);
    this.saveUsers();
    // Airdrop 1000 tokens to new user
    const airdropTx: Transaction = {
      from: "SYSTEM",
      to: wallet.publicKey,
      amount: 1000,
      signature: "",
    };
    this.pendingTransactions.push(airdropTx);
    return {
      success: true,
      message: "User registered and airdrop complete",
      address: wallet.publicKey,
      privateKey: wallet.privateKey,
    };
  }

  mineBlock(minerAddress: string) {
    // Restricție: doar o dată la 24h
    const user = this.users.find((u) => u.address === minerAddress);
    const now = Date.now();
    if (user) {
      if (user.lastMinedAt && now - user.lastMinedAt < 24 * 60 * 60 * 1000) {
        const hoursLeft = Math.ceil(
          (24 * 60 * 60 * 1000 - (now - user.lastMinedAt)) / (60 * 60 * 1000)
        );
        return {
          error: true,
          message: `Poți mina din nou peste ${hoursLeft} ore.`,
        };
      }
      user.lastMinedAt = now;
      this.saveUsers();
    }

    // Reward transaction
    const rewardTx: Transaction = {
      from: "SYSTEM",
      to: minerAddress,
      amount: 400,
      signature: "",
    };
    this.pendingTransactions.push(rewardTx);

    const block: Block = {
      index: this.chain.length,
      timestamp: Date.now(),
      transactions: [...this.pendingTransactions],
      previousHash: this.getLastBlock().hash,
      nonce: 0,
      hash: "",
    };

    // Proof of Work
    block.hash = this.proofOfWork(block);
    this.chain.push(block);
    this.pendingTransactions = [];
    return block;
  }

  proofOfWork(block: Block): string {
    let hash = "";
    let nonce = 0;
    do {
      nonce++;
      hash = this.calculateHash(block, nonce);
    } while (!hash.startsWith("0".repeat(this.difficulty)));
    block.nonce = nonce;
    return hash;
  }

  calculateHash(block: Block, nonce: number): string {
    const data = `${block.index}${block.timestamp}${JSON.stringify(
      block.transactions
    )}${block.previousHash}${nonce}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const prev = this.chain[i - 1];
      const curr = this.chain[i];
      if (curr.previousHash !== prev.hash) return false;
      if (curr.hash !== this.calculateHash(curr, curr.nonce)) return false;
      for (const tx of curr.transactions) {
        if (tx.from !== "SYSTEM" && !isValidTransaction(tx)) return false;
      }
    }
    return true;
  }
}
