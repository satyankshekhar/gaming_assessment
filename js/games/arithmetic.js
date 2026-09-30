import { state } from '../state.js';
import { ArithmeticGenerator } from '../generators/arithmeticGenerator.js';
import { Timer } from '../timer.js';

export class ArithmeticGame {
    constructor(onEnd) {
        this.onEnd = onEnd;
        this.container = document.getElementById('arithmetic-bubbles');
        this.timeDisplay = document.getElementById('arithmetic-time');
        this.orderDisplay = document.getElementById('arithmetic-order');
        this.feedback = document.getElementById('arithmetic-feedback');
        this.scoreDisplay = document.getElementById('arithmetic-score');
        this.streakDisplay = document.getElementById('arithmetic-streak');
        
        this.totalQuestions = 25;
        this.timePerQuestion = state.difficulty === 'extreme' ? 9 : (state.difficulty === 'hard' ? 12 : 15);
        
        this.timer = null;
        this.gameState = 'menu';
        
        this._boundHandleKeyDown = this.handleKeyDown.bind(this);
        this._boundHandleBubbleClick = this.handleBubbleClick.bind(this);
    }

    start() {
        this.gameState = 'playing';
        this.currentQuestion = 0;
        this.correctSelections = 0;
        this.incorrectSelections = 0;
        this.totalTimeTaken = 0;
        this.timeouts = 0;
        this.score = 0;
        this.streak = 0;
        
        this.scoreDisplay.textContent = '0';
        this.streakDisplay.style.display = 'none';
        
        window.addEventListener('keydown', this._boundHandleKeyDown);
        this.nextQuestion();
    }
    
    nextQuestion() {
        if (this.gameState !== 'playing') return;
        this.currentQuestion++;
        if (this.currentQuestion > this.totalQuestions) {
            this.finishGame();
            return;
        }
        
        this.selectionIndex = 0;
        
        this.currentBubbles = ArithmeticGenerator.generate(state.difficulty);
        this.currentBubbles.sort(() => Math.random() - 0.5);
        this.sortedValues = [...this.currentBubbles].map(b => b.val).sort((a, b) => a - b);
        
        this.renderBubbles();
        this.renderOrderSlots();
        this.startTimer();
    }
    
    renderOrderSlots() {
        this.orderDisplay.innerHTML = '';
        for (let i = 0; i < this.currentBubbles.length; i++) {
            const slot = document.createElement('div');
            slot.className = 'order-slot';
            slot.textContent = i + 1;
            this.orderDisplay.appendChild(slot);
        }
    }
    
    renderBubbles() {
        this.container.innerHTML = '';
        this.currentBubbles.forEach((bubble, idx) => {
            const el = document.createElement('div');
            el.className = 'bubble';
            el.textContent = bubble.expr;
            el.dataset.idx = idx;
            el.dataset.val = bubble.val;
            el.addEventListener('click', this._boundHandleBubbleClick);
            this.container.appendChild(el);
        });
    }
    
    showFeedback(text, color) {
        this.feedback.textContent = text;
        this.feedback.style.color = color;
        this.feedback.classList.remove('show');
        void this.feedback.offsetWidth; // trigger reflow
        this.feedback.classList.add('show');
        setTimeout(() => this.feedback.classList.remove('show'), 800);
    }
    
    handleBubbleClick(e) {
        if (this.gameState !== 'playing' || state.isPaused) return;
        const el = e.currentTarget;
        if (el.classList.contains('disabled')) return;
        
        const val = parseFloat(el.dataset.val);
        const expectedVal = this.sortedValues[this.selectionIndex];
        
        if (val === expectedVal) {
            el.classList.add('disabled');
            this.orderDisplay.children[this.selectionIndex].classList.add('filled');
            this.orderDisplay.children[this.selectionIndex].textContent = '✓';
            
            this.correctSelections++;
            this.selectionIndex++;
            
            if (this.selectionIndex === this.sortedValues.length) {
                if (this.timer) this.timer.stop();
                this.totalTimeTaken += this.timer.getElapsedMs() / 1000;
                this.score += 50 + (this.streak * 10);
                this.streak++;
                
                this.scoreDisplay.textContent = this.score;
                if (this.streak > 1) {
                    this.streakDisplay.style.display = 'block';
                    this.streakDisplay.textContent = `🔥 ${this.streak}!`;
                }
                
                this.showFeedback('✨ +POINTS', 'var(--success)');
                import('../achievements.js').then(m => m.achievements.checkAchievements({ type: 'arithmetic_question' }));
                
                this.gameState = 'transition';
                setTimeout(() => {
                    if (this.gameState === 'transition') {
                        this.gameState = 'playing';
                        this.nextQuestion();
                    }
                }, 600);
            }
        } else {
            el.classList.add('incorrect');
            this.incorrectSelections++;
            this.streak = 0;
            this.streakDisplay.style.display = 'none';
            this.score = Math.max(0, this.score - 10);
            this.scoreDisplay.textContent = this.score;
            setTimeout(() => el.classList.remove('incorrect'), 400);
        }
    }
    
    startTimer() {
        if (this.timer) this.timer.stop();
        this.timer = new Timer(this.timePerQuestion, 
            (sec, prog) => {
                this.timeDisplay.textContent = (prog * this.timePerQuestion).toFixed(1);
                if (prog < 0.25) this.timeDisplay.parentElement.classList.add('warning');
                else this.timeDisplay.parentElement.classList.remove('warning');
            },
            () => {
                this.timeouts++;
                this.totalTimeTaken += this.timePerQuestion;
                this.streak = 0;
                this.streakDisplay.style.display = 'none';
                this.showFeedback("💥 TIME'S UP!", 'var(--secondary)');
                this.gameState = 'transition';
                setTimeout(() => {
                    if (this.gameState === 'transition') {
                        this.gameState = 'playing';
                        this.nextQuestion();
                    }
                }, 1000);
            }
        );
        this.timer.start();
    }
    
    handleKeyDown(e) {
        if (this.gameState !== 'playing' || state.isPaused) return;
        const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8, '0': 9 };
        if (e.key in keyMap) {
            const idx = keyMap[e.key];
            if (idx < this.container.children.length) {
                this.container.children[idx].click();
            }
        }
    }
    
    pause() { if (this.timer) this.timer.pause(); }
    resume() { if (this.timer) this.timer.resume(); }
    
    finishGame() {
        if (this.gameState === 'completed') return;
        this.gameState = 'completed';
        if (this.timer) this.timer.stop();
        
        const accuracy = this.correctSelections / (this.correctSelections + this.incorrectSelections) || 0;
        
        this.onEnd({
            game: 'arithmetic',
            difficulty: state.difficulty,
            score: this.score,
            accuracy: accuracy,
            averageResponseTime: this.totalTimeTaken / this.totalQuestions,
            correct: this.correctSelections,
            incorrect: this.incorrectSelections,
            timeouts: this.timeouts
        });
    }
    
    cleanup() {
        this.gameState = 'cleanup';
        window.removeEventListener('keydown', this._boundHandleKeyDown);
        if (this.timer) {
            this.timer.stop();
            this.timer = null;
        }
        this.container.innerHTML = '';
        this.orderDisplay.innerHTML = '';
        this.feedback.classList.remove('show');
    }
}
