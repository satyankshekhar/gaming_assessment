const fs = require('fs');

function revert(file) {
    let code = fs.readFileSync(file, 'utf8');
    
    // START piece fake logic replacement
    const startRegex = /if \(inDir === -1\) \{\s*let possible = \[0,1,2,3\]\.filter\(d => d !== next\.outDir\);\s*let fakeInDir = possible\[Math\.floor\(Math\.random\(\) \* possible\.length\)\];\s*grid\[current\.r\]\[current\.c\]\.correctConnections\[fakeInDir\] = true;\s*grid\[current\.r\]\[current\.c\]\.flowStart = fakeInDir;\s*\} else \{\s*grid\[current\.r\]\[current\.c\]\.flowStart = inDir;\s*\}/;
    
    code = code.replace(startRegex, `if (inDir !== -1) grid[current.r][current.c].correctConnections[inDir] = true;\n                grid[current.r][current.c].flowStart = inDir;`);

    // TARGET piece fake logic replacement
    const targetRegex = /let possible = \[0,1,2,3\]\.filter\(d => d !== inDir\);\s*let fakeOutDir = possible\[Math\.floor\(Math\.random\(\) \* possible\.length\)\];\s*grid\[current\.r\]\[current\.c\]\.correctConnections\[fakeOutDir\] = true;\s*grid\[current\.r\]\[current\.c\]\.flowStart = inDir;\s*grid\[current\.r\]\[current\.c\]\.flowEnd = fakeOutDir;/;
    
    code = code.replace(targetRegex, `grid[current.r][current.c].correctConnections[inDir] = true;\n                grid[current.r][current.c].flowStart = inDir;\n                grid[current.r][current.c].flowEnd = -1;`);

    fs.writeFileSync(file, code);
}

revert('scripts/generatePathPuzzles.js');
revert('js/generators/pathGenerator.js');

