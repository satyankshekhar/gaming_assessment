const fs = require('fs');
let code = fs.readFileSync('js/games/pathfinding.js', 'utf8');

const oldDraw = `        if (cell.currentFlowEnd !== -1) {
            const arrow = document.createElement('div');
            arrow.className = 'pipe-arrow';
            arrow.innerHTML = '➔';
            let rot = 0;
            if (cell.currentFlowEnd === 0) rot = -90;
            if (cell.currentFlowEnd === 1) rot = 0;
            if (cell.currentFlowEnd === 2) rot = 90;
            if (cell.currentFlowEnd === 3) rot = 180;
            arrow.style.transform = \`rotate(\${rot}deg)\`;
            el.appendChild(arrow);
        }`;

const newDraw = `        let arrowDir = -1;
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
            arrow.style.transform = \`rotate(\${rot}deg)\`;
            el.appendChild(arrow);
        }`;

code = code.replace(oldDraw, newDraw);
fs.writeFileSync('js/games/pathfinding.js', code);
