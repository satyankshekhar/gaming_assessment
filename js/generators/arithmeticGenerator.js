export class ArithmeticGenerator {
    static generate(difficulty) {
        const numBubbles = 3;
        let operations, maxVal, targetRange, allowNegative;
        
        switch(difficulty) {
            case 'extreme':
                operations = ['+', '-', '*', '/', 'mixed'];
                maxVal = 150;
                targetRange = 5; // Very tight clustering of answers
                allowNegative = true;
                break;
            case 'hard':
                operations = ['+', '-', '*', '/'];
                maxVal = 80;
                targetRange = 15; // Moderate clustering
                allowNegative = false;
                break;
            case 'assessment':
            default:
                operations = ['+', '-', '*', '/'];
                maxVal = 40;
                targetRange = 40; // Loose clustering
                allowNegative = false;
                break;
        }

        const bubbles = [];
        let targetBase = Math.floor(Math.random() * maxVal) + (allowNegative ? -20 : 10);

        for (let i = 0; i < numBubbles; i++) {
            let expr = '';
            let val = 0;
            const op = operations[Math.floor(Math.random() * operations.length)];
            
            // Randomly cluster results around targetBase
            let targetVal = targetBase + Math.floor(Math.random() * targetRange - targetRange / 2);
            if (!allowNegative && targetVal < 0) targetVal = Math.abs(targetVal) + 5;
            
            if (op === '+') {
                const a = Math.floor(Math.random() * maxVal) + 1;
                const b = targetVal - a;
                if (!allowNegative && b < 0) {
                    val = a + Math.abs(b);
                    expr = `${a} + ${Math.abs(b)}`;
                } else {
                    val = a + b;
                    expr = `${a} + ${b}`;
                }
            } else if (op === '-') {
                const b = Math.floor(Math.random() * maxVal) + 1;
                const a = targetVal + b;
                val = a - b;
                expr = `${a} - ${b}`;
            } else if (op === '*') {
                let a = Math.floor(Math.random() * 12) + 2; // Keep multipliers reasonable
                let b = Math.max(1, Math.round(targetVal / a));
                val = a * b;
                expr = `${a} × ${b}`;
            } else if (op === '/') {
                const b = Math.floor(Math.random() * 12) + 2;
                const a = targetVal * b;
                val = a / b;
                expr = `${a} ÷ ${b}`;
            } else if (op === 'mixed') {
                const a = Math.floor(Math.random() * 10) + 2;
                const b = Math.floor(Math.random() * 10) + 2;
                const c = targetVal - (a * b);
                
                if (c < 0) {
                    val = a * b - Math.abs(c);
                    expr = `${a} × ${b} - ${Math.abs(c)}`;
                } else {
                    val = a * b + c;
                    expr = `${a} × ${b} + ${c}`;
                }
            }
            
            bubbles.push({ expr, val, id: i });
        }
        
        return bubbles;
    }
}
