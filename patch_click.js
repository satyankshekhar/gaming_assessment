const fs = require('fs');
let code = fs.readFileSync('js/games/pathfinding.js', 'utf8');

const oldClick = `    handleTileClick(e) {
        if (this.gameState !== 'playing' || state.isPaused) return;
        const el = e.currentTarget;
        const r = parseInt(el.dataset.r);
        const c = parseInt(el.dataset.c);
        
        if (this.selectedCell) {
            this.getCell(this.selectedCell.r, this.selectedCell.c).classList.remove('selected');
        }
        this.selectedCell = {r, c};
        el.classList.add('selected');
    }`;

const newClick = `    updateButtonStates() {
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
    }`;

code = code.replace(oldClick, newClick);
code = code.replace(`this.selectedCell = null;`, `this.selectedCell = null; this.updateButtonStates();`);
fs.writeFileSync('js/games/pathfinding.js', code);
