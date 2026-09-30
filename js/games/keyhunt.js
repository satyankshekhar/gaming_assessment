import { state } from '../state.js';
import { MazeGenerator } from '../generators/mazeGenerator.js';
import { Timer } from '../timer.js';

export class KeyHuntGame {
    constructor(onEnd) {
        this.onEnd = onEnd;
        this.container = document.getElementById('keyhunt-grid');
        this.timeDisplay = document.getElementById('keyhunt-time');
        this.keysDisplay = document.getElementById('keyhunt-keys');
        
        let timeMin = state.difficulty === 'extreme' ? 1.75 : (state.difficulty === 'hard' ? 3 : 5);
        this.timeLimit = timeMin * 60;
        
        this.mazeData = null;
        this.timer = null;
        this.gameState = 'menu';
        this.playerPos = { r: 0, c: 0 };
        this.keysCollected = 0;
        this.totalKeys = 0;
        
        this.wallHits = 0;
        this.moves = 0;
        
        this._boundHandleKeyDown = this.handleKeyDown.bind(this);
        this._boundResize = this.updatePlayerVisuals.bind(this);
    }
    
    start() {
        this.gameState = 'playing';
        this.mazeData = MazeGenerator.generate(state.difficulty);
        this.totalKeys = this.mazeData.keys.length;
        this.keysCollected = 0;
        this.wallHits = 0;
        this.moves = 0;
        
        this.playerPos = { ...this.mazeData.playerStart };
        this.keysDisplay.textContent = `0/${this.totalKeys}`;
        
        this.renderMaze();
        window.addEventListener('keydown', this._boundHandleKeyDown);
        window.addEventListener('resize', this._boundResize);
        
        this.startTimer();
    }
    
    renderMaze() {
        this.container.innerHTML = '';
        this.container.style.gridTemplateColumns = `repeat(${this.mazeData.size}, 1fr)`;
        this.container.style.gridTemplateRows = `repeat(${this.mazeData.size}, 1fr)`;
        
        for (let r = 0; r < this.mazeData.size; r++) {
            for (let c = 0; c < this.mazeData.size; c++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell kh-cell';
                cell.dataset.r = r;
                cell.dataset.c = c;
                
                // Border walls are visually drawn, but internal hidden walls are explicitly NOT drawn here
                if (r === 0) cell.style.borderTop = '4px solid #475569';
                if (r === this.mazeData.size - 1) cell.style.borderBottom = '4px solid #475569';
                if (c === 0) cell.style.borderLeft = '4px solid #475569';
                if (c === this.mazeData.size - 1) cell.style.borderRight = '4px solid #475569';
                
                this.container.appendChild(cell);
            }
        }
        
        // Add Keys
        this.mazeData.keys.forEach(k => {
            k.collected = false;
            const el = document.createElement('div');
            el.className = 'kh-key';
            el.innerHTML = '🔑';
            this.getCell(k.r, k.c).appendChild(el);
            k.el = el;
        });
        
        // Add Door
        this.doorEl = document.createElement('div');
        this.doorEl.className = 'kh-door';
        this.doorEl.innerHTML = '🔒';
        this.getCell(this.mazeData.doorPos.r, this.mazeData.doorPos.c).appendChild(this.doorEl);
        
        // Add player
        this.playerEl = document.createElement('div');
        this.playerEl.className = 'kh-player';
        this.playerEl.innerHTML = '🧙';
        this.updatePlayerVisuals();
        this.container.appendChild(this.playerEl);
    }
    
    getCell(r, c) {
        return this.container.children[r * this.mazeData.size + c];
    }
    
    updatePlayerVisuals() {
        if (this.gameState === 'cleanup' || !this.container.children.length) return;
        const cell = this.getCell(this.playerPos.r, this.playerPos.c);
        if (!cell) return;
        const rect = cell.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        this.playerEl.style.top = `${rect.top - containerRect.top + (rect.height - 60) / 2}px`;
        this.playerEl.style.left = `${rect.left - containerRect.left + (rect.width - 60) / 2}px`;
    }
    
    handleKeyDown(e) {
        if (this.gameState !== 'playing' || state.isPaused) return;
        
        let nr = this.playerPos.r;
        let nc = this.playerPos.c;
        let dir = '';
        
        if (e.key === 'ArrowUp' || e.key === 'w') { nr--; dir = 'top'; }
        else if (e.key === 'ArrowDown' || e.key === 's') { nr++; dir = 'bottom'; }
        else if (e.key === 'ArrowLeft' || e.key === 'a') { nc--; dir = 'left'; }
        else if (e.key === 'ArrowRight' || e.key === 'd') { nc++; dir = 'right'; }
        else return;
        
        e.preventDefault();
        
        // Boundary checks
        if (nr < 0 || nr >= this.mazeData.size || nc < 0 || nc >= this.mazeData.size) return;
        
        this.moves++;
        
        // Wall check
        const cellWalls = this.mazeData.grid[this.playerPos.r][this.playerPos.c];
        if (cellWalls[dir]) {
            this.handleWallHit(this.playerPos.r, this.playerPos.c, dir);
            return;
        }
        
        // Move successful
        this.playerPos.r = nr;
        this.playerPos.c = nc;
        this.updatePlayerVisuals();
        this.checkCollisions();
    }
    
    handleWallHit(r, c, dir) {
        if (this.gameState !== 'playing') return;
        
        this.wallHits++;
        this.gameState = 'transition';
        
        const cell = this.getCell(r, c);
        const wallClass = `wall-${dir}`;
        
        // Flash wall red
        cell.classList.add('hit-wall', wallClass);
        
        const feedback = document.getElementById('keyhunt-feedback');
        feedback.textContent = '💥 WALL HIT!';
        feedback.style.color = 'var(--secondary)';
        feedback.classList.remove('show');
        void feedback.offsetWidth;
        feedback.classList.add('show');
        
        // Shake player
        this.playerEl.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            if (this.gameState === 'cleanup') return;
            cell.classList.remove('hit-wall');
            feedback.classList.remove('show');
            
            // Reset to start
            this.playerPos = { ...this.mazeData.playerStart };
            this.playerEl.style.transform = 'scale(1)';
            this.updatePlayerVisuals();
            this.gameState = 'playing';
        }, 800);
    }
    
    checkCollisions() {
        const { keys, doorPos } = this.mazeData;
        const feedback = document.getElementById('keyhunt-feedback');
        
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (k.r === this.playerPos.r && k.c === this.playerPos.c && !k.collected) {
                k.collected = true;
                k.el.style.display = 'none';
                this.keysCollected++;
                this.keysDisplay.textContent = `${this.keysCollected}/${this.totalKeys}`;
                
                feedback.textContent = '+1 KEY!';
                feedback.style.color = 'var(--warning)';
                feedback.classList.remove('show');
                void feedback.offsetWidth;
                feedback.classList.add('show');
                setTimeout(() => feedback.classList.remove('show'), 600);
                
                import('../achievements.js').then(m => m.achievements.checkAchievements({ type: 'keys_collected', count: 1 }));
                
                if (this.keysCollected === this.totalKeys) {
                    this.doorEl.classList.add('unlocked');
                    this.doorEl.innerHTML = '🚪';
                    setTimeout(() => {
                        feedback.textContent = '🔓 DOOR UNLOCKED!';
                        feedback.style.color = 'var(--success)';
                        feedback.classList.remove('show');
                        void feedback.offsetWidth;
                        feedback.classList.add('show');
                        setTimeout(() => feedback.classList.remove('show'), 1000);
                    }, 600);
                }
            }
        }
        
        if (this.playerPos.r === doorPos.r && this.playerPos.c === doorPos.c) {
            if (this.keysCollected === this.totalKeys) {
                this.gameState = 'transition';
                if (this.timer) this.timer.stop();
                feedback.textContent = '🎉 ESCAPED!';
                feedback.style.color = 'var(--primary)';
                feedback.classList.remove('show');
                void feedback.offsetWidth;
                feedback.classList.add('show');
                setTimeout(() => this.finishGame(true), 1500);
            }
        }
    }
    
    startTimer() {
        if (this.timer) this.timer.stop();
        this.timer = new Timer(this.timeLimit, 
            (sec, prog) => {
                this.timeDisplay.textContent = sec;
                if (prog < 0.2) this.timeDisplay.parentElement.classList.add('warning');
                else this.timeDisplay.parentElement.classList.remove('warning');
            },
            () => {
                this.gameState = 'transition';
                const feedback = document.getElementById('keyhunt-feedback');
                feedback.textContent = '⏰ Time\'s up!';
                feedback.style.color = 'var(--secondary)';
                feedback.classList.remove('show');
                void feedback.offsetWidth;
                feedback.classList.add('show');
                setTimeout(() => this.finishGame(false), 1500);
            }
        );
        this.timer.start();
    }
    
    pause() { if (this.timer) this.timer.pause(); }
    resume() { if (this.timer) this.timer.resume(); }
    
    finishGame(success) {
        if (this.gameState === 'completed') return;
        this.gameState = 'completed';
        if (this.timer) this.timer.stop();
        
        let score = 0;
        let timeTaken = this.timeLimit - (this.timer ? this.timer.timeLeft : 0);
        
        if (success) {
            score = 500;
            score += Math.max(0, 1000 - (timeTaken * 3));
            score -= (this.wallHits * 50);
            score -= (this.moves * 2);
            score = Math.max(0, Math.floor(score));
        }
        
        this.onEnd({
            game: 'keyhunt',
            success,
            score,
            completionTime: timeTaken,
            wallHits: this.wallHits,
            moves: this.moves,
            keysCollected: this.keysCollected,
            totalKeys: this.totalKeys,
            pathEfficiency: this.wallHits > 0 ? (1 / (this.wallHits + 1)) : 1
        });
    }
    
    cleanup() {
        this.gameState = 'cleanup';
        window.removeEventListener('keydown', this._boundHandleKeyDown);
        window.removeEventListener('resize', this._boundResize);
        if (this.timer) {
            this.timer.stop();
            this.timer = null;
        }
        this.container.innerHTML = '';
        const feedback = document.getElementById('keyhunt-feedback');
        if (feedback) feedback.classList.remove('show');
    }
}
