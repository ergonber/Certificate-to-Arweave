// src/arweaveAppWallet.js
export class ArweaveAppWalletHelper {
    static async connectToArweaveApp() {
        try {
            // Arweave.app se inyecta como window.arweaveWallet
            if (window.arweaveWallet) {
                await window.arweaveWallet.connect([
                    'ACCESS_ADDRESS',
                    'SIGN_TRANSACTION', 
                    'ACCESS_PUBLIC_KEY',
                    'SIGNATURE'
                ]);
                
                const address = await window.arweaveWallet.getActiveAddress();
                console.log('✅ Conectado a Arweave.app. Address:', address);
                return window.arweaveWallet;
            } else {
                throw new Error('Arweave.app no detectada. Por favor asegúrate de que esté instalada y activa.');
            }
        } catch (error) {
            console.error('❌ Error conectando a Arweave.app:', error);
            throw error;
        }
    }

    static async getWalletDetails() {
        try {
            const address = await window.arweaveWallet.getActiveAddress();
            const balance = await window.arweaveWallet.getBalance(address);
            const publicKey = await window.arweaveWallet.getActivePublicKey();
            
            return { 
                address, 
                balance,
                publicKey
            };
        } catch (error) {
            console.error('Error obteniendo detalles de Arweave.app:', error);
            throw error;
        }
    }

    static async disconnect() {
        try {
            await window.arweaveWallet.disconnect();
            console.log('✅ Desconectado de Arweave.app');
        } catch (error) {
            console.error('Error desconectando de Arweave.app:', error);
        }
    }
}
