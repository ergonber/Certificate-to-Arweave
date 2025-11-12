// public/app.js
class ArweaveAppCertificateApp {
    constructor() {
        this.bundlrManager = null;
        this.isConnected = false;
        
        this.init();
    }

    async init() {
        this.initEventListeners();
        await this.checkArweaveAppAvailability();
    }

    initEventListeners() {
        document.getElementById('connectWallet').addEventListener('click', () => {
            this.connectWallet();
        });

        document.getElementById('disconnectWallet').addEventListener('click', () => {
            this.disconnectWallet();
        });

        document.getElementById('certificateForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateCertificate();
        });
    }

    async checkArweaveAppAvailability() {
        const statusElement = document.getElementById('walletStatus');
        
        if (window.arweaveWallet) {
            statusElement.textContent = '✅ Detectada';
            statusElement.className = 'success';
            document.getElementById('connectWallet').disabled = false;
        } else {
            statusElement.textContent = '❌ No detectada';
            statusElement.className = 'error';
            document.getElementById('connectWallet').disabled = true;
            document.getElementById('connectWallet').innerHTML = 
                'Instalar Arweave.app';
            document.getElementById('connectWallet').onclick = () => {
                window.open('https://arweave.app', '_blank');
            };
        }
    }

    async connectWallet() {
        try {
            this.showLoading('Conectando con Arweave.app...');
            
            const network = document.getElementById('network').value;
            this.bundlrManager = new BundlrManager(network);
            
            const walletInfo = await this.bundlrManager.initialize();
            
            // Actualizar UI
            document.getElementById('walletAddress').textContent = 
                `${walletInfo.address.slice(0, 8)}...${walletInfo.address.slice(-8)}`;
            document.getElementById('walletBalance').textContent = walletInfo.balance;
            document.getElementById('walletNetwork').textContent = 
                network === 'testnet' ? 'Testnet (Gratuito)' : 'Mainnet';
            
            document.getElementById('walletInfo').classList.remove('hidden');
            document.getElementById('certificate-section').classList.remove('hidden');
            document.getElementById('connectWallet').classList.add('hidden');
            
            this.isConnected = true;
            
            this.hideLoading();
            this.showMessage('✅ Conectado exitosamente con Arweave.app', 'success');
            
        } catch (error) {
            this.hideLoading();
            console.error('Error conectando Arweave.app:', error);
            this.showMessage('❌ ' + error.message, 'error');
        }
    }

    async disconnectWallet() {
        try {
            if (this.bundlrManager) {
                await this.bundlrManager.disconnect();
            }
            
            document.getElementById('walletInfo').classList.add('hidden');
            document.getElementById('certificate-section').classList.add('hidden');
            document.getElementById('result-section').classList.add('hidden');
            document.getElementById('connectWallet').classList.remove('hidden');
            
            this.isConnected = false;
            this.bundlrManager = null;
            
            this.showMessage('✅ Desconectado de Arweave.app', 'success');
            
        } catch (error) {
            console.error('Error desconectando:', error);
            this.showMessage('Error al desconectar: ' + error.message, 'error');
        }
    }

    async generateCertificate() {
        if (!this.isConnected) {
            this.showMessage('Por favor conecta Arweave.app primero', 'error');
            return;
        }

        const tallerista = document.getElementById('tallerista').value;
        const curso = document.getElementById('curso').value;
        const fecha = document.getElementById('fecha').value;

        if (!tallerista || !curso || !fecha) {
            this.showMessage('Por favor completa todos los campos', 'error');
            return;
        }

        try {
            this.showLoading('Generando certificado... Arweave.app pedirá confirmación');
            
            // 1. Generar PDF (simulado)
            const pdfBuffer = await this.generatePDFBuffer(tallerista, curso, fecha);
            
            // 2. Generar hash del PDF
            const pdfHash = await this.generateHash(pdfBuffer);
            
            // 3. Subir a Arweave usando Bundlr
            const result = await this.bundlrManager.uploadPDF(pdfBuffer, {
                tallerista,
                curso, 
                fecha,
                hash: pdfHash,
                emisor: 'Sistema-Certificados',
                version: '1.0.0'
            });

            // 4. Preparar datos para Sonic
            const sonicData = {
                hash: pdfHash,
                transaccionArweave: result.transactionId,
                nombreTallerista: tallerista,
                curso: curso,
                fechaEmision: fecha,
                urlArweave: result.url,
                timestamp: new Date().toISOString(),
                tamañoArchivo: result.size,
                wallet: 'Arweave.app',
                red: result.network
            };

            // 5. Guardar en Sonic (opcional - puedes implementarlo después)
            await this.guardarEnSonic(sonicData);

            // 6. Mostrar resultado
            this.showResult(result, pdfHash);
            this.hideLoading();

        } catch (error) {
            this.hideLoading();
            console.error('Error generando certificado:', error);
            this.showMessage('❌ Error: ' + error.message, 'error');
        }
    }

    async generatePDFBuffer(tallerista, curso, fecha) {
        // Simular contenido de PDF
        const pdfContent = `
            CERTIFICADO DE PARTICIPACIÓN
            =============================
            
            Otorgado a: ${tallerista}
            
            Por haber completado exitosamente el curso:
            "${curso}"
            
            Fecha de emisión: ${fecha}
            
            Este certificado ha sido almacenado permanentemente
            en la blockchain de Arweave usando Arweave.app.
            
            ID: ${Date.now()}
            Timestamp: ${new Date().toISOString()}
        `;
        
        return new TextEncoder().encode(pdfContent);
    }

    async generateHash(buffer) {
        // Generar hash SHA-256 del PDF
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    async guardarEnSonic(sonicData) {
        try {
            // Aquí iría tu llamada a la API de Sonic
            console.log('📊 Datos para Sonic:', sonicData);
            
            // Ejemplo de cómo sería la llamada (descomenta cuando tengas tu API)
            /*
            const response = await fetch('https://tu-api-sonic.com/certificados', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + 'tu-api-key'
                },
                body: JSON.stringify(sonicData)
            });
            
            if (!response.ok) {
                throw new Error('Error guardando en Sonic');
            }
            
            return await response.json();
            */
            
        } catch (error) {
            console.warn('⚠️ No se pudo guardar en Sonic:', error.message);
            // No lanzamos error para no interrumpir el flujo principal
        }
    }

    showResult(result, hash) {
        const resultSection = document.getElementById('result-section');
        const resultContent = document.getElementById('resultContent');
        
        resultContent.innerHTML = `
            <div class="result">
                <h3 class="success">✅ Certificado Creado Exitosamente</h3>
                <p><strong>🔐 Hash del PDF:</strong> ${hash}</p>
                <p><strong>📄 Transacción ID:</strong> ${result.transactionId}</p>
                <p><strong>🔗 URL permanente:</strong> 
                    <a href="${result.url}" target="_blank" style="color: var(--primary);">
                        Ver en Arweave
                    </a>
                </p>
                <p><strong>💰 Costo:</strong> ${result.cost} AR</p>
                <p><strong>👛 Wallet usada:</strong> ${result.wallet}</p>
                <p><strong>🌐 Red:</strong> ${result.network}</p>
                <p><strong>📏 Tamaño:</strong> ${result.size} bytes</p>
                <p><strong>📅 Fecha:</strong> ${new Date(result.timestamp).toLocaleString()}</p>
            </div>
        `;
        
        resultSection.classList.remove('hidden');
        
        // Limpiar formulario
        document.getElementById('certificateForm').reset();
    }

    showLoading(message) {
        document.getElementById('loadingMessage').textContent = message;
        document.getElementById('loading-section').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-section').classList.add('hidden');
    }

    showMessage(message, type) {
        // Crear mensaje temporal
        const alertDiv = document.createElement('div');
        alertDiv.className = type === 'error' ? 'error' : 'result';
        alertDiv.textContent = message;
        alertDiv.style.margin = '10px';
        alertDiv.style.padding = '10px';
        alertDiv.style.borderRadius = '5px';
        
        document.querySelector('.container').insertBefore(alertDiv, document.querySelector('.container').firstChild);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }
}

// Inicializar la aplicación cuando cargue la página
document.addEventListener('DOMContentLoaded', () => {
    new ArweaveAppCertificateApp();
});
