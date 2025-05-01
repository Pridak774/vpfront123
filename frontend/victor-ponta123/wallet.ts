import { ec as EC } from "elliptic";

const ec = new EC("secp256k1");

export function createWallet() {
  const key = ec.genKeyPair();
  return {
    privateKey: key.getPrivate("hex"),
    publicKey: key.getPublic("hex"),
  };
}

export function sign(data: string, privateKey: string) {
  const key = ec.keyFromPrivate(privateKey, "hex");
  const signature = key.sign(data).toDER("hex");
  return signature;
}

export function verify(data: string, signature: string, publicKey: string) {
  const key = ec.keyFromPublic(publicKey, "hex");
  return key.verify(data, signature);
}

export function getPublicKeyFromPrivate(privateKey: string) {
  const key = ec.keyFromPrivate(privateKey, "hex");
  return { publicKey: key.getPublic("hex") };
}
