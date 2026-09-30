export const storage = {
    saveResult(result) {
        result.timestamp = Date.now();
        const history = this.getHistory();
        history.push(result);
        localStorage.setItem('assessment_history', JSON.stringify(history));
    },
    getHistory() {
        const data = localStorage.getItem('assessment_history');
        return data ? JSON.parse(data) : [];
    },
    clearHistory() {
        localStorage.removeItem('assessment_history');
        localStorage.removeItem('assessment_xp');
        localStorage.removeItem('assessment_achievements');
        localStorage.removeItem('assessment_ach_progress');
    },
    addXP(amount) {
        let xp = this.getXP();
        xp += amount;
        localStorage.setItem('assessment_xp', xp.toString());
        return xp;
    },
    getXP() {
        return parseInt(localStorage.getItem('assessment_xp') || '0', 10);
    },
    getUnlockedAchievements() {
        return JSON.parse(localStorage.getItem('assessment_achievements') || '[]');
    },
    saveUnlockedAchievements(list) {
        localStorage.setItem('assessment_achievements', JSON.stringify(list));
    },
    getAchievementProgress() {
        return JSON.parse(localStorage.getItem('assessment_ach_progress') || '{}');
    },
    saveAchievementProgress(progress) {
        localStorage.setItem('assessment_ach_progress', JSON.stringify(progress));
    }
};
