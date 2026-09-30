import { state } from './state.js';
import { storage } from './storage.js';
import { ArithmeticGame } from './games/arithmetic.js';
import { PathfindingGame } from './games/pathfinding.js';
import { KeyHuntGame } from './games/keyhunt.js';
import { achievements } from './achievements.js';

const views = document.querySelectorAll('.view');
const difficultySelects = document.querySelectorAll('input[name="diff"]');
const modeSelects = document.querySelectorAll('input[name="mode"]');
const btnHome = document.getElementById('btn-home');
const btnResultsHome = document.getElementById('btn-results-home');
const btnResultsRetry = document.getElementById('btn-results-retry');
const btnResultsNext = document.getElementById('btn-results-next');
const startButtons = document.querySelectorAll('.btn-start');
const startFullButton = document.getElementById('btn-start-full');
const pauseOverlay = document.getElementById('pause-overlay');
const btnResume = document.getElementById('btn-resume');
const btnQuit = document.getElementById('btn-quit');

let currentGameInstance = null;
let currentStreak = 0;

function showScreen(screenId) {
    views.forEach(v => {
        if (v.id === screenId) {
            v.classList.add('active');
            v.style.pointerEvents = 'auto';
        } else {
            v.classList.remove('active');
            v.style.pointerEvents = 'none';
        }
    });
    btnHome.style.display = screenId === 'view-dashboard' ? 'none' : 'block';
}

function updateModeDisplay() {
    const diffGroup = document.getElementById('difficulty-control-group');
    const infoGroup = document.getElementById('assessment-info');
    
    if (state.mode === 'full') {
        document.querySelectorAll('.game-card').forEach(c => c.style.display = 'none');
        startFullButton.style.display = 'inline-block';
        
        diffGroup.style.display = 'none';
        infoGroup.style.display = 'flex';
        
        // Clear selected practice difficulty visually, but keep 'assessment' default internally
        document.querySelectorAll("input[name=\"diff\"]").forEach(r => r.checked = false);
        state.setDifficulty('assessment');
    } else {
        document.querySelectorAll('.game-card').forEach(c => c.style.display = 'flex');
        startFullButton.style.display = 'none';
        
        diffGroup.style.display = 'flex';
        infoGroup.style.display = 'none';
        
        // Restore default practice difficulty if switching back
        const diffInputs = document.querySelectorAll('input[name="diff"]');
        let selectedDiff = 'hard';
        diffInputs.forEach(r => { if (r.checked) selectedDiff = r.value; });
        
        // If it was somehow blank, force 'hard'
        if (!Array.from(diffInputs).some(r => r.checked)) {
            document.querySelector('input[name="diff"][value="hard"]').checked = true;
            selectedDiff = 'hard';
        }
        state.setDifficulty(selectedDiff);
    }
}

difficultySelects.forEach(radio => {
    radio.addEventListener('change', (e) => {
        document.querySelectorAll("input[name=\"diff\"]").forEach(r => r.checked = false);
        state.setDifficulty(e.target.value);
    });
});

modeSelects.forEach(radio => {
    radio.addEventListener('change', (e) => {
        state.setMode(e.target.value);
        updateModeDisplay();
    });
});

startButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const gameId = e.target.dataset.game;
        startGame(gameId);
    });
});

startFullButton.addEventListener('click', () => {
    startFullAssessment();
});

function goHome() {
    if (currentGameInstance) {
        currentGameInstance.cleanup();
        currentGameInstance = null;
    }
    state.mode = 'practice';
    document.querySelector('input[name="mode"][value="practice"]').checked = true;
    updateModeDisplay();
    updateDashboardStats();
    showScreen('view-dashboard');
}

btnHome.addEventListener('click', goHome);
btnResultsHome.addEventListener('click', goHome);

// Global Keyboard
window.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') {
        if (currentGameInstance && state.mode !== 'full') {
            togglePause();
        }
    }
});

btnResume.addEventListener('click', () => togglePause());
btnQuit.addEventListener('click', () => {
    togglePause();
    goHome();
});

document.querySelectorAll('.btn-pause').forEach(btn => {
    btn.addEventListener('click', () => {
        if (state.mode !== 'full') togglePause();
    });
});

function togglePause() {
    state.isPaused = !state.isPaused;
    if (state.isPaused) {
        pauseOverlay.style.display = 'flex';
        if (currentGameInstance) currentGameInstance.pause();
    } else {
        pauseOverlay.style.display = 'none';
        if (currentGameInstance) currentGameInstance.resume();
    }
}

function startGame(gameId) {
    state.setCurrentGame(gameId);
    showScreen(`view-${gameId}`);
    
    if (gameId === 'arithmetic') currentGameInstance = new ArithmeticGame(endGame);
    if (gameId === 'pathfinding') currentGameInstance = new PathfindingGame(endGame);
    if (gameId === 'keyhunt') currentGameInstance = new KeyHuntGame(endGame);
    
    currentGameInstance.start();
}

function startFullAssessment() {
    state.setMode('full');
    state.setDifficulty('assessment');
    state.fullAssessmentResults = [];
    startGame('pathfinding');
}

function endGame(result) {
    if (currentGameInstance) {
        currentGameInstance.cleanup();
        currentGameInstance = null;
    }
    
    // Process result for achievements and streaks
    if (result.score > 0) {
        currentStreak++;
        achievements.checkAchievements({ type: 'streak', count: currentStreak });
    } else {
        currentStreak = 0;
    }
    result.streak = currentStreak;
    
    // Grant XP
    let xpGained = Math.floor(result.score / 10);
    if (xpGained > 0) {
        storage.addXP(xpGained);
    }

    if (result.game === 'arithmetic' && result.averageResponseTime < 3 && result.score > 0) {
        achievements.checkAchievements({ type: 'speed_demon' });
    }

    if (state.mode === 'full') {
        state.fullAssessmentResults.push(result);
        showFullAssessmentResults(result);
    } else {
        storage.saveResult(result);
        showResults(result, xpGained);
    }
}

function showResults(result, xpGained) {
    showScreen('view-results');
    
    const title = document.getElementById('results-title');
    const stars = document.getElementById('results-stars');
    const mainScore = document.getElementById('results-main-score');
    const bar1 = document.getElementById('results-bar-1');
    const bar2 = document.getElementById('results-bar-2');
    
    btnResultsRetry.style.display = 'inline-block';
    btnResultsNext.style.display = 'none';

    mainScore.textContent = result.score;
    
    let starCount = 1;
    if (result.score > 500) starCount = 2;
    if (result.score > 800) starCount = 3;
    if (result.score === 0) starCount = 0;
    
    stars.textContent = '⭐'.repeat(starCount) || '😅';
    
    if (result.game === 'arithmetic') {
        title.textContent = '🎉 ARITHMETIC COMPLETE!';
        let acc = Math.round(result.accuracy * 100) || 0;
        bar1.innerHTML = `<div class="bar-label"><span>🎯 Accuracy</span><span>${acc}%</span></div>
                          <div class="bar-bg"><div class="bar-fill" style="width: ${acc}%"></div></div>
                          <div style="font-size:0.9em; margin-top:4px;">Correct: ${result.correct} / ${result.correct + result.incorrect} | 🔥 Streak: ${result.streak || 0}</div>`;
        
        let speed = Math.max(0, 100 - (result.averageResponseTime * 5));
        bar2.innerHTML = `<div class="bar-label"><span>⚡ Speed</span><span>${result.averageResponseTime.toFixed(1)}s avg</span></div>
                          <div class="bar-bg"><div class="bar-fill" style="width: ${speed}%"></div></div>`;
    } else if (result.game === 'pathfinding') {
        title.textContent = '🧩 PATH COMPLETE!';
        let eff = result.rotations > 0 ? Math.min(100, Math.round((5 / result.rotations) * 100)) : 100;
        bar1.innerHTML = `<div class="bar-label"><span>🔄 Efficiency</span><span>${eff}%</span></div>
                          <div class="bar-bg"><div class="bar-fill" style="width: ${eff}%"></div></div>
                          <div style="font-size:0.9em; margin-top:4px;">Rotations: ${result.rotations} | Moves: ${result.moves} | Fails: ${result.failedAttempts}</div>`;
        
        let speed = Math.max(0, 100 - (result.completionTime / 2));
        bar2.innerHTML = `<div class="bar-label"><span>⏱️ Time</span><span>${result.completionTime.toFixed(1)}s</span></div>
                          <div class="bar-bg"><div class="bar-fill" style="width: ${speed}%"></div></div>`;
    } else if (result.game === 'keyhunt') {
        title.textContent = '🔑 KEY HUNT COMPLETE!';
        let movesEff = Math.max(0, 100 - (result.moves));
        bar1.innerHTML = `<div class="bar-label"><span>🗺️ Navigation</span><span>${result.moves} Moves</span></div>
                          <div class="bar-bg"><div class="bar-fill" style="width: ${movesEff}%"></div></div>
                          <div style="font-size:0.9em; margin-top:4px;">Wall Hits: ${result.wallHits} | Keys: ${result.keysCollected} / ${result.totalKeys}</div>`;
        
        let speed = Math.max(0, 100 - (result.completionTime / 2));
        bar2.innerHTML = `<div class="bar-label"><span>⏱️ Time</span><span>${result.completionTime.toFixed(1)}s</span></div>
                          <div class="bar-bg"><div class="bar-fill" style="width: ${speed}%"></div></div>`;
    }
    
    btnResultsRetry.textContent = '🔄 PLAY AGAIN';
    btnResultsRetry.onclick = () => {
        btnResultsRetry.onclick = null; // Prevent double click
        startGame(state.currentGame);
    };
}

function showFullAssessmentResults(result) {
    showScreen('view-results');
    achievements.checkAchievements({ type: 'full_assessment' });
    
    const title = document.getElementById('results-title');
    const stars = document.getElementById('results-stars');
    const mainScore = document.getElementById('results-main-score');
    const bar1 = document.getElementById('results-bar-1');
    const bar2 = document.getElementById('results-bar-2');
    
    title.textContent = '🎊 PATH FINDER ASSESSMENT';
    stars.textContent = '🏆🏆🏆';
    
    const stats = result.stats;
    const avgTime = stats.puzzlesCompleted > 0 ? (stats.totalTime / stats.puzzlesCompleted).toFixed(1) : 0;
    const avgChanges = stats.puzzlesCompleted > 0 ? (stats.totalChanges / stats.puzzlesCompleted).toFixed(1) : 0;
    const accuracy = ((stats.puzzlesCompleted / result.totalPuzzles) * 100).toFixed(1);
    
    // We don't have a specific main score for the assessment in the prompt, so just show puzzles completed
    mainScore.textContent = `${stats.puzzlesCompleted} / ${result.totalPuzzles}`;
    
    bar1.innerHTML = `
        <div style="font-size: 1rem; text-align: center; margin-bottom: 10px;"><b>${accuracy}% Completion Rate</b></div>
        <div style="font-size: 0.9rem; margin-bottom: 15px; border-bottom: 1px solid #E2E8F0; padding-bottom: 10px;">
            <div>Total Time: ${stats.totalTime.toFixed(1)}s</div>
            <div>Average Time: ${avgTime}s</div>
            <div>Fastest Puzzle: ${stats.fastest === Infinity ? 0 : stats.fastest.toFixed(1)}s</div>
            <div>Slowest Puzzle: ${stats.slowest.toFixed(1)}s</div>
        </div>
        <div style="font-size: 0.9rem; margin-bottom: 15px; border-bottom: 1px solid #E2E8F0; padding-bottom: 10px;">
            <div>Total Direction Changes: ${stats.totalChanges}</div>
            <div>Average Direction Changes: ${avgChanges}</div>
        </div>
        <div style="font-size: 0.9rem; margin-bottom: 15px; border-bottom: 1px solid #E2E8F0; padding-bottom: 10px;">
            <div>Invalid Moves: ${stats.invalidMoves}</div>
            <div>Failed Attempts: ${stats.failedAttempts}</div>
        </div>
    `;
    
    bar2.innerHTML = `
        <div style="font-size: 0.9rem; text-align: left;">
            <div style="margin-bottom: 5px;"><b>Progression:</b></div>
            <div>Puzzle 1 ➔ Easy</div>
            <div>Puzzle 10 ➔ Moderate</div>
            <div>Puzzle 20 ➔ Hard</div>
            <div>Puzzle 25 ➔ Very Hard</div>
            <div>Puzzle 30 ➔ Extreme</div>
        </div>
    `;
    
    btnResultsRetry.style.display = 'inline-block';
    btnResultsRetry.textContent = '🔄 RETAKE ASSESSMENT';
    btnResultsRetry.onclick = () => {
        btnResultsRetry.textContent = '🔄 PLAY AGAIN'; 
        btnResultsRetry.onclick = null;
        startFullAssessment();
    };
}

function updateDashboardStats() {
    const history = storage.getHistory();
    const xp = storage.getXP();
    
    document.getElementById('xp-text').textContent = `${xp} XP`;
    // Simple level calculation (1000 XP per level visually)
    const xpProgress = (xp % 1000) / 1000 * 100;
    document.getElementById('xp-bar').style.width = `${xpProgress}%`;

    let bestScore = 0;
    let bestStreak = 0;
    
    let bestAr = 0, bestPf = 0, bestKh = 0;

    history.forEach(h => {
        if (h.score > bestScore) bestScore = h.score;
        if (h.streak > bestStreak) bestStreak = h.streak;
        
        if (h.game === 'arithmetic' && h.score > bestAr) bestAr = h.score;
        if (h.game === 'pathfinding' && h.score > bestPf) bestPf = h.score;
        if (h.game === 'keyhunt' && h.score > bestKh) bestKh = h.score;
    });

    document.getElementById('stat-best-score').textContent = bestScore;
    document.getElementById('stat-current-streak').textContent = currentStreak;
    document.getElementById('stat-best-streak').textContent = bestStreak;
    
    document.getElementById('best-arithmetic').textContent = `Best: ${bestAr}`;
    document.getElementById('best-pathfinding').textContent = `Best: ${bestPf}`;
    document.getElementById('best-keyhunt').textContent = `Best: ${bestKh}`;
}

document.getElementById('btn-clear-history').addEventListener('click', () => {
    storage.clearHistory();
    currentStreak = 0;
    updateDashboardStats();
});

// Initialize
updateModeDisplay();
updateDashboardStats();
