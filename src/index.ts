// Importing the solana web3 library and needed configs
import { Connection } from '@solana/web3.js'
import { SOLANA_NETWORK } from './config'

async function main() {
    // This is how we connect to the solana network
    const conection = new Connection(SOLANA_NETWORK)
    console.log('Solami linked: ', SOLANA_NETWORK)

    // TODO: Add more functionality here
    // For example:
    // - Create a wallet
    // - Check balance
    // - Send transactions
    // - Interact with smart contracts
}

// Run the main func? and a standard error handler 
main().catch(console.error)

