const fs = require('fs');
let code = fs.readFileSync('js/games/pathfinding.js', 'utf8');

// Modify playerEl creation
code = code.replace(
`        this.playerEl = document.createElement('div');
        this.playerEl.innerHTML = '🏃';
        this.playerEl.style.position = 'absolute';
        this.playerEl.style.fontSize = '2.5rem';
        this.playerEl.style.transition = 'top 0.3s, left 0.3s, transform 0.3s';
        this.playerEl.style.zIndex = '10';
        this.playerEl.style.display = 'flex';
        this.playerEl.style.alignItems = 'center';
        this.playerEl.style.justifyContent = 'center';
        this.playerEl.style.width = '100px';
        this.playerEl.style.height = '100px'; 
        this.playerEl.style.pointerEvents = 'none';`,
`        this.playerEl = document.createElement('div');
        this.playerEl.innerHTML = '🏃';
        this.playerEl.style.position = 'absolute';
        this.playerEl.style.fontSize = '2rem';
        this.playerEl.style.transition = 'transform 0.4s linear';
        this.playerEl.style.zIndex = '10';
        this.playerEl.style.display = 'flex';
        this.playerEl.style.alignItems = 'center';
        this.playerEl.style.justifyContent = 'center';
        this.playerEl.style.width = '40px';
        this.playerEl.style.height = '40px'; 
        this.playerEl.style.top = '0';
        this.playerEl.style.left = '0';
        this.playerEl.style.pointerEvents = 'none';
        this.playerEl.style.transformOrigin = 'center center';`
);

// Modify updatePlayerVisuals
code = code.replace(
`    updatePlayerVisuals(r, c) {
        if (this.gameState === 'cleanup' || !this.container.children.length) return;
        const cell = this.getCell(r, c);
        if (!cell) return;
        const rect = cell.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        this.playerEl.style.width = \`\${rect.width}px\`;
        this.playerEl.style.height = \`\${rect.height}px\`;
        this.playerEl.style.top = \`\${rect.top - containerRect.top}px\`;
        this.playerEl.style.left = \`\${rect.left - containerRect.left}px\`;
    }`,
`    updatePlayerVisuals(r, c, extraScale = 1) {
        if (this.gameState === 'cleanup' || !this.container.children.length) return;
        const cell = this.getCell(r, c);
        if (!cell) return;
        const rect = cell.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        const cx = rect.left - containerRect.left + rect.width / 2;
        const cy = rect.top - containerRect.top + rect.height / 2;
        
        this.playerEl.style.transform = \`translate(\${cx - 20}px, \${cy - 20}px) scale(\${extraScale})\`;
    }`
);

// Modify handleWin animation loop
code = code.replace(
`        for (let i = 1; i < pathSequence.length; i++) {
            const step = pathSequence[i];
            this.updatePlayerVisuals(step.r, step.c);
            await new Promise(r => setTimeout(r, 300));
            if (this.gameState === 'cleanup') return;
        }`,
`        for (let i = 1; i < pathSequence.length; i++) {
            const step = pathSequence[i];
            this.updatePlayerVisuals(step.r, step.c);
            await new Promise(r => setTimeout(r, 400)); // wait exactly the transition time
            if (this.gameState === 'cleanup') return;
        }`
);

// Modify the scale part
code = code.replace(
`        this.playerEl.innerHTML = '🎉';
        this.playerEl.style.transform = 'scale(1.5) translateY(-10px)';`,
`        this.playerEl.innerHTML = '🎉';
        const last = pathSequence[pathSequence.length - 1];
        this.updatePlayerVisuals(last.r, last.c, 1.5);`
);

fs.writeFileSync('js/games/pathfinding.js', code);
