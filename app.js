// ===================================
// DATABASE & STORAGE LAYER
// ===================================

class StorageManager {
    constructor() {
        this.dbName = 'DevQuestsDB';
        this.dbVersion = 1;
        this.db = null;
        this.storeName = 'appState';
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.warn('IndexedDB failed, falling back to localStorage');
                resolve(false);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(true);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id' });
                }
            };
        });
    }

    async saveData(data) {
        // Try IndexedDB first
        if (this.db) {
            try {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                await store.put({ id: 'main', ...data });
            } catch (error) {
                console.warn('IndexedDB save failed, using localStorage', error);
            }
        }
        
        // Always save to localStorage as backup
        try {
            localStorage.setItem('devQuests_data', JSON.stringify(data));
        } catch (error) {
            console.error('localStorage save failed', error);
        }
    }

    async loadData() {
        // Try IndexedDB first
        if (this.db) {
            try {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get('main');
                
                return new Promise((resolve) => {
                    request.onsuccess = () => {
                        const result = request.result;
                        if (result) {
                            delete result.id; // Remove the id key
                            resolve(result);
                        } else {
                            resolve(null);
                        }
                    };
                    request.onerror = () => resolve(null);
                });
            } catch (error) {
                console.warn('IndexedDB load failed, using localStorage', error);
            }
        }
        
        // Fallback to localStorage
        try {
            const data = localStorage.getItem('devQuests_data');
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('localStorage load failed', error);
            return null;
        }
    }
}

// ===================================
// CONSTANTS & UTILITIES
// ===================================

const BASE_XP = 100;

const calculateLevel = (xp) => Math.floor(Math.sqrt(xp / BASE_XP)) + 1;
const xpForNextLevel = (level) => Math.pow(level, 2) * BASE_XP;

const getTodayString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getDayOfWeek = () => new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

// Daily motivational quotes
const QUOTES = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
    { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
    { text: "Experience is the name everyone gives to their mistakes.", author: "Oscar Wilde" },
    { text: "In order to be irreplaceable, one must always be different.", author: "Coco Chanel" },
    { text: "The best error message is the one that never shows up.", author: "Thomas Fuchs" },
    { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
    { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
    { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" },
    { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" }
];

// Quest Templates
const DAILY_QUESTS_TEMPLATE = [
    { 
        id: 'leetcode', 
        title: 'Solve LeetCode Problems', 
        type: 'counter', 
        max: 5, 
        xpPer: 15, 
        icon: 'code', 
        desc: 'Keep those algorithms sharp. 1-5 questions.' 
    },
    { 
        id: 'commit', 
        title: 'Make a GitHub Commit', 
        type: 'boolean', 
        xpPer: 25, 
        icon: 'git-commit', 
        desc: 'Push some code to keep the streak alive.' 
    },
    { 
        id: 'article', 
        title: 'Read Tech Docs/Article', 
        type: 'boolean', 
        xpPer: 20, 
        icon: 'book-open', 
        desc: 'Learn something new today.' 
    }
];

const PITCH_QUEST = { 
    id: 'pitch', 
    title: 'Pitch a Local Business', 
    type: 'boolean', 
    xpPer: 50, 
    icon: 'briefcase', 
    desc: 'Reach out and offer to build a website.' 
};

// Achievement Definitions
const ACHIEVEMENTS = [
    { id: 'first_quest', name: 'Getting Started', desc: 'Complete your first quest', emoji: '🎯', condition: (state) => state.totalCompleted >= 1 },
    { id: 'level_5', name: 'Rising Developer', desc: 'Reach level 5', emoji: '⭐', condition: (state) => calculateLevel(state.xp) >= 5 },
    { id: 'level_10', name: 'Expert Coder', desc: 'Reach level 10', emoji: '💎', condition: (state) => calculateLevel(state.xp) >= 10 },
    { id: 'streak_7', name: 'Week Warrior', desc: '7 day streak', emoji: '🔥', condition: (state) => state.currentStreak >= 7 },
    { id: 'streak_30', name: 'Monthly Master', desc: '30 day streak', emoji: '⚡', condition: (state) => state.currentStreak >= 30 },
    { id: 'complete_10', name: 'Quest Hunter', desc: 'Complete 10 quests', emoji: '🏹', condition: (state) => state.totalCompleted >= 10 },
    { id: 'complete_50', name: 'Quest Veteran', desc: 'Complete 50 quests', emoji: '🛡️', condition: (state) => state.totalCompleted >= 50 },
    { id: 'complete_100', name: 'Quest Master', desc: 'Complete 100 quests', emoji: '👑', condition: (state) => state.totalCompleted >= 100 },
    { id: 'first_goal', name: 'Goal Setter', desc: 'Complete your first long-term goal', emoji: '🎪', condition: (state) => state.goalsCompleted >= 1 },
    { id: 'custom_quest', name: 'Self Driven', desc: 'Create a custom quest', emoji: '✨', condition: (state) => state.customQuests.length > 0 }
];

// ===================================
// APP STATE MANAGER
// ===================================

class AppState {
    constructor() {
        this.storage = new StorageManager();
        this.state = this.getDefaultState();
        this.listeners = [];
    }

    getDefaultState() {
        return {
            xp: 0,
            totalCompleted: 0,
            goalsCompleted: 0,
            lastDate: '',
            dailies: {},
            goals: [],
            customQuests: [],
            history: {},
            unlockedAchievements: [],
            currentStreak: 0
        };
    }

    async init() {
        await this.storage.init();
        const savedState = await this.storage.loadData();
        
        if (savedState) {
            this.state = { ...this.getDefaultState(), ...savedState };
        }
        
        // Daily reset logic
        const today = getTodayString();
        if (this.state.lastDate !== today) {
            this.state.lastDate = today;
            this.state.dailies = {};
            
            // Initialize history for today
            if (!this.state.history[today]) {
                this.state.history[today] = 0;
            }
            
            // Update streak
            this.updateStreak();
        }
        
        await this.save();
        this.notify();
    }

    updateStreak() {
        let count = 0;
        const d = new Date();
        
        while (true) {
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            
            if (this.state.history[dateStr] && this.state.history[dateStr] > 0) {
                count++;
                d.setDate(d.getDate() - 1);
            } else {
                // Allow missing today without breaking streak
                if (count === 0 && dateStr === getTodayString()) {
                    d.setDate(d.getDate() - 1);
                    continue;
                }
                break;
            }
        }
        
        this.state.currentStreak = count;
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    async save() {
        await this.storage.saveData(this.state);
    }

    updateDailyProgress(questId, change, xpGain, type = 'counter', max = 1) {
        const today = getTodayString();
        const currentProgress = this.state.dailies[questId] || 0;
        let newProgress;
        let actualXpGain = 0;
        let completedInc = 0;

        if (type === 'boolean') {
            newProgress = change ? 1 : 0;
            if (newProgress === 1 && currentProgress === 0) {
                actualXpGain = xpGain;
                completedInc = 1;
            } else if (newProgress === 0 && currentProgress === 1) {
                actualXpGain = -xpGain;
                completedInc = -1;
            }
        } else {
            newProgress = Math.max(0, Math.min(max, currentProgress + change));
            const diff = newProgress - currentProgress;
            actualXpGain = diff * xpGain;
            if (newProgress === max && currentProgress < max) completedInc = 1;
            if (newProgress < max && currentProgress === max) completedInc = -1;
        }

        const oldLevel = calculateLevel(this.state.xp);
        
        this.state.xp = Math.max(0, this.state.xp + actualXpGain);
        this.state.totalCompleted = Math.max(0, this.state.totalCompleted + completedInc);
        this.state.dailies[questId] = newProgress;
        this.state.history[today] = Math.max(0, (this.state.history[today] || 0) + completedInc);
        
        const newLevel = calculateLevel(this.state.xp);
        
        // Check for level up
        if (newLevel > oldLevel) {
            setTimeout(() => showLevelUpNotification(newLevel), 300);
        }
        
        // Check for achievements
        this.checkAchievements();
        
        this.updateStreak();
        this.save();
        this.notify();
    }

    addGoal(title, target) {
        this.state.goals.push({
            id: Date.now().toString(),
            title,
            target: parseInt(target),
            current: 0
        });
        
        this.save();
        this.notify();
    }

    updateGoal(id, change) {
        const goalIndex = this.state.goals.findIndex(g => g.id === id);
        if (goalIndex === -1) return;
        
        const goal = this.state.goals[goalIndex];
        const newCurrent = Math.max(0, Math.min(goal.target, goal.current + change));
        const completedNow = newCurrent === goal.target && goal.current < goal.target;
        
        goal.current = newCurrent;
        
        if (completedNow) {
            this.state.xp += 200;
            this.state.goalsCompleted++;
            setTimeout(() => showAchievementNotification('Goal Complete! +200 XP'), 300);
        }
        
        this.checkAchievements();
        this.save();
        this.notify();
    }

    deleteGoal(id) {
        this.state.goals = this.state.goals.filter(g => g.id !== id);
        this.save();
        this.notify();
    }

    addCustomQuest(quest) {
        this.state.customQuests.push({
            ...quest,
            id: Date.now().toString()
        });
        
        this.checkAchievements();
        this.save();
        this.notify();
    }

    deleteCustomQuest(id) {
        this.state.customQuests = this.state.customQuests.filter(q => q.id !== id);
        this.save();
        this.notify();
    }

    checkAchievements() {
        ACHIEVEMENTS.forEach(achievement => {
            if (achievement.condition(this.state) && !this.state.unlockedAchievements.includes(achievement.id)) {
                this.state.unlockedAchievements.push(achievement.id);
                setTimeout(() => showAchievementNotification(achievement.name), 500);
            }
        });
    }
}

// ===================================
// UI COMPONENTS
// ===================================

function renderIcon(iconName) {
    const icons = {
        'code': '<polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>',
        'git-commit': '<circle cx="12" cy="12" r="4"></circle><line x1="1.05" y1="12" x2="7" y2="12"></line><line x1="17.01" y1="12" x2="22.96" y2="12"></line>',
        'book-open': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>',
        'briefcase': '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>',
        'target': '<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>',
        'plus': '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>',
        'trash': '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>',
        'calendar': '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
        'trending-up': '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>',
        'award': '<circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>',
        'star': '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>'
    };
    
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icons[iconName] || icons['code']}</svg>`;
}

function renderQuestCard(quest, progress) {
    const current = progress[quest.id] || 0;
    const isCompleted = quest.type === 'boolean' ? current === 1 : current === quest.max;
    const isCustom = quest.custom || false;
    
    return `
        <div class="quest-card ${isCompleted ? 'completed' : ''} ${isCustom ? 'custom-quest-card' : ''}" data-quest-id="${quest.id}">
            <div class="quest-header">
                <div class="quest-icon">
                    ${renderIcon(quest.icon)}
                </div>
                <div class="quest-content">
                    <div class="quest-title-row">
                        <h3 class="quest-title">${quest.title}</h3>
                        <span class="quest-xp">+${quest.xpPer} XP${quest.type === 'counter' ? '/ea' : ''}</span>
                    </div>
                    <p class="quest-desc">${quest.desc}</p>
                    
                    ${quest.type === 'boolean' ? `
                        <button class="quest-action-btn ${isCompleted ? 'completed' : 'primary'}" 
                                onclick="app.updateDailyProgress('${quest.id}', ${!isCompleted}, ${quest.xpPer}, 'boolean')">
                            ${isCompleted ? 'Completed ✓' : 'Mark Complete'}
                        </button>
                    ` : `
                        <div class="quest-counter">
                            <button class="counter-btn" 
                                    onclick="app.updateDailyProgress('${quest.id}', -1, ${quest.xpPer}, 'counter', ${quest.max})"
                                    ${current === 0 ? 'disabled' : ''}>
                                -
                            </button>
                            <div class="counter-display ${isCompleted ? 'completed' : ''}">
                                <span class="current">${current}</span>
                                <span class="total"> / ${quest.max}</span>
                            </div>
                            <button class="counter-btn increment" 
                                    onclick="app.updateDailyProgress('${quest.id}', 1, ${quest.xpPer}, 'counter', ${quest.max})"
                                    ${isCompleted ? 'disabled' : ''}>
                                ${renderIcon('plus')}
                            </button>
                        </div>
                    `}
                    
                    ${isCustom ? `
                        <button class="delete-btn" style="margin-top: 0.5rem; padding: 0.5rem; width: 100%; background: rgba(239, 68, 68, 0.1); color: #ef4444; border-radius: 0.5rem; border: 1px solid rgba(239, 68, 68, 0.2);" 
                                onclick="app.deleteCustomQuest('${quest.id}')">
                            ${renderIcon('trash')} Delete Custom Quest
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function renderGoalCard(goal) {
    const isCompleted = goal.current >= goal.target;
    const percent = Math.min(100, (goal.current / goal.target) * 100);
    
    return `
        <div class="goal-card ${isCompleted ? 'completed' : ''}">
            <div class="goal-header">
                <h3 class="goal-title">${goal.title}</h3>
                <button class="delete-btn" onclick="app.deleteGoal('${goal.id}')">
                    ${renderIcon('trash')}
                </button>
            </div>
            
            <div class="goal-controls">
                <button class="goal-btn" 
                        onclick="app.updateGoal('${goal.id}', -1)"
                        ${goal.current === 0 ? 'disabled' : ''}>
                    -
                </button>
                <div class="goal-progress">
                    <div class="goal-numbers">
                        <span>${goal.current}</span>
                        <span>${goal.target}</span>
                    </div>
                    <div class="goal-bar-container">
                        <div class="goal-bar" style="width: ${percent}%"></div>
                    </div>
                </div>
                <button class="goal-btn increment" 
                        onclick="app.updateGoal('${goal.id}', 1)"
                        ${isCompleted ? 'disabled' : ''}>
                    ${renderIcon('plus')}
                </button>
            </div>
        </div>
    `;
}

function renderAchievementCard(achievement, unlocked) {
    return `
        <div class="achievement-item ${unlocked ? 'unlocked' : 'locked'}">
            <div class="achievement-emoji">${achievement.emoji}</div>
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-desc">${achievement.desc}</div>
        </div>
    `;
}

// ===================================
// VIEW RENDERERS
// ===================================

function renderDailiesView(state) {
    let quests = [...DAILY_QUESTS_TEMPLATE];
    const day = getDayOfWeek();
    
    // Add pitch quest Monday to Thursday
    if (day >= 1 && day <= 4) {
        quests.splice(1, 0, PITCH_QUEST);
    }
    
    // Add custom quests
    quests = [...quests, ...state.customQuests];
    
    // Get daily quote
    const quoteIndex = new Date().getDate() % QUOTES.length;
    const quote = QUOTES[quoteIndex];
    
    return `
        <div class="fade-in">
            <div class="daily-quote">
                <div class="quote-text">"${quote.text}"</div>
                <div class="quote-author">— ${quote.author}</div>
            </div>
            
            <div class="section-header">
                Today's Protocol
                <button class="add-btn" onclick="showCustomQuestForm()">
                    ${renderIcon('plus')}
                </button>
            </div>
            
            <div id="customQuestForm" class="hidden add-form">
                <input type="text" id="customQuestTitle" class="form-input" placeholder="Quest Title (e.g., Review Pull Requests)">
                <div class="form-row">
                    <select id="customQuestType" class="form-input">
                        <option value="boolean">Yes/No Quest</option>
                        <option value="counter">Counter Quest</option>
                    </select>
                    <input type="number" id="customQuestMax" class="form-input" placeholder="Max" value="1" min="1" style="display: none;">
                </div>
                <input type="number" id="customQuestXP" class="form-input" placeholder="XP Reward" value="20" min="1">
                <textarea id="customQuestDesc" class="form-input" placeholder="Description" rows="2"></textarea>
                <button class="submit-btn" onclick="addCustomQuest()">Add Custom Quest</button>
            </div>
            
            ${quests.map(quest => renderQuestCard(quest, state.dailies)).join('')}
        </div>
    `;
}

function renderGoalsView(state) {
    return `
        <div class="fade-in">
            <div class="section-header">
                Long Term Objectives
                <button class="add-btn" onclick="toggleGoalForm()">
                    ${renderIcon('plus')}
                </button>
            </div>
            
            <div id="goalForm" class="hidden add-form">
                <input type="text" id="goalTitle" class="form-input" placeholder="Goal Title (e.g., Build Portfolio)">
                <div class="form-row">
                    <input type="number" id="goalTarget" class="form-input" placeholder="Target (e.g., 100 hrs)" min="1">
                    <button class="submit-btn" onclick="addGoal()">Add Goal</button>
                </div>
            </div>
            
            ${state.goals.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-state-icon">${renderIcon('target')}</div>
                    <p>No active long-term goals.</p>
                    <p style="font-size: 0.75rem; margin-top: 0.25rem;">Add one to track big projects!</p>
                </div>
            ` : state.goals.map(goal => renderGoalCard(goal)).join('')}
        </div>
    `;
}

function renderAchievementsView(state) {
    return `
        <div class="fade-in">
            <div class="section-header">
                Trophy Collection
            </div>
            <div class="achievement-grid">
                ${ACHIEVEMENTS.map(achievement => {
                    const unlocked = state.unlockedAchievements.includes(achievement.id);
                    return renderAchievementCard(achievement, unlocked);
                }).join('')}
            </div>
        </div>
    `;
}

function renderStatsView(state) {
    // Generate last 28 days for activity map
    const gridDays = [];
    const d = new Date();
    d.setDate(d.getDate() - 27);
    
    for (let i = 0; i < 28; i++) {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const count = state.history[dateStr] || 0;
        gridDays.push({ date: dateStr, count });
        d.setDate(d.getDate() + 1);
    }
    
    const currentLevel = calculateLevel(state.xp);
    
    return `
        <div class="fade-in">
            <div class="section-header">
                Telemetry & Stats
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon" style="color: #3b82f6;">${renderIcon('trending-up')}</div>
                    <div class="stat-value">${state.currentStreak}</div>
                    <div class="stat-label">Day Streak</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="color: #06b6d4;">${renderIcon('award')}</div>
                    <div class="stat-value">${state.totalCompleted}</div>
                    <div class="stat-label">Quests Done</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="color: #8b5cf6;">${renderIcon('target')}</div>
                    <div class="stat-value">${state.goalsCompleted}</div>
                    <div class="stat-label">Goals Done</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="color: #f59e0b;">${renderIcon('star')}</div>
                    <div class="stat-value">${currentLevel}</div>
                    <div class="stat-label">Current Level</div>
                </div>
            </div>
            
            <div class="activity-map">
                <div class="activity-header">
                    ${renderIcon('calendar')}
                    Activity Map (Last 28 Days)
                </div>
                
                <div class="activity-grid">
                    ${gridDays.map(day => {
                        let levelClass = '';
                        if (day.count > 0) levelClass = 'level-1';
                        if (day.count > 2) levelClass = 'level-2';
                        if (day.count > 4) levelClass = 'level-3';
                        
                        return `<div class="activity-day ${levelClass}" title="${day.date}: ${day.count} quests">
                            ${day.count > 0 ? day.count : ''}
                        </div>`;
                    }).join('')}
                </div>
                
                <div class="activity-legend">
                    <span>Less</span>
                    <div class="legend-box" style="background: var(--bg-tertiary);"></div>
                    <div class="legend-box" style="background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.3);"></div>
                    <div class="legend-box" style="background: rgba(59, 130, 246, 0.4); border: 1px solid var(--blue-primary);"></div>
                    <div class="legend-box" style="background: var(--blue-primary); box-shadow: 0 0 5px var(--blue-glow);"></div>
                    <span>More</span>
                </div>
            </div>
        </div>
    `;
}

// ===================================
// UI INTERACTION FUNCTIONS
// ===================================

function toggleGoalForm() {
    const form = document.getElementById('goalForm');
    form.classList.toggle('hidden');
}

function addGoal() {
    const title = document.getElementById('goalTitle').value.trim();
    const target = document.getElementById('goalTarget').value;
    
    if (!title || !target || isNaN(target) || target < 1) {
        alert('Please enter a valid goal title and target');
        return;
    }
    
    app.addGoal(title, target);
    
    document.getElementById('goalTitle').value = '';
    document.getElementById('goalTarget').value = '';
    toggleGoalForm();
}

function showCustomQuestForm() {
    const form = document.getElementById('customQuestForm');
    form.classList.toggle('hidden');
    
    // Add event listener for type change
    const typeSelect = document.getElementById('customQuestType');
    const maxInput = document.getElementById('customQuestMax');
    
    typeSelect.onchange = () => {
        if (typeSelect.value === 'counter') {
            maxInput.style.display = 'block';
        } else {
            maxInput.style.display = 'none';
        }
    };
}

function addCustomQuest() {
    const title = document.getElementById('customQuestTitle').value.trim();
    const type = document.getElementById('customQuestType').value;
    const max = parseInt(document.getElementById('customQuestMax').value) || 1;
    const xpPer = parseInt(document.getElementById('customQuestXP').value) || 20;
    const desc = document.getElementById('customQuestDesc').value.trim() || 'Custom quest';
    
    if (!title) {
        alert('Please enter a quest title');
        return;
    }
    
    const quest = {
        title,
        type,
        max: type === 'counter' ? max : 1,
        xpPer,
        icon: 'star',
        desc,
        custom: true
    };
    
    app.addCustomQuest(quest);
    
    // Reset form
    document.getElementById('customQuestTitle').value = '';
    document.getElementById('customQuestType').value = 'boolean';
    document.getElementById('customQuestMax').value = '1';
    document.getElementById('customQuestXP').value = '20';
    document.getElementById('customQuestDesc').value = '';
    document.getElementById('customQuestForm').classList.add('hidden');
}

// ===================================
// NOTIFICATION SYSTEM
// ===================================

function showAchievementNotification(name) {
    const popup = document.getElementById('achievementPopup');
    const desc = document.getElementById('achievementDesc');
    desc.textContent = name;
    
    popup.classList.add('show');
    
    setTimeout(() => {
        popup.classList.remove('show');
    }, 3000);
}

function showLevelUpNotification(level) {
    const popup = document.getElementById('levelupPopup');
    const levelEl = document.getElementById('levelupLevel');
    levelEl.textContent = `Level ${level}`;
    
    popup.classList.add('show');
    
    setTimeout(() => {
        popup.classList.remove('show');
    }, 3000);
}

// ===================================
// APP CONTROLLER
// ===================================

class App {
    constructor() {
        this.state = new AppState();
        this.currentTab = 'dailies';
    }

    async init() {
        await this.state.init();
        
        this.state.subscribe((state) => {
            this.updateHeader(state);
            this.render();
        });
        
        this.setupNavigation();
        this.updateHeader(this.state.state);
        this.render();
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                this.switchTab(tab);
            });
        });
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        // Update active state
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.dataset.tab === tab) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        this.render();
    }

    updateHeader(state) {
        const level = calculateLevel(state.xp);
        const currentLevelXP = state.xp - xpForNextLevel(level - 1);
        const requiredXP = xpForNextLevel(level) - xpForNextLevel(level - 1);
        const xpPercentage = Math.min(100, Math.max(0, (currentLevelXP / requiredXP) * 100));
        
        document.getElementById('levelDisplay').textContent = level;
        document.getElementById('xpTotal').textContent = `${state.xp} XP`;
        document.getElementById('xpBar').style.width = `${xpPercentage}%`;
        document.getElementById('currentXP').textContent = `${currentLevelXP} XP`;
        document.getElementById('nextLevelXP').textContent = `${requiredXP} XP TO LVL ${level + 1}`;
    }

    render() {
        const mainContent = document.getElementById('mainContent');
        
        switch (this.currentTab) {
            case 'dailies':
                mainContent.innerHTML = renderDailiesView(this.state.state);
                break;
            case 'goals':
                mainContent.innerHTML = renderGoalsView(this.state.state);
                break;
            case 'achievements':
                mainContent.innerHTML = renderAchievementsView(this.state.state);
                break;
            case 'stats':
                mainContent.innerHTML = renderStatsView(this.state.state);
                break;
        }
    }

    // Proxy methods to state
    updateDailyProgress(...args) {
        this.state.updateDailyProgress(...args);
    }

    addGoal(...args) {
        this.state.addGoal(...args);
    }

    updateGoal(...args) {
        this.state.updateGoal(...args);
    }

    deleteGoal(...args) {
        this.state.deleteGoal(...args);
    }

    addCustomQuest(...args) {
        this.state.addCustomQuest(...args);
    }

    deleteCustomQuest(...args) {
        this.state.deleteCustomQuest(...args);
    }
}

// ===================================
// INITIALIZE APP
// ===================================

let app;

document.addEventListener('DOMContentLoaded', async () => {
    app = new App();
    await app.init();
});
