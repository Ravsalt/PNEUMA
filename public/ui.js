export class UIManager {
    constructor() {
        this.terminal = document.getElementById('terminal');
        this.inputLine = document.getElementById('input-line');
        this.playerInput = document.getElementById('player-input');
        this.startButton = document.getElementById('start-button');
        this.startScreen = document.getElementById('start-screen');
        this.timerDisplay = document.getElementById('timer-display');
        this.terminalHeader = document.getElementById('terminal-header');
        this.stabilityBar = document.getElementById('stability-bar');
        this.stabilityValue = document.getElementById('stability-value');
        this.headerTitle = document.querySelector('.header-title');
    }

    setupEventListeners(game) {
        this.startButton.addEventListener('click', () => game.startGame());
        this.playerInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !game.state.isTyping) {
                game.handlePlayerInput(this.playerInput.value);
                this.playerInput.value = '';
            }
        });
        this.terminal.addEventListener('click', () => this.playerInput.focus());
    }

    showLoading(message = 'Loading...') {
        // Create loading overlay if it doesn't exist
        let loadingOverlay = document.getElementById('loading-overlay');
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'loading-overlay';
            loadingOverlay.style.position = 'absolute';
            loadingOverlay.style.top = '0';
            loadingOverlay.style.left = '0';
            loadingOverlay.style.width = '100%';
            loadingOverlay.style.height = '100%';
            loadingOverlay.style.backgroundColor = 'rgba(10, 15, 20, 0.9)';
            loadingOverlay.style.display = 'flex';
            loadingOverlay.style.justifyContent = 'center';
            loadingOverlay.style.alignItems = 'center';
            loadingOverlay.style.zIndex = '1000';
            loadingOverlay.style.color = '#e2e8f0';
            loadingOverlay.style.fontSize = '1.2rem';
            loadingOverlay.style.fontFamily = 'JetBrains Mono, monospace';
            loadingOverlay.style.backdropFilter = 'blur(5px)';
            
            const spinner = document.createElement('div');
            spinner.style.border = '3px solid rgba(99, 102, 241, 0.3)';
            spinner.style.borderRadius = '50%';
            spinner.style.borderTop = '3px solid #6366f1';
            spinner.style.width = '30px';
            spinner.style.height = '30px';
            spinner.style.animation = 'spin 1s linear infinite';
            spinner.style.marginRight = '15px';
            
            const text = document.createElement('span');
            text.id = 'loading-text';
            text.textContent = message;
            
            loadingOverlay.appendChild(spinner);
            loadingOverlay.appendChild(text);
            document.body.appendChild(loadingOverlay);
            
            // Add spin animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        } else {
            loadingOverlay.style.display = 'flex';
            const text = loadingOverlay.querySelector('#loading-text');
            if (text) text.textContent = message;
        }
    }
    
    hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
    
    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.style.color = '#ef4444';
        errorElement.style.padding = '1rem';
        errorElement.style.margin = '1rem 0';
        errorElement.style.border = '1px solid #ef4444';
        errorElement.style.borderRadius = '4px';
        errorElement.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        
        // Add to terminal or appropriate container
        const terminal = document.getElementById('terminal');
        if (terminal) {
            terminal.appendChild(errorElement);
            // Auto-remove after 5 seconds
            setTimeout(() => {
                errorElement.style.opacity = '0';
                errorElement.style.transition = 'opacity 0.5s ease';
                setTimeout(() => errorElement.remove(), 500);
            }, 5000);
        }
    }

    showGameUI(subjectId) {
        this.startScreen.classList.add('hidden');
        this.inputLine.classList.remove('hidden');
        this.headerTitle.textContent = `PNEUMA.OS [v9.4.2] - SESSION: ${subjectId}`;
        this.playerInput.focus();
        this.terminal.innerHTML = '';
    }

    updateTimer(time) {
        const minutes = Math.floor(time / 60).toString().padStart(2, '0');
        const seconds = (time % 60).toString().padStart(2, '0');
        this.timerDisplay.textContent = `${minutes}:${seconds}`;
    }

    updateStability(value) {
        if (!this.stabilityBar || !this.stabilityValue) return;
        this.stabilityValue.textContent = `${value}%`;
        this.stabilityBar.style.width = `${value}%`;
    }

    async addMessage(text, options = {}) {
        const { type = 'system', delay = 0, isSystem = false, originalText = null } = options;
        if (delay) await this.sleep(delay);

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        if (originalText) {
            messageDiv.dataset.originalText = originalText;
        }

        const promptSpan = document.createElement('span');
        promptSpan.className = 'prompt';
        if (type === 'ai') {
            promptSpan.textContent = '[PNEUMA]';
        } else if (type === 'human') {
            promptSpan.textContent = '[YOU]';
        } else {
            promptSpan.textContent = '>';
        }
        messageDiv.appendChild(promptSpan);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        messageDiv.appendChild(contentDiv);
        this.terminal.appendChild(messageDiv);

        await this.typeText(contentDiv, text, isSystem || type === 'ai');

        this.terminal.scrollTop = this.terminal.scrollHeight;
        return messageDiv;
    }

    async typeText(element, text) {
        const cursor = document.createElement('span');
        cursor.className = 'typing-cursor';
        
        for (let i = 0; i < text.length; i++) {
            element.innerHTML = text.substring(0, i + 1);
            element.appendChild(cursor);
            this.terminal.scrollTop = this.terminal.scrollHeight;
            
            const delay = 15 + (Math.random() * 10 - 5);
            await this.sleep(delay);
        }
        
        cursor.remove();
    }

    toggleInput(enabled) {
        this.playerInput.disabled = !enabled;
        this.inputLine.style.opacity = enabled ? '1' : '0.5';
        if (enabled) {
            this.playerInput.focus();
        }
    }

    applyUIManipulation(commands) {
        const terminalContainer = document.getElementById('game-container');
        
        // Reset styles
        terminalContainer.style.filter = '';
        terminalContainer.classList.remove('glitch-active');

        if (commands.glitch) {
            terminalContainer.classList.add('glitch-active');
        }
        if (commands.blur) {
            terminalContainer.style.filter = `blur(${commands.blur}px)`;
        }
        if (commands.color) {
            document.documentElement.style.setProperty('--text-color', commands.color);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}