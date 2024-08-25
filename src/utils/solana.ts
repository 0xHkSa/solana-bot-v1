import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, TransactionConfirmationStrategy } from '@solana/web3.js';
import fs from 'fs';

const AIRDROP_AMOUNT = LAMPORTS_PER_SOL; // 1 SOL

export async function getBalance(connection: Connection, address: string): Promise<number> {
    const publicKey = new PublicKey(address)
    // Fetch wallet balance in lamports 
    const balance = await connection.getBalance(publicKey);
    // Converts lamports to SOL
    return balance / 1e9; // 1 SOL = 1,000,000,000 lamports
}

// CREATE A NEW WALLET
export function createWallet() {
  const keypair = Keypair.generate()
  return {
    publicKey: keypair.publicKey.toString(),
    secretKey: Buffer.from(keypair.secretKey).toString('hex')
  };
}

// AIRDROP SOLANA TESTNET SOL 
export async function requestAirdrop(connection: Connection, address: string): Promise<string | null> {
  const publicKey = new PublicKey(address);
  let retries = 0;
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second (Hmm is there a better way than to hardCode the retry amounts)

  while (retries < maxRetries) {
    try {
      console.log(`Attempting airdrop (try ${retries + 1}/${maxRetries})...`);
      const signature = await connection.requestAirdrop(publicKey, AIRDROP_AMOUNT);

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature,
      })

      console.log(`Airdrop Successful! Signature: ${signature}`);
      return signature;

    } catch (error: any) {
      if (error.message.includes("429 Too Many Requests")) {
        const delay = baseDelay * Math.pow(2, retries);
        console.log(`Rate limited.  Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        console.error(`Airdrop failed: ${error.message}`);
        return null;
      }
    }
  } 
  console.error('Max retries reached.  Airdrop failed.');
  return null;
}

// SAVE WALLET TO FILE
export function saveWalletToFile(wallet: { publicKey: string, secretKey: string }, filename: string) {
  fs.writeFileSync(filename, JSON.stringify(wallet));
}

// LOAD WALLET FROM FILE
export function loadWalletFromFile(filename: string): { publicKey: string, secretKey: string } {
  const data = fs.readFileSync(filename, 'utf8');
  return JSON.parse(data);
}

/*
-----
/*

 // TODO: Add more utility functions
  // For example:
  // - Send SOL
  // - Interact with tokens
*/


