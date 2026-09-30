export class MazeGenerator {
    static generate(difficulty) {
        const size = 3;
        let numKeys;
        let numWalls;
        let memoTime;
        
        switch(difficulty) {
            case 'extreme': numKeys = 3; numWalls = 4; memoTime = 5; break; 
            case 'hard': numKeys = 2; numWalls = 3; memoTime = 7; break;    
            case 'assessment':
            default: numKeys = 1; numWalls = 2; memoTime = 10; break;        
        }

        let grid = Array(size).fill(null).map(() => Array(size).fill(null).map(() => ({
            top: false, right: false, bottom: false, left: false
        })));
        
        // Setup border walls
        for (let i = 0; i < size; i++) {
            grid[0][i].top = true;
            grid[size-1][i].bottom = true;
            grid[i][0].left = true;
            grid[i][size-1].right = true;
        }

        // Generate all internal edges
        let edges = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (r < size - 1) edges.push({r1: r, c1: c, r2: r+1, c2: c, type: 'h'}); // horizontal divider
                if (c < size - 1) edges.push({r1: r, c1: c, r2: r, c2: c+1, type: 'v'}); // vertical divider
            }
        }
        
        // Shuffle edges
        edges.sort(() => Math.random() - 0.5);
        
        // Add walls ensuring connectivity
        let wallsAdded = 0;
        for (let edge of edges) {
            if (wallsAdded >= numWalls) break;
            
            // Try adding wall
            if (edge.type === 'h') {
                grid[edge.r1][edge.c1].bottom = true;
                grid[edge.r2][edge.c2].top = true;
            } else {
                grid[edge.r1][edge.c1].right = true;
                grid[edge.r2][edge.c2].left = true;
            }
            
            // Check connectivity
            if (!this.isConnected(grid, size)) {
                // Revert
                if (edge.type === 'h') {
                    grid[edge.r1][edge.c1].bottom = false;
                    grid[edge.r2][edge.c2].top = false;
                } else {
                    grid[edge.r1][edge.c1].right = false;
                    grid[edge.r2][edge.c2].left = false;
                }
            } else {
                wallsAdded++;
            }
        }
        
        let cells = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                cells.push({r, c});
            }
        }
        cells.sort(() => Math.random() - 0.5);
        
        const playerStart = cells.pop();
        const doorPos = cells.pop();
        
        const keys = [];
        for (let i = 0; i < numKeys; i++) {
            keys.push(cells.pop());
        }
        
        return { grid, size, playerStart, keys, doorPos, memoTime };
    }
    
    static isConnected(grid, size) {
        let visited = Array(size).fill(null).map(() => Array(size).fill(false));
        let queue = [{r: 0, c: 0}];
        visited[0][0] = true;
        let count = 1;
        
        while (queue.length > 0) {
            let {r, c} = queue.shift();
            let cell = grid[r][c];
            
            if (!cell.top && !visited[r-1][c]) { visited[r-1][c] = true; count++; queue.push({r: r-1, c}); }
            if (!cell.bottom && !visited[r+1][c]) { visited[r+1][c] = true; count++; queue.push({r: r+1, c}); }
            if (!cell.left && !visited[r][c-1]) { visited[r][c-1] = true; count++; queue.push({r, c: c-1}); }
            if (!cell.right && !visited[r][c+1]) { visited[r][c+1] = true; count++; queue.push({r, c: c+1}); }
        }
        
        return count === size * size;
    }
}
