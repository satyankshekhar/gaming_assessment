const fs = require('fs');

function generatePuzzle(targetLength, decoys) {
    const rows = 3;
    const cols = 3;
    let grid, start, target, pathCells;
    
    while (true) {
        grid = Array(rows).fill(null).map(() => Array(cols).fill(null).map(() => ({
            type: 'empty', 
            correctConnections: [false, false, false, false],
            currentConnections: [false, false, false, false],
            flowStart: -1,
            flowEnd: -1,
            isStart: false, 
            isTarget: false
        })));
        
        start = { r: Math.floor(Math.random() * rows), c: Math.floor(Math.random() * cols) };
        let current = { ...start };
        pathCells = [{...current}];
        let visited = Array(rows).fill(null).map(() => Array(cols).fill(false));
        visited[current.r][current.c] = true;
        
        const dirs = [[-1,0],[0,1],[1,0],[0,-1]];
        let inDir = -1; 
        
        while (pathCells.length < 9) {
            let validNeighbors = [];
            for (let d = 0; d < 4; d++) {
                let nr = current.r + dirs[d][0], nc = current.c + dirs[d][1];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
                    validNeighbors.push({ r: nr, c: nc, outDir: d, nextInDir: (d + 2) % 4 });
                }
            }
            if (validNeighbors.length === 0) break;
            
            let next = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
            
            grid[current.r][current.c].correctConnections[next.outDir] = true;
            grid[next.r][next.c].correctConnections[next.nextInDir] = true;
            
            if (inDir === -1) {
                // This is START. Give it a fake inDir so it forms a normal pipe piece.
                let possible = [0,1,2,3].filter(d => d !== next.outDir);
                let fakeInDir = possible[Math.floor(Math.random() * possible.length)];
                grid[current.r][current.c].correctConnections[fakeInDir] = true;
                grid[current.r][current.c].flowStart = fakeInDir;
            } else {
                grid[current.r][current.c].flowStart = inDir;
            }
            
            grid[current.r][current.c].flowEnd = next.outDir;
            
            inDir = next.nextInDir;
            current = { r: next.r, c: next.c };
            visited[current.r][current.c] = true;
            pathCells.push({...current});
            
            if (pathCells.length >= targetLength && Math.random() > 0.5) break;
        }
        if (pathCells.length >= targetLength) {
            target = { ...current };
            // TARGET. Give it a fake outDir.
            grid[current.r][current.c].correctConnections[inDir] = true;
                grid[current.r][current.c].flowStart = inDir;
                grid[current.r][current.c].flowEnd = -1;
            break;
        }
    }
    
    for (let i = 0; i < pathCells.length; i++) {
        let p = pathCells[i];
        grid[p.r][p.c].type = 'path';
        if (i === 0) grid[p.r][p.c].isStart = true;
        if (i === pathCells.length - 1) grid[p.r][p.c].isTarget = true;
    }
    
    let emptyCells = [];
    for (let r=0; r<rows; r++) {
        for (let c=0; c<cols; c++) {
            if (grid[r][c].type === 'empty') emptyCells.push({r, c});
        }
    }
    emptyCells.sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < decoys && i < emptyCells.length; i++) {
        let ec = emptyCells[i];
        grid[ec.r][ec.c].type = 'path'; 
        let shapes = [
            { conn: [true, false, true, false], fS: 0, fE: 2 }, 
            { conn: [true, true, false, false], fS: 0, fE: 1 }  
        ];
        let shape = shapes[Math.floor(Math.random() * shapes.length)];
        grid[ec.r][ec.c].correctConnections = [...shape.conn];
        grid[ec.r][ec.c].flowStart = shape.fS;
        grid[ec.r][ec.c].flowEnd = shape.fE;
    }
    
    const rotateArray = (arr, times) => {
        let res = [...arr];
        for (let i = 0; i < times; i++) res.unshift(res.pop());
        return res;
    };
    
    for (let r=0; r<rows; r++) {
        for (let c=0; c<cols; c++) {
            if (grid[r][c].type === 'path') {
                let rot = Math.floor(Math.random() * 4);
                while (rot === 0 && Math.random() > 0.2) rot = Math.floor(Math.random() * 4);
                grid[r][c].currentConnections = rotateArray(grid[r][c].correctConnections, rot);
                grid[r][c].currentFlowStart = (grid[r][c].flowStart + rot) % 4;
                grid[r][c].currentFlowEnd = (grid[r][c].flowEnd + rot) % 4;
                
                if (Math.random() > 0.5) {
                    let temp = grid[r][c].currentFlowStart;
                    grid[r][c].currentFlowStart = grid[r][c].currentFlowEnd;
                    grid[r][c].currentFlowEnd = temp;
                }
                grid[r][c].rotation = rot;
            }
        }
    }
    
    return { grid, rows, cols, start, target, difficultyScore: pathCells.length + decoys * 2 };
}

let puzzles = [];
for (let i=0; i<5; i++) puzzles.push(generatePuzzle(3, 1)); 
for (let i=0; i<5; i++) puzzles.push(generatePuzzle(4, 2)); 
for (let i=0; i<5; i++) puzzles.push(generatePuzzle(5, 3)); 
for (let i=0; i<5; i++) puzzles.push(generatePuzzle(6, 4)); 
for (let i=0; i<5; i++) puzzles.push(generatePuzzle(7, 4)); 
for (let i=0; i<3; i++) puzzles.push(generatePuzzle(8, 4)); 
for (let i=0; i<2; i++) puzzles.push(generatePuzzle(9, 0)); 

fs.writeFileSync('js/data/pathAssessment.js', 'export const ASSESSMENT_PUZZLES = ' + JSON.stringify(puzzles, null, 2) + ';');
console.log('Generated 30 pipe puzzles with flows!');
