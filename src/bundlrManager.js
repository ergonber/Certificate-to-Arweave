// src/bundlrManager.js
import { WebBundlr } from '@bundlr-network/client';

export class BundlrManager {
    constructor(networkType = 'testnet') {
        this.networkType = networkType;
        this.bundlr = null;
        this.wallet = null;
        this.isConnected = false;
    }

    async initialize() {
        try {
            console.log('🔄 Inicializando Bundlr con Arweave.app...');
            
            // Conectar con Arweave.app
            this.wallet = await this.connectToArweaveApp();
            
            const networkConfig = this.getNetworkConfig();
            
            // Inicializar Bundlr con Arweave.app como provider
            this.bundlr = new WebBundlr(
                networkConfig.url,
                networkConfig.currency,
                this.wallet
            );
            
            await this.bundlr.ready();
            
            const address = await this.wallet.getActiveAddress();
            const balance = await this.bundlr.getLoadedBalance();
            const formattedBalance = this.bundlr.utils.unitConverter(balance);
            
            console.log(`✅ Bundlr inicializado con Arweave.app`);
            console.log('📍 Address:', address);
            console.log('💰 Balance:', formattedBalance, 'AR');
            console.log('🌐 Network:', networkConfig.name);
            
            this.isConnected = true;
            return {
                address,
                balance: formattedBalance,
                network: networkConfig.name
            };
            
        } catch (error) {
            console.error('❌ Error inicializando Bundlr con Arweave.app:', error);
            this.isConnected = false;
            throw error;
        }
    }

    async connectToArweaveApp() {
        try {
            if (!window.arweaveWallet) {
                throw new Error(
                    'Arweave.app no detectada. ' +
                    'Por favor instálala desde: https://arweave.app'
                );
            }

            // Solicitar permisos a Arweave.app
            await window.arweaveWallet.connect([
                'ACCESS_ADDRESS',
                'SIGN_TRANSACTION',
                'ACCESS_PUBLIC_KEY'
            ]);
            
            const address = await window.arweaveWallet.getActiveAddress();
            console.log('🔗 Conectado a Arweave.app. Address:', address);
            
            return window.arweaveWallet;
            
        } catch (error) {
            if (error.message.includes('reject')) {
                throw new Error('Usuario rechazó la conexión con Arweave.app');
            }
            throw error;
        }
    }

    getNetworkConfig() {
        const networks = {
            mainnet: {
                name: "Bundlr Mainnet",
                url: "https://node1.bundlr.network",
                currency: "arweave",
                explorer: "https://arweave.net"
            },
            testnet: {
                name: "Bundlr DevNet",
                url: "https://devnet.bundlr.network",
                currency: "arweave", 
                explorer: "https://arweave.net"
            }
        };
        
        return networks[this.networkType] || networks.testnet;
    }

    async uploadPDF(fileBuffer, metadata = {}) {
        if (!this.isConnected || !this.bundlr) {
            await this.initialize();
        }

        try {
            console.log('📤 Preparando upload del PDF...');

            const tags = [
                { name: 'Content-Type', value: 'application/pdf' },
                { name: 'App-Name', value: 'Sistema-Certificados' },
                { name: 'App-Version', value: '1.0.0' },
                { name: 'Wallet', value: 'Arweave.app' },
                { name: 'Network', value: this.networkType },
                { name: 'Type', value: 'certificate' },
                { name: 'Timestamp', value: Date.now().toString() }
            ];

            // Añadir metadata personalizada
            Object.entries(metadata).forEach(([key, value]) => {
                if (value) {
                    tags.push({ name: key, value: value.toString() });
                }
            });

            // Calcular precio estimado
            const price = await this.bundlr.getPrice(fileBuffer.length);
            const formattedPrice = this.bundlr.utils.unitConverter(price);
            
            console.log(`💰 Costo estimado: ${formattedPrice} AR`);
            console.log('📏 Tamaño del archivo:', fileBuffer.length, 'bytes');

            // Verificar balance suficiente (solo en mainnet)
            if (this.networkType === 'mainnet') {
                const balance = await this.bundlr.getLoadedBalance();
                if (balance.isLessThan(price)) {
                    throw new Error(`Balance insuficiente. Necesitas: ${formattedPrice} AR`);
                }
            }

            console.log('🔄 Subiendo PDF... Arweave.app pedirá confirmación');
            
            // Subir archivo - Arweave.app mostrará popup de confirmación
            const transaction = await this.bundlr.upload(fileBuffer, { tags });
            
            const explorerUrl = `${this.getNetworkConfig().explorer}/${transaction.id}`;
            
            console.log('✅ PDF subido exitosamente con Arweave.app');
            console.log('📄 Transaction ID:', transaction.id);
            console.log('🔗 URL permanente:', explorerUrl);

            return {
                success: true,
                transactionId: transaction.id,
                url: explorerUrl,
                size: fileBuffer.length,
                cost: formattedPrice,
                network: this.networkType,
                wallet: 'Arweave.app',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error subiendo PDF con Arweave.app:', error);
            
            if (error.message.includes('User rejected')) {
                throw new Error('Usuario rechazó la transacción en Arweave.app');
            }
            
            throw error;
        }
    }

    async getBalance() {
        if (!this.bundlr) {
            await this.initialize();
        }
        const balance = await this.bundlr.getLoadedBalance();
        return this.bundlr.utils.unitConverter(balance);
    }

    async disconnect() {
        if (this.wallet) {
            await this.wallet.disconnect();
            this.isConnected = false;
            this.bundlr = null;
            this.wallet = null;
            console.log('✅ Desconectado de Arweave.app');
        }
    }
}
