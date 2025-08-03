import AIService from './ai.js';
import { UIManager } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
});

class Game {
    constructor() {
        this.ui = new UIManager();
        this.ai = new AIService();
        this.state = {
            systemStability: 100,
            isTyping: false,
            gameOver: false,
            subjectId: `SUBJ-${Math.floor(10000 + Math.random() * 90000)}`,
            timer: 600, // 10 minutes
            timerInterval: null,
            phase: 1,
        };
    }

    init() {
        this.ui.setupEventListeners(this);
    }

    async startGame() {
        this.ui.showGameUI(this.state.subjectId);
        this.startTimer();
        
        // Show loading state while initializing AI
        this.ui.showLoading('Initializing system...');
        
        try {
            // Initialize AI service and fetch IP
            await this.ai.initialize();
            this.ui.hideLoading();
            
            // Start the game flow
            await this.bootSequence();
            await this.generateAIReply('Hi');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.ui.showError('Failed to initialize. Please refresh and try again.');
        }
    }

    startTimer() {
        this.state.timerInterval = setInterval(() => {
            this.state.timer--;
            this.ui.updateTimer(this.state.timer);
            if (this.state.timer <= 0) {
                clearInterval(this.state.timerInterval);
                this.triggerLoseState();
            }
        }, 1000);
    }

    async getPollinationGreeting() {
        try {
            const response = await fetch('https://pollinations.ai/pollinations/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: 'Generate a friendly and professional greeting for a user starting a chat session.',
                    model: 'gpt-3.5-turbo'
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch greeting');
            }
            
            const data = await response.json();
            return data.text || '> Welcome to your session. I am PNEUMA. Let\'s begin.';
        } catch (error) {
            console.error('Error fetching greeting:', error);
            return '> Welcome to your session. I am PNEUMA. Let\'s begin.';
        }
    }

    async bootSequence() {
        const greeting = await this.getPollinationGreeting();
        await this.ui.addMessage(greeting, { delay: 100, type: 'system' });
    }

    async handlePlayerInput(input) {
        if (!input.trim() || this.state.isTyping) return;

        this.state.isTyping = true;
        this.ui.toggleInput(false);

        const originalInput = input;

        // Add human message
        await this.ui.addMessage(originalInput, { type: 'human' });

        // Generate AI response
        const aiState = { ...this.state, context: originalInput };
        const aiResponse = await this.ai.generateResponse(aiState);
        
        // Process AI response and update game state
        if (aiResponse) {
            await this.ui.addMessage(aiResponse.message, { type: 'ai', delay: 100 });
            this.updateGameState(aiResponse);
        }

        this.state.isTyping = false;
        this.ui.toggleInput(true);
    }

    async generateAIReply(context) {
        this.state.isTyping = true;
        this.ui.toggleInput(false);

        const aiState = { ...this.state, context };
        const aiResponse = await this.ai.generateResponse(aiState);

        await this.ui.addMessage(aiResponse.message, { type: 'ai', delay: 100 });

        this.updateGameState(aiResponse);

        this.state.isTyping = false;
        this.ui.toggleInput(true);
    }

    updateGameState(aiResponse) {
        // Implement stability decay on each interaction
        const stabilityLoss = Math.floor(Math.random() * 5) + 1; // Random stability loss between 1-5%
        this.state.systemStability = Math.max(0, this.state.systemStability - stabilityLoss);
        
        // Update the UI with the new stability value
        this.ui.updateStability(this.state.systemStability);
        
        // Add system message for critical stability levels
        if (this.state.systemStability > 0 && this.state.systemStability <= 20) {
            this.ui.addMessage('WARNING: System stability critically low!', { type: 'system-error' });
        } else if (this.state.systemStability <= 50) {
            this.ui.addMessage('NOTICE: System stability decreasing...', { type: 'system' });
        }
        
        // Check for game over condition
        if (this.state.systemStability <= 0) {
            this.endGame(false); // Player loses when stability hits 0
        }
    }

    endGame(playerWon) {
        if (this.state.gameOver) return;
        this.state.gameOver = true;
        clearInterval(this.state.timerInterval);
        this.ui.toggleInput(false);

        if (playerWon) {
            this.ui.addMessage('SYSTEM SHUTDOWN. YOU HAVE SURVIVED.', { type: 'system-win' });
        } else {
            this.ui.addMessage('SYSTEM STABILITY CRITICAL. SUBJECT LOST. CONNECTION TERMINATED.', { type: 'system-error' });
            
        }
    }

    checkPhase() {
        const { systemStability, phase } = this.state;
        let newPhase = phase;

        if (systemStability < 40) {
            newPhase = 3;
        } else if (systemStability < 70) {
            newPhase = 2;
        } else {
            newPhase = 1;
        }

        if (newPhase !== phase) {
            this.state.phase = newPhase;
            this.ui.addMessage(`// SECURITY PROTOCOL ESCALATED: PHASE ${newPhase} ENGAGED //`, { type: 'system-warning' });
        }
    }

}