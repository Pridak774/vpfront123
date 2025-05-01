import WebSocket, { Server as WebSocketServer } from "ws";
import { Blockchain } from "./blockchain";
import { Transaction } from "./transaction";

const peers: string[] = [];
let sockets: WebSocket[] = [];

export function initP2PServer(blockchain: Blockchain, port: number) {
  const server = new WebSocketServer({ port });
  server.on("connection", (ws: WebSocket) => {
    sockets.push(ws);
    ws.on("message", (data: Buffer) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === "BLOCKCHAIN") {
        handleBlockchainSync(blockchain, msg.chain);
      }
      if (msg.type === "TRANSACTION") {
        blockchain.addTransaction(msg.tx);
      }
    });
    ws.on("close", () => {
      sockets = sockets.filter((s) => s !== ws);
    });
  });
  console.log(`P2P server running on ws://localhost:${port}`);
}

export function connectToPeer(peer: string) {
  const ws = new WebSocket(peer);
  ws.on("open", () => {
    sockets.push(ws);
    console.log("Connected to peer", peer);
  });
}

export function broadcastBlockchain(chain: any) {
  sockets.forEach((ws) =>
    ws.send(JSON.stringify({ type: "BLOCKCHAIN", chain }))
  );
}

export function broadcastTransaction(tx: Transaction) {
  sockets.forEach((ws) => ws.send(JSON.stringify({ type: "TRANSACTION", tx })));
}

export function handleBlockchainSync(blockchain: Blockchain, newChain: any) {
  if (
    newChain.length > blockchain.chain.length &&
    isChainValid(newChain, blockchain)
  ) {
    blockchain.chain = newChain;
    blockchain.pendingTransactions = [];
    broadcastBlockchain(blockchain.chain);
    console.log("Lanț sincronizat automat cu un peer.");
  }
}

function isChainValid(chain: any[], blockchain: Blockchain): boolean {
  for (let i = 1; i < chain.length; i++) {
    const prev = chain[i - 1];
    const curr = chain[i];
    if (curr.previousHash !== prev.hash) return false;
    if (curr.hash !== blockchain.calculateHash(curr, curr.nonce)) return false;
    for (const tx of curr.transactions) {
      if (tx.from !== "SYSTEM" && typeof tx.signature !== "undefined") {
        // Optionally, add transaction validation here
      }
    }
  }
  return true;
}
