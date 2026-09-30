import { storage } from './storage.js';

export const achievements = {
    list: [
        { id: 'calculator', name: '🧮 Calculator', desc: 'Complete 10 arithmetic questions.', target: 10, type: 'arithmetic_questions' },
        { id: 'speed_demon', name: '⚡ Speed Demon', desc: 'Solve an arithmetic question very quickly.', target: 1, type: 'speed_demon' },
        { id: 'maze_master', name: '🧩 Maze Master', desc: 'Solve 10 Path Finder puzzles.', target: 10, type: 'pathfinder_puzzles' },
        { id: 'treasure_hunter', name: '🔑 Treasure Hunter', desc: 'Collect 50 keys.', target: 50, type: 'keys_collected' },
        { id: 'on_fire', name: '🔥 On Fire', desc: 'Get 10 correct questions consecutively.', target: 10, type: 'streak' },
        { id: 'brain_champion', name: '🏆 Brain Champion', desc: 'Complete a Full Assessment.', target: 1, type: 'full_assessment' }
    ],

    checkAchievements(stats) {
        const unlocked = storage.getUnlockedAchievements();
        const newlyUnlocked = [];
        const progress = storage.getAchievementProgress();

        // Update progress based on stats passed in
        if (stats.type === 'arithmetic_question') progress.arithmetic_questions = (progress.arithmetic_questions || 0) + 1;
        if (stats.type === 'speed_demon') progress.speed_demon = 1;
        if (stats.type === 'pathfinder_puzzle') progress.pathfinder_puzzles = (progress.pathfinder_puzzles || 0) + 1;
        if (stats.type === 'keys_collected') progress.keys_collected = (progress.keys_collected || 0) + stats.count;
        if (stats.type === 'streak' && stats.count > (progress.streak || 0)) progress.streak = stats.count;
        if (stats.type === 'full_assessment') progress.full_assessment = 1;

        storage.saveAchievementProgress(progress);

        this.list.forEach(a => {
            if (!unlocked.includes(a.id) && (progress[a.type] || 0) >= a.target) {
                unlocked.push(a.id);
                newlyUnlocked.push(a);
            }
        });

        if (newlyUnlocked.length > 0) {
            storage.saveUnlockedAchievements(unlocked);
            this.showAchievementNotification(newlyUnlocked[0]); // Show the first newly unlocked one
        }
    },

    showAchievementNotification(achievement) {
        const notif = document.createElement('div');
        notif.className = 'achievement-notification';
        notif.innerHTML = `
            <div class="ach-icon">${achievement.name.split(' ')[0]}</div>
            <div class="ach-text">
                <div class="ach-title">Achievement Unlocked!</div>
                <div class="ach-name">${achievement.name.substring(achievement.name.indexOf(' ') + 1)}</div>
            </div>
        `;
        document.body.appendChild(notif);
        setTimeout(() => notif.classList.add('show'), 10);
        setTimeout(() => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 500);
        }, 3000);
    }
};
