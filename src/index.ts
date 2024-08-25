// Importing the solana web3 library and needed configs
import { Connection } from '@solana/web3.js'
import { SOLANA_NETWORK } from './config'
import { getBalance, createWallet, requestAirdrop, saveWalletToFile, loadWalletFromFile } from './utils/solana'

async function main() {
    // This is how we connect to the solana network
    const connection = new Connection(SOLANA_NETWORK)
    console.log('Solana devNet linked: ', SOLANA_NETWORK)

    // Load or Save wallet
    let wallet;
    const walletFile = 'wallet.json';

    try {
        wallet = loadWalletFromFile(walletFile);
        console.log('Existing Wallet Loaded'); 
    } catch (error) {
        wallet = createWallet();
        saveWalletToFile(wallet, walletFile);
        console.log('Created and saved new wallet');
    }
        console.log('Public Key:', wallet.publicKey);
        // console.log('Secret Key:', wallet.secretKey);
        console.log('Secret Key:', wallet.secretKey.slice(0, 10) + '...[redacted]'); // figure out what this is doing here


    // Check balance and get AirDrop for devNet
    try {
        let balance = await getBalance(connection, wallet.publicKey);
        console.log(`Current Wallet Balance: ${balance} SOL.`);

        if (balance < 1) {
            console.log('Requesting SOLANA airdrop...');
            const signature = await requestAirdrop(connection, wallet.publicKey);
            console.log('Air drip drip dropped.  Signature:' , signature);

            balance = await getBalance(connection, wallet.publicKey);
            console.log(`Current Wallet Balance: ${balance} SOL.`)
        }
    } catch (error) {
        console.log('Error: ', error);
    }
    
    // TODO: Add more functionality here
    // For example:
    // - Send transactions
    // - Interact with smart contracts
}

// Run the main func? and a standard error handler 
main().catch(console.error)

/*

*/