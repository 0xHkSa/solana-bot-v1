import {
  Connection,
  PublicKey,
  Keypair,
  sendAndConfirmTransaction,
  Transaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

import * as splToken from '@solana/spl-token';
import fs from 'fs';
import { PythHttpClient, getPythProgramKeyForCluster } from '@pythnetwork/client';

const AIRDROP_AMOUNT = LAMPORTS_PER_SOL; // 1 SOL

export async function getBalance(connection: Connection, address: string): Promise<number> {
  const publicKey = new PublicKey(address);
  // Fetch wallet balance in lamports
  const balance = await connection.getBalance(publicKey);
  // Converts lamports to SOL
  return balance / 1e9; // 1 SOL = 1,000,000,000 lamports
}

// CREATE A NEW WALLET
export function createWallet() {
  const keypair = Keypair.generate();
  return {
    publicKey: keypair.publicKey.toString(),
    secretKey: Buffer.from(keypair.secretKey).toString('hex'),
  };
}

// AIRDROP SOLANA TESTNET SOL
export async function requestAirdrop(
  connection: Connection,
  address: string
): Promise<string | null> {
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
      });

      console.log(`Airdrop Successful! Signature: ${signature}`);
      return signature;
    } catch (error: any) {
      if (error.message.includes('429 Too Many Requests')) {
        const delay = baseDelay * Math.pow(2, retries);
        console.log(`Rate limited.  Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
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
export function saveWalletToFile(
  wallet: { publicKey: string; secretKey: string },
  filename: string
) {
  fs.writeFileSync(filename, JSON.stringify(wallet));
}

// LOAD WALLET FROM FILE
export function loadWalletFromFile(filename: string): {
  publicKey: string;
  secretKey: string;
} {
  const data = fs.readFileSync(filename, 'utf8');
  return JSON.parse(data);
}

// CREATE TOKEN ACCOUNT
export async function createTokenAccount(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey
): Promise<PublicKey> {
  const tokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  );
  console.log(`Token account created: ${tokenAccount.address.toString()}`);
  return tokenAccount.address;
}

// GET TOKEN BALANCE
export async function getTokenBalance(
  connection: Connection,
  tokenAccount: PublicKey
): Promise<number> {
  const balance = await connection.getTokenAccountBalance(tokenAccount);
  console.log(`Token Balance: ${balance.value.uiAmount}`);
  return balance.value.uiAmount || 0;
}

// TRANSFER TOKENS
export async function transferTokens(
  connection: Connection,
  payer: Keypair,
  sourceTokenAccount: PublicKey,
  destinationTokenAccount: PublicKey,
  owner: Keypair,
  amount: number
): Promise<string> {
  try {
    const transaction = new Transaction().add(
      splToken.createTransferInstruction(
        sourceTokenAccount,
        destinationTokenAccount,
        owner.publicKey,
        amount,
        [],
        splToken.TOKEN_PROGRAM_ID
      )
    );

    const signature = await sendAndConfirmTransaction(connection, transaction, [payer, owner]);

    console.log(`Transfer complete! Signature: ${signature}`);
    return signature;
  } catch (error) {
    console.error('Error transferring tokens:', error);
    throw error;
  }
}

// TESTING MINT TOKENS
export async function createAndMintTestToken(
  connection: Connection,
  payer: Keypair,
  mintAuthority: Keypair,
  decimals: number = 6
): Promise<{ mint: PublicKey; tokenAccount: PublicKey }> {
  try {
    // Step 1: Create a new token mint
    console.log('Creating token mint...');
    const mint = await splToken.createMint(
      connection,
      payer,
      mintAuthority.publicKey,
      null,
      decimals
    );
    console.log(`Created token mint: ${mint.toBase58()}`);

    // Step 2: Create a token account for the payer
    console.log('Creating token account...');
    const tokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      payer.publicKey
    );
    console.log(`Created token account: ${tokenAccount.address.toBase58()}`);

    // Step 3: Mint tokens to the account
    console.log('Minting tokens...');
    const mintAmount = 1000 * Math.pow(10, decimals);
    await splToken.mintTo(connection, payer, mint, tokenAccount.address, mintAuthority, mintAmount);
    console.log(`Minted ${mintAmount} tokens to ${tokenAccount.address.toBase58()}`);

    return { mint, tokenAccount: tokenAccount.address };
  } catch (error) {
    console.error('Error in createAndMintTestToken:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

// TEMP TEST DATA AGGREGATOR
export async function getTokenPrice(
  connection: Connection,
  pythPriceAccountKey: string
): Promise<number | null> {
  try {
    const pythClient = new PythHttpClient(connection, getPythProgramKeyForCluster('devnet'));
    const data = await pythClient.getData();

    const priceInfo = data.productPrice.get(pythPriceAccountKey);
    if (priceInfo && priceInfo.price) {
      console.log(
        `Current price: $${priceInfo.price} ± $${priceInfo.confidence} (${priceInfo.status})`
      );
      return priceInfo.price;
    } else {
      console.log('Price data not available');
      return null;
    }
  } catch (error) {
    console.error('Error fetching price:', error);
    return null;
  }
}
/*
---
*/
