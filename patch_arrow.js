const fs = require('fs');
let code = fs.readFileSync('js/games/pathfinding.js', 'utf8');

code = code.replace(
    'arrow.style.transform = `rotate(${rot}deg)`;',
    'arrow.style.transform = `rotate(${rot}deg) translateX(18px)`;'
);

fs.writeFileSync('js/games/pathfinding.js', code);
