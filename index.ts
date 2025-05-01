import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createWallet, sign } from "./wallet";
import { Transaction } from "./transaction";
import { Blockchain } from "./blockchain";
import {
  initP2PServer,
  connectToPeer,
  broadcastBlockchain,
  broadcastTransaction,
} from "./p2p";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

// Placeholder: health check
app.get("/", (req, res) => {
  res.send("PONTA Blockchain backend is running!");
});

const blockchain = new Blockchain();
initP2PServer(blockchain, 6001); // Poți schimba portul pentru fiecare nod

// Register a new user
app.post("/register", (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res
      .status(400)
      .json({ success: false, message: "Username required" });
  }
  const result = blockchain.registerUser(username);
  res.json(result);
});

// Creează un portofel nou (chei publice/private)
app.get("/wallet/new", (req, res) => {
  const wallet = createWallet();
  res.json(wallet);
});

// Derive public key from private key and return wallet info
app.post("/wallet/from-private", (req, res) => {
  const { privateKey } = req.body;
  if (!privateKey) {
    return res
      .status(400)
      .json({ success: false, message: "Private key required" });
  }
  try {
    // Use wallet.ts logic to get public key from private key
    const { publicKey } =
      require("./wallet").getPublicKeyFromPrivate(privateKey);
    // Find user by address
    const user = blockchain.users.find((u) => u.address === publicKey);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Wallet not found" });
    }
    return res.json({ success: true, publicKey });
  } catch (e) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid private key" });
  }
});

// Trimite o tranzacție semnată
app.post("/transaction", (req, res) => {
  const { from, to, amount, privateKey } = req.body;
  if (!from || !to || !amount || !privateKey) {
    return res.status(400).json({
      success: false,
      message: "from, to, amount, privateKey required",
    });
  }
  const data = `${from}:${to}:${amount}`;
  const signature = sign(data, privateKey);
  const tx: Transaction = { from, to, amount, signature };
  if (blockchain.addTransaction(tx)) {
    broadcastTransaction(tx);
    res.json({ success: true, tx });
  } else {
    res.status(400).json({ success: false, message: "Invalid transaction" });
  }
});

// Endpoint pentru conectare la peer
app.post("/peer", (req, res) => {
  const { peer } = req.body;
  if (!peer)
    return res.status(400).json({ success: false, message: "peer required" });
  connectToPeer(peer);
  res.json({ success: true });
});

// Minează un bloc (cu recompensă pentru miner)
app.post("/mine", (req, res) => {
  const { miner } = req.body;
  if (!miner) {
    return res
      .status(400)
      .json({ success: false, message: "miner publicKey required" });
  }
  const block = blockchain.mineBlock(miner);
  broadcastBlockchain(blockchain.chain);
  res.json({ success: true, block });
});

// Vizualizează lanțul de blocuri
app.get("/chain", (req, res) => {
  res.json(blockchain.chain);
});

// Vizualizează balanța unui portofel
app.get("/balance/:publicKey", (req, res) => {
  const { publicKey } = req.params;
  let balance = 0;
  for (const block of blockchain.chain) {
    for (const tx of block.transactions) {
      if (tx.from === publicKey) balance -= tx.amount;
      if (tx.to === publicKey) balance += tx.amount;
    }
  }
  res.json({ success: true, balance });
});

// Endpoint pentru istoric tranzacții portofel
app.get("/history/:publicKey", (req, res) => {
  const { publicKey } = req.params;
  const history = [];
  for (const block of blockchain.chain) {
    for (const tx of block.transactions) {
      if (tx.from === publicKey || tx.to === publicKey) {
        history.push({ ...tx, block: block.index, timestamp: block.timestamp });
      }
    }
  }
  res.json({ success: true, history });
});

// Endpoint pentru a obține adresa blockchain a unui user
app.get("/address/:username", (req, res) => {
  const { username } = req.params;
  const user = blockchain.users.find((u) => u.username === username);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  res.json({ success: true, address: user.address });
});

// Endpoint pentru a obține toți userii și adresele lor
app.get("/users", (req, res) => {
  res.json({ success: true, users: blockchain.users });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
