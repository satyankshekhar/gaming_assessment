import { state } from '../state.js';
import { PathGenerator } from '../generators/pathGenerator.js';
import { Timer } from '../timer.js';

export class PathfindingGame {
    constructor(onEnd) {
        this.onEnd = onEnd;
        this.container = document.getElementById('pathfinding-grid');
        this.timeDisplay = document.getElementById('pathfinding-time');
        this.rotationsDisplay = document.getElementById('pathfinding-rotations');
        this.feedback = document.getElementById('pathfinding-feedback');
        
        this.submitBtn = document.getElementById('btn-pathfinding-submit');
        this.dirBtn = document.getElementById('btn-pathfinding-dir');
        this.rotateBtn = document.getElementById('btn-pathfinding-rotate');
        
        this.baseTimeLimit = 300; 
        this.gameState = 'menu';
        this.selectedCell = null; this.updateButtonStates();
        
        this._boundHandleClick = this.handleTileClick.bind(this);
        this._boundHandleContext = this.handleTileContext.bind(this);
        this._boundHandleSubmit = this.handleSubmitClick.bind(this);
        this._boundHandleDir = this.handleDirClick.bind(this);
        this._boundHandleRotate = this.handleRotateClick.bind(this);
        
        if (this.submitBtn) this.submitBtn.addEventListener('click', this._boundHandleSubmit);
        if (this.dirBtn) this.dirBtn.addEventListener('click', this._boundHandleDir);
        if (this.rotateBtn) this.rotateBtn.addEventListener('click', this._boundHandleRotate);
    }
    
    async loadAssessmentPuzzles() {
        if (!this.assessmentPuzzles) {
            const module = await import('../data/pathAssessment.js');
            this.assessmentPuzzles = module.ASSESSMENT_PUZZLES;
        }
    }
    
    async start() {
        this.gameState = 'loading';
        
        if (state.mode === 'full') {
            await this.loadAssessmentPuzzles();
            if (this.gameState === 'cleanup') return; 
            this.gameState = 'playing';
            this.currentPuzzleIndex = 0;
            this.totalPuzzles = 30;
            
            this.stats = {
                totalTime: 0, fastest: Infinity, slowest: 0,
                totalChanges: 0, invalidMoves: 0, failedAttempts: 0, puzzlesCompleted: 0
            };
            
            this.startNextPuzzle();
        } else {
            this.gameState = 'playing';
            this.currentPuzzleIndex = 0;
            this.totalPuzzles = 1;
            this.stats = { totalTime: 0, totalChanges: 0, invalidMoves: 0, failedAttempts: 0, puzzlesCompleted: 0 };
            
            this.gridData = PathGenerator.generate(state.difficulty);
            this.setupPuzzle();
        }
    }
    
    startNextPuzzle() {
        if (this.currentPuzzleIndex >= this.totalPuzzles) {
            this.finishAssessment();
            return;
        }
        this.gridData = JSON.parse(JSON.stringify(this.assessmentPuzzles[this.currentPuzzleIndex]));
        this.setupPuzzle();
    }
    
    setupPuzzle() {
        this.puzzleRotations = 0;
        this.rotationsDisplay.textContent = '0';
        this.selectedCell = null;
        
        if (state.mode === 'full') {
            this.feedback.textContent = `Puzzle ${this.currentPuzzleIndex + 1} / 30`;
            this.feedback.style.color = 'var(--text)';
            this.feedback.classList.add('show');
            setTimeout(() => { if (this.gameState === 'playing') this.feedback.classList.remove('show'); }, 1500);
        }
        
        this.renderGrid();
        
        if (this.timer) this.timer.stop();
        this.timer = new Timer(this.baseTimeLimit, 
            (sec, prog) => {
                this.timeDisplay.textContent = sec;
                if (prog < 0.2) this.timeDisplay.parentElement.classList.add('warning');
                else this.timeDisplay.parentElement.classList.remove('warning');
            },
            () => this.handleTimeout()
        );
        this.timer.start();
        this.gameState = 'playing';
    }
    
    renderGrid() {
        this.container.innerHTML = '';
        this.container.style.gridTemplateColumns = `repeat(${this.gridData.cols}, 1fr)`;
        this.container.style.gridTemplateRows = `repeat(${this.gridData.rows}, 1fr)`;
        
        for (let r = 0; r < this.gridData.rows; r++) {
            for (let c = 0; c < this.gridData.cols; c++) {
                const cell = this.gridData.grid[r][c];
                const el = document.createElement('div');
                el.className = 'grid-cell pf-cell';
                el.dataset.r = r;
                el.dataset.c = c;
                
                if (cell.type === 'empty') {
                    el.style.backgroundColor = 'transparent';
                    el.style.border = '1px solid rgba(0,0,0,0.05)';
                    el.style.boxShadow = 'none';
                } else {
                    el.style.backgroundColor = '#F8FAFC';
                    el.style.border = '2px solid #E2E8F0';
                    el.style.cursor = 'pointer';
                    
                    this.drawPipeVisuals(el, cell);
                    
                    el.addEventListener('click', this._boundHandleClick);
                    // we remove right click to avoid confusion, keep it simple
                    // el.addEventListener('contextmenu', this._boundHandleContext);
                    
                    if (cell.isStart) {
                        const b = document.createElement('div');
                        b.className = 'pf-start-badge';
                        b.textContent = '🟢 START';
                        el.appendChild(b);
                    }
                    if (cell.isTarget) {
                        const b = document.createElement('div');
                        b.className = 'pf-target-badge';
                        b.textContent = '🏁 TARGET';
                        el.appendChild(b);
                    }
                }
                this.container.appendChild(el);
            }
        }
        
        this.playerEl = document.createElement('div');
        this.playerEl.innerHTML = '🏃';
        this.playerEl.style.position = 'absolute';
        this.playerEl.style.fontSize = '1.6rem';
        this.playerEl.style.transition = 'transform 0.4s linear';
        this.playerEl.style.zIndex = '10';
        this.playerEl.style.display = 'flex';
        this.playerEl.style.alignItems = 'center';
        this.playerEl.style.justifyContent = 'center';
        this.playerEl.style.width = '30px';
        this.playerEl.style.height = '30px'; 
        this.playerEl.style.top = '0';
        this.playerEl.style.left = '0';
        this.playerEl.style.pointerEvents = 'none';
        this.playerEl.style.transformOrigin = 'center center';
        
        this.container.appendChild(this.playerEl);
        this.updatePlayerVisuals(this.gridData.start.r, this.gridData.start.c);
    }
    
    getCell(r, c) {
        return this.container.children[r * this.gridData.cols + c];
    }
    
    updatePlayerVisuals(r, c, extraScale = 1) {
        if (this.gameState === 'cleanup' || !this.container.children.length) return;
        const cell = this.getCell(r, c);
        if (!cell) return;
        const rect = cell.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        const cx = rect.left - containerRect.left + rect.width / 2;
        const cy = rect.top - containerRect.top + rect.height / 2;
        
        this.playerEl.style.transform = `translate(${cx - 15}px, ${cy - 15}px) scale(${extraScale})`;
    }
    
    drawPipeVisuals(el, cell) {
        Array.from(el.children).forEach(child => {
            if (child.classList.contains('pipe-arm') || child.classList.contains('pipe-center') || child.classList.contains('pipe-arrow')) {
                child.remove();
            }
        });
        
        const center = document.createElement('div');
        center.className = 'pipe-center';
        el.appendChild(center);
        
        const classes = ['top', 'right', 'bottom', 'left'];
        for (let i=0; i<4; i++) {
            if (cell.currentConnections[i]) {
                const arm = document.createElement('div');
                arm.className = `pipe-arm ${classes[i]}`;
                el.appendChild(arm);
            }
        }
        
        let arrowDir = -1;
        if (cell.currentFlowEnd !== -1) {
            arrowDir = cell.currentFlowEnd;
        } else if (cell.currentFlowStart !== -1) {
            arrowDir = (cell.currentFlowStart + 2) % 4;
        }
        
        if (arrowDir !== -1) {
            const arrow = document.createElement('div');
            arrow.className = 'pipe-arrow';
            arrow.innerHTML = '➔';
            let rot = 0;
            if (arrowDir === 0) rot = -90;
            if (arrowDir === 1) rot = 0;
            if (arrowDir === 2) rot = 90;
            if (arrowDir === 3) rot = 180;
            arrow.style.transform = `rotate(${rot}deg) translateX(22px)`;
            el.appendChild(arrow);
        }
    }
    
    updateButtonStates() {
        if (!this.selectedCell) {
            if (this.rotateBtn) this.rotateBtn.disabled = true;
            if (this.dirBtn) this.dirBtn.disabled = true;
        } else {
            if (this.rotateBtn) this.rotateBtn.disabled = false;
            if (this.dirBtn) this.dirBtn.disabled = false;
        }
    }

    handleTileClick(e) {
        if (this.gameState !== 'playing' || state.isPaused) return;
        const el = e.currentTarget;
        const r = parseInt(el.dataset.r);
        const c = parseInt(el.dataset.c);
        
        const cellData = this.gridData.grid[r][c];
        if (cellData.type !== 'path') return; // Do not select empty cells
        
        if (this.selectedCell) {
            this.getCell(this.selectedCell.r, this.selectedCell.c).classList.remove('selected');
        }
        this.selectedCell = {r, c};
        el.classList.add('selected');
        this.updateButtonStates();
    }
    
    handleTileContext(e) {
        e.preventDefault();
        // Disabled context menu rotation as per instructions (buttons only)
    }
    
    handleDirClick() {
        if (this.gameState !== 'playing' || state.isPaused || !this.selectedCell) return;
        
        const r = this.selectedCell.r;
        const c = this.selectedCell.c;
        const cell = this.gridData.grid[r][c];
        
        if (cell.type !== 'path') return;
        
        // Change ONLY direction
        let temp = cell.currentFlowStart;
        cell.currentFlowStart = cell.currentFlowEnd;
        cell.currentFlowEnd = temp;
        
        this.drawPipeVisuals(this.getCell(r, c), cell);
        
        this.stats.totalChanges++;
    }
    
    handleRotateClick() {
        if (this.gameState !== 'playing' || state.isPaused || !this.selectedCell) return;
        
        const r = this.selectedCell.r;
        const c = this.selectedCell.c;
        const cell = this.gridData.grid[r][c];
        
        if (cell.type !== 'path') return;
        
        // Rotate geometry AND direction
        cell.currentConnections.unshift(cell.currentConnections.pop());
        cell.currentFlowStart = cell.currentFlowStart !== -1 ? (cell.currentFlowStart + 1) % 4 : -1;
        cell.currentFlowEnd = cell.currentFlowEnd !== -1 ? (cell.currentFlowEnd + 1) % 4 : -1;
        
        this.drawPipeVisuals(this.getCell(r, c), cell);
        
        this.puzzleRotations++;
        this.stats.totalChanges++;
        this.rotationsDisplay.textContent = this.puzzleRotations;
    }
    
    handleSubmitClick() {
        if (this.gameState !== 'playing' || state.isPaused) return;
        
        let pathSequence = this.findValidPath();
        
        if (pathSequence) {
            this.handleWin(pathSequence);
        } else {
            this.handleInvalidSubmit();
        }
    }
    
    findValidPath() {
        const rows = this.gridData.rows;
        const cols = this.gridData.cols;
        const dirs = [[-1,0],[0,1],[1,0],[0,-1]]; 
        
        let q = [[{r: this.gridData.start.r, c: this.gridData.start.c}]];
        let visited = Array(rows).fill(null).map(()=>Array(cols).fill(false));
        visited[this.gridData.start.r][this.gridData.start.c] = true;
        
        while (q.length > 0) {
            let path = q.shift();
            let curr = path[path.length - 1];
            
            if (this.gridData.grid[curr.r][curr.c].isTarget) {
                return path; 
            }
            
            let cell = this.gridData.grid[curr.r][curr.c];
            
            if (cell.currentFlowEnd !== -1) {
                let d = cell.currentFlowEnd;
                let nr = curr.r + dirs[d][0];
                let nc = curr.c + dirs[d][1];
                let inDir = (d + 2) % 4;
                
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
                    let ncell = this.gridData.grid[nr][nc];
                    // The next cell MUST receive the flow through its currentFlowStart
                    if (ncell.type === 'path' && ncell.currentConnections[inDir] && ncell.currentFlowStart === inDir) {
                        visited[nr][nc] = true;
                        q.push([...path, {r: nr, c: nc}]);
                    }
                }
            }
        }
        return null;
    }
    
    handleInvalidSubmit() {
        this.stats.failedAttempts++;
        
        this.feedback.textContent = '❌ Invalid route! Check physical connections and arrow directions.';
        this.feedback.style.color = 'var(--secondary)';
        this.feedback.classList.add('show');
        setTimeout(() => {
            if (this.gameState === 'playing') this.feedback.classList.remove('show');
        }, 2500);
    }
    
    async handleWin(pathSequence) {
        this.gameState = 'transition';
        if (this.timer) this.timer.stop();
        
        this.feedback.classList.remove('show');
        
        if (this.selectedCell) {
            this.getCell(this.selectedCell.r, this.selectedCell.c).classList.remove('selected');
        }
        
        for (let i = 1; i < pathSequence.length; i++) {
            const step = pathSequence[i];
            this.updatePlayerVisuals(step.r, step.c);
            await new Promise(r => setTimeout(r, 400)); // wait exactly the transition time
            if (this.gameState === 'cleanup') return;
        }
        
        let timeTaken = this.baseTimeLimit - this.timer.timeLeft;
        this.stats.totalTime += timeTaken;
        this.stats.fastest = Math.min(this.stats.fastest, timeTaken);
        this.stats.slowest = Math.max(this.stats.slowest, timeTaken);
        this.stats.puzzlesCompleted++;
        
        this.playerEl.innerHTML = '🎉';
        const last = pathSequence[pathSequence.length - 1];
        this.updatePlayerVisuals(last.r, last.c, 1.5);
        
        if (state.mode === 'full') {
            this.feedback.textContent = '🎉 Nice!';
            this.feedback.style.color = 'var(--primary)';
            this.feedback.classList.add('show');
            
            this.currentPuzzleIndex++;
            setTimeout(() => {
                if (this.gameState !== 'cleanup') {
                    this.feedback.classList.remove('show');
                    this.startNextPuzzle();
                }
            }, 1500);
        } else {
            this.feedback.textContent = '🎉 PATH COMPLETE!';
            this.feedback.style.color = 'var(--primary)';
            this.feedback.classList.add('show');
            setTimeout(() => this.finishPracticeGame(true, timeTaken), 1500);
        }
    }
    
    handleTimeout() {
        this.gameState = 'transition';
        this.feedback.textContent = "⏰ TIME'S UP!";
        this.feedback.style.color = 'var(--secondary)';
        this.feedback.classList.add('show');
        
        if (state.mode === 'full') {
            this.stats.totalTime += this.baseTimeLimit;
            this.currentPuzzleIndex++;
            setTimeout(() => {
                if (this.gameState !== 'cleanup') {
                    this.feedback.classList.remove('show');
                    this.startNextPuzzle();
                }
            }, 1500);
        } else {
            setTimeout(() => this.finishPracticeGame(false, this.baseTimeLimit), 1500);
        }
    }
    
    finishAssessment() {
        this.gameState = 'completed';
        if (this.timer) this.timer.stop();
        
        this.onEnd({
            game: 'pathfinding_assessment',
            stats: this.stats,
            totalPuzzles: this.totalPuzzles
        });
    }
    
    finishPracticeGame(success, timeTaken) {
        if (this.gameState === 'completed') return;
        this.gameState = 'completed';
        if (this.timer) this.timer.stop();
        
        let score = 0;
        if (success) {
            score = 500;
            score += Math.max(0, 1000 - (timeTaken * 3));
            score -= (this.puzzleRotations * 5);
            score -= (this.stats.failedAttempts * 20);
            score = Math.max(0, Math.floor(score));
        }
        
        this.onEnd({
            game: 'pathfinding',
            success,
            score,
            completionTime: timeTaken,
            rotations: this.puzzleRotations,
            failedAttempts: this.stats.failedAttempts,
            moves: 0 
        });
    }
    
    pause() { if (this.timer) this.timer.pause(); }
    resume() { if (this.timer) this.timer.resume(); }
    
    cleanup() {
        this.gameState = 'cleanup';
        if (this.submitBtn) this.submitBtn.removeEventListener('click', this._boundHandleSubmit);
        if (this.dirBtn) this.dirBtn.removeEventListener('click', this._boundHandleDir);
        if (this.rotateBtn) this.rotateBtn.removeEventListener('click', this._boundHandleRotate);
        
        if (this.timer) {
            this.timer.stop();
            this.timer = null;
        }
        this.container.innerHTML = '';
        this.feedback.classList.remove('show');
    }
}
