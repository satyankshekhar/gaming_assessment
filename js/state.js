export const state = {
    currentGame: null,
    difficulty: 'hard', // assessment, hard, extreme
    mode: 'practice', // practice, full
    isPaused: false,
    
    // For Full Assessment mode
    fullAssessmentQueue: [],
    fullAssessmentResults: [],
    
    setDifficulty(diff) { this.difficulty = diff; },
    setMode(m) { this.mode = m; },
    setCurrentGame(game) { this.currentGame = game; }
};
