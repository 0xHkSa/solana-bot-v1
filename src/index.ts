import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { SOLANA_NETWORK } from './config';
import {
  getBalance,
  createWallet,
  requestAirdrop,
  saveWalletToFile,
  loadWalletFromFile,
  createTokenAccount,
  getTokenBalance,
  transferTokens,
  createAndMintTestToken,
  getTokenPrice,
} from './utils/solana';

async function main() {
  const connection = new Connection(SOLANA_NETWORK);
  console.log('Solana devNet linked: ', SOLANA_NETWORK);

  console.log('Setting up wallets');
  const wallet1 = await setupWallet('wallet.json');
  const wallet2 = await setupWallet('second_wallet.json');

  await ensureSufficientBalance(connection, wallet1);
  await ensureSufficientBalance(connection, wallet2);

  // DEMO DEMO DEMO DEMO DEMO //
  try {
    console.log('Creating and minting test token');
    console.log('Payer public key:', wallet1.publicKey);
    const payerKeypair = Keypair.fromSecretKey(Buffer.from(wallet1.secretKey, 'hex'));
    const mintAuthorityKeypair = Keypair.fromSecretKey(Buffer.from(wallet1.secretKey, 'hex'));

    console.log('Payer keypair public key:', payerKeypair.publicKey.toBase58());
    console.log('Mint authority keypair public key:', mintAuthorityKeypair.publicKey.toBase58());

    const { mint, tokenAccount: tokenAccount1 } = await createAndMintTestToken(
      connection,
      payerKeypair,
      mintAuthorityKeypair
    );

    console.log('Creating token account for second wallet');
    const tokenAccount2 = await createTokenAccount(
      connection,
      Keypair.fromSecretKey(Buffer.from(wallet2.secretKey, 'hex')),
      mint
    );

    console.log('Transferring tokens to second wallet');
    const transferAmount = 100 * Math.pow(10, 6); // Transfer 100 tokens
    await transferTokens(
      connection,
      payerKeypair,
      tokenAccount1,
      tokenAccount2,
      payerKeypair,
      transferAmount
    );

    console.log('--- Checking token balances ---');
    await getTokenBalance(connection, tokenAccount1);
    await getTokenBalance(connection, tokenAccount2);

    // console.log('Fetching SOL/USD price');
    // const SOL_USD_PRICE_ACCOUNT = 'J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix';
    // await getTokenPrice(connection, SOL_USD_PRICE_ACCOUNT);

    console.log('USDC DevNet Demo');
    const usdcDevNetMint = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr');

    const usdcTokenAccount = await createTokenAccount(connection, payerKeypair, usdcDevNetMint);

    console.log(
      'USDC token account created. Note: This account will have 0 balance as we cannot mint test USDC.'
    );
    await getTokenBalance(connection, usdcTokenAccount);
  } catch (error) {
    console.error('Error in token operations:', error);
  }
}

async function setupWallet(filename: string): Promise<{ publicKey: string; secretKey: string }> {
  try {
    const wallet = loadWalletFromFile(filename);
    console.log(`Loaded existing wallet from ${filename}`);
    return wallet;
  } catch (error) {
    const wallet = createWallet();
    saveWalletToFile(wallet, filename);
    console.log(`Created and saved new wallet to ${filename}`);
    return wallet;
  }
}

async function ensureSufficientBalance(connection: Connection, wallet: { publicKey: string }) {
  let balance = await getBalance(connection, wallet.publicKey);
  console.log(`Wallet ${wallet.publicKey} balance: ${balance} SOL`);

  if (balance < 1) {
    console.log('Requesting SOLANA airdrop...');
    const signature = await requestAirdrop(connection, wallet.publicKey);
    console.log('Airdrop completed. Signature:', signature);

    balance = await getBalance(connection, wallet.publicKey);
    console.log(`New balance: ${balance} SOL`);
  }
}

main().catch(console.error);
