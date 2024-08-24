import { Connection, PublicKey } from '@solana/web3.js';

export async function getBalance(connection: Connection, address: string): Promise<number> {
    const publicKey = new PublicKey(address)
    const balance = await connection.getBalance(publicKey);
    
    // Converts lamports to SOL
    return balance / 1e9; // 1 SOL = 1,000,000,000 lamports
}




