// API configuration
const FOOTBALL_API_KEY = 'e53d612e964eb22360abf4341bfff21b';
const CRICKET_API_KEY = '8fe63192-6925-4e7f-b394-7e92d964983f'; // from cricapi.com
const BASKETBALL_API_KEY = 'e53d612e964eb22360abf4341bfff21b'; 

const API_URLS = {
    football: 'https://v3.football.api-sports.io',
    cricket: 'https://api.cricapi.com/v1',
    basketball: 'https://v1.basketball.api-sports.io'
};

// State management
let isLoading = true;
let errorState = null;
let selectedSport = 'cricket'; // Changed default from 'football' to 'cricket'
let chartInstances = {
    playerChart: null,
    teamChart: null,
    heatmapChart: null
};

// Add these new objects
// Default team names for each sport
const teamNames = {
    football: ['Manchester United', 'Liverpool'],
    cricket: ['India', 'Australia'],
    basketball: ['Lakers', 'Celtics']
};

// Data ranges for player statistics
const dataRanges = {
    football: {
        'Goals': { min: 0, max: 30 },
        'Assists': { min: 0, max: 20 },
        'Passes': { min: 500, max: 2000 },
        'Tackles': { min: 20, max: 100 },
        'Shots': { min: 30, max: 150 }
    },
    cricket: {
        'Runs': { min: 0, max: 200 },
        'Wickets': { min: 0, max: 10 },
        'Overs': { min: 0, max: 20 },
        'Run Rate': { min: 0, max: 12 },
        'Extras': { min: 0, max: 20 }
    },
    basketball: {
        'Points': { min: 10, max: 35 },
        'Rebounds': { min: 2, max: 15 },
        'Assists': { min: 2, max: 12 },
        'Steals': { min: 0, max: 5 },
        'Blocks': { min: 0, max: 4 }
    }
};

// Helper function to generate random team data
function generateTeamData(metrics) {
    return metrics.map(() => Math.floor(Math.random() * 100));
}

// Function to show loading state
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    element.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading data...</p>
        </div>
    `;
}

// Function to show error state
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.innerHTML = `
        <div class="error-message">
            <p>❌ ${message}</p>
            <button onclick="initDashboard()">Retry</button>
        </div>
    `;
}

// Add sport selection functionality
function addSportSelector() {
    const header = document.querySelector('header');
    const selector = document.createElement('div');
    selector.className = 'sport-selector';
    selector.innerHTML = `
        <button class="sport-btn active" data-sport="cricket">Cricket</button>
        <button class="sport-btn" data-sport="football">Football</button>
        <button class="sport-btn" data-sport="basketball">Basketball</button>
    `;
    
    header.appendChild(selector);

    // Add event listeners to buttons
    selector.addEventListener('click', (e) => {
        if (e.target.classList.contains('sport-btn')) {
            document.querySelectorAll('.sport-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            selectedSport = e.target.dataset.sport;
            initDashboard();
        }
    });
}

// Fetch live matches based on selected sport
async function fetchLiveMatches() {
    try {
        let response;
        let data;

        switch (selectedSport) {
            case 'football':
                // First try to get live matches
                response = await fetch(`${API_URLS.football}/fixtures?live=all`, {
                    headers: {
                        'x-rapidapi-key': FOOTBALL_API_KEY,
                        'x-rapidapi-host': 'v3.football.api-sports.io'
                    }
                });
                data = await response.json();
                
                // If no live matches, get today's matches
                if (!data.response || data.response.length === 0) {
                    const today = new Date().toISOString().split('T')[0];
                    response = await fetch(`${API_URLS.football}/fixtures?date=${today}`, {
                        headers: {
                            'x-rapidapi-key': FOOTBALL_API_KEY,
                            'x-rapidapi-host': 'v3.football.api-sports.io'
                        }
                    });
                    data = await response.json();
                }
                return data.response;

            case 'cricket':
                response = await fetch(`${API_URLS.cricket}/currentMatches?apikey=${CRICKET_API_KEY}&offset=0`);
                data = await response.json();
                console.log('Cricket API Response:', data);
                
                if (data.status !== "success") {
                    throw new Error('Cricket API request failed');
                }
                
                // Ensure correct parsing of match data
                return data.data ? data.data : [];

            case 'basketball':
                response = await fetch(`${API_URLS.basketball}/games?date=2025-01-06`, {
                    headers: {
                        'x-rapidapi-key': BASKETBALL_API_KEY,
                        'x-rapidapi-host': 'v1.basketball.api-sports.io'
                    }
                });
                data = await response.json();
                return data.response;

            default:
                throw new Error('Invalid sport selected');
        }
    } catch (error) {
        console.error(`Error fetching ${selectedSport} matches:`, error);
        throw error;
    }
}

// Update score cards with real data
async function updateScoreCards() {
    const scoreCardsContainer = document.getElementById('scoreCards');
    
    try {
        showLoading('scoreCards');
        const matches = await fetchLiveMatches();
        
        if (!scoreCardsContainer) {
            console.error('Score cards container not found');
            return;
        }
        
        scoreCardsContainer.innerHTML = '';
        
        if (!matches || matches.length === 0) {
            scoreCardsContainer.innerHTML = `<p>No ${selectedSport} matches found today</p>`;
            return;
        }

        matches.forEach(match => {
            const scoreCard = document.createElement('div');
            scoreCard.className = `score-card ${selectedSport}`;
            
            switch(selectedSport) {
                case 'football':
                    const isLive = match.fixture.status.short === 'LIVE' || 
                                 match.fixture.status.short === 'HT' || 
                                 match.fixture.status.short === '2H';
                    
                    const statusClass = isLive ? 'status-live' : 'status-finished';
                    const statusText = isLive ? 
                        `${match.fixture.status.elapsed}'` : 
                        match.fixture.status.long;

                    scoreCard.innerHTML = `
                        <div class="match-status ${statusClass}">
                            ${isLive ? '🔴 LIVE' : match.fixture.status.long}
                        </div>
                        <h3>${match.teams.home.name} vs ${match.teams.away.name}</h3>
                        <div class="score">
                            <span class="team-score">${match.goals.home ?? 0}</span>
                            <span class="score-divider">-</span>
                            <span class="team-score">${match.goals.away ?? 0}</span>
                        </div>
                        <div class="match-details">
                            <p class="league">${match.league.name}</p>
                            <p class="time">${statusText}</p>
                            <p class="venue">${match.fixture.venue.name || 'Unknown Venue'}, ${match.fixture.venue.city || 'Unknown City'}</p>
                        </div>
                    `;
                    break;
                case 'cricket':
                    // Parse the match data more carefully
                    const teams = match.teamInfo ? 
                        `${match.teamInfo[0]?.name || 'Team 1'} vs ${match.teamInfo[1]?.name || 'Team 2'}` : 
                        match.name || 'Match Name Not Available';
                        
                    scoreCard.innerHTML = `
                        <h3>${teams}</h3>
                        <p class="score">${match.status || 'Status Not Available'}</p>
                        <div class="match-details">
                            <p>Venue: ${match.venue || 'Not specified'}</p>
                            <p>Match Type: ${match.matchType || 'T20'}</p>
                            ${match.score ? `
                                <div class="cricket-scores">
                                    ${typeof match.score === 'string' ? 
                                        `<p>${match.score}</p>` :
                                        match.score.map(score => 
                                            `<p>${typeof score === 'object' ? 
                                                `${score.inning}: ${score.r}/${score.w} (${score.o} ov)` : 
                                                score
                                            }</p>`
                                        ).join('')
                                    }
                                </div>
                            ` : '<p>Score not available</p>'}
                            <p>Date: ${new Date(match.date || match.dateTimeGMT).toLocaleDateString()}</p>
                        </div>
                    `;
                    break;
                case 'basketball':
                    // Validate required data exists
                    if (!match?.teams?.home?.name || !match?.teams?.away?.name) {
                        console.error('Invalid basketball match data:', match);
                        return;
                    }

                    let basketballStatus = {
                        isLive: match.status?.short === 'LIVE' || 
                                match.status?.short === 'HT' ||
                                match.status?.short === 'Q1' ||
                                match.status?.short === 'Q2' ||
                                match.status?.short === 'Q3' ||
                                match.status?.short === 'Q4',
                        class: '',
                        text: ''
                    };
                    
                    basketballStatus.class = basketballStatus.isLive ? 'status-live' : 'status-finished';
                    basketballStatus.text = basketballStatus.isLive ? 
                        `Quarter ${match.periods?.current || ''}` : 
                        match.status?.long || 'Unknown';

                    // Safely access nested properties
                    const scores = {
                        home: match.scores?.home || {},
                        away: match.scores?.away || {}
                    };

                    scoreCard.innerHTML = `
                        <div class="match-status ${basketballStatus.class}">
                            ${basketballStatus.isLive ? '🔴 LIVE' : match.status?.long || 'Unknown'}
                        </div>
                        <h3>${match.teams.home.name} vs ${match.teams.away.name}</h3>
                        <div class="score">
                            <span class="team-score">${scores.home.total ?? 0}</span>
                            <span class="score-divider">-</span>
                            <span class="team-score">${scores.away.total ?? 0}</span>
                        </div>
                        <div class="match-details">
                            <p class="league">${match.league?.name || 'Unknown League'}</p>
                            <p class="time">${basketballStatus.text}</p>
                            <p class="venue">${match.arena?.name || 'Unknown Arena'}, ${match.arena?.city || 'Unknown City'}</p>
                            <div class="quarter-scores">
                                <div class="quarter">
                                    <span>Q1</span>
                                    <span>${scores.home.quarter_1 ?? 0} - ${scores.away.quarter_1 ?? 0}</span>
                                </div>
                                <div class="quarter">
                                    <span>Q2</span>
                                    <span>${scores.home.quarter_2 ?? 0} - ${scores.away.quarter_2 ?? 0}</span>
                                </div>
                                <div class="quarter">
                                    <span>Q3</span>
                                    <span>${scores.home.quarter_3 ?? 0} - ${scores.away.quarter_3 ?? 0}</span>
                                </div>
                                <div class="quarter">
                                    <span>Q4</span>
                                    <span>${scores.home.quarter_4 ?? 0} - ${scores.away.quarter_4 ?? 0}</span>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
            }
            
            scoreCardsContainer.appendChild(scoreCard);
            addMatchClickHandler(scoreCard, match);
        });
    } catch (error) {
        console.error('Error updating score cards:', error);
        if (scoreCardsContainer) {
            showError('scoreCards', `Failed to load ${selectedSport} matches`);
        }
    }
}

// Add this function to process live match data for charts
function processLiveMatchData(match) {
    if (!match) return null;

    if (selectedSport === 'football') {
        const homeTeam = match.teams.home;
        const awayTeam = match.teams.away;
        const stats = match.statistics || [];

        // Get team statistics
        const homeStats = stats.find(s => s.team.id === homeTeam.id) || {};
        const awayStats = stats.find(s => s.team.id === awayTeam.id) || {};

        return {
            playerStats: {
                labels: ['Goals', 'Shots on Target', 'Possession', 'Passes'],
                datasets: [{
                    label: homeTeam.name,
                    data: [
                        match.goals.home || 0,
                        homeStats.shotsOnTarget || 0,
                        homeStats.possession || 0,
                        homeStats.passes || 0
                    ],
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }, {
                    label: awayTeam.name,
                    data: [
                        match.goals.away || 0,
                        awayStats.shotsOnTarget || 0,
                        awayStats.possession || 0,
                        awayStats.passes || 0
                    ],
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            teamStats: {
                labels: ['Attack', 'Defense', 'Possession', 'Passing', 'Set Pieces'],
                team1: {
                    name: homeTeam.name,
                    stats: [
                        (homeStats.shotsOnTarget / 10) * 100 || 0,
                        ((10 - (match.goals.away || 0)) / 10) * 100,
                        homeStats.possession || 0,
                        (homeStats.passAccuracy || 0),
                        (homeStats.corners || 0) * 10
                    ]
                },
                team2: {
                    name: awayTeam.name,
                    stats: [
                        (awayStats.shotsOnTarget / 10) * 100 || 0,
                        ((10 - (match.goals.home || 0)) / 10) * 100,
                        awayStats.possession || 0,
                        (awayStats.passAccuracy || 0),
                        (awayStats.corners || 0) * 10
                    ]
                }
            }
        };
    }
    if (selectedSport === 'basketball') {
        try {
            // Validate required data exists
            if (!match?.teams?.home?.name || !match?.teams?.away?.name) {
                console.error('Missing team data in match:', match);
                return null;
            }

            const homeTeam = match.teams.home;
            const awayTeam = match.teams.away;
            const homeScore = match.scores?.home || {};
            const awayScore = match.scores?.away || {};
            const stats = match.statistics || [];

            // Get team statistics safely
            const homeStats = stats[0] || {};
            const awayStats = stats[1] || {};

            return {
                playerStats: {
                    labels: ['Total Points', '2 Points', '3 Points', 'Free Throws'],
                    datasets: [{
                        label: homeTeam.name,
                        data: [
                            homeScore.total ?? 0,
                            homeScore.points_2 ?? 0,
                            homeScore.points_3 ?? 0,
                            homeScore.points_ft ?? 0
                        ],
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }, {
                        label: awayTeam.name,
                        data: [
                            awayScore.total ?? 0,
                            awayScore.points_2 ?? 0,
                            awayScore.points_3 ?? 0,
                            awayScore.points_ft ?? 0
                        ],
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                teamStats: {
                    labels: ['Offense', 'Defense', '3PT%', 'FT%', 'Rebounds'],
                    team1: {
                        name: homeTeam.name,
                        stats: [
                            ((homeScore.total ?? 0) / 150) * 100,
                            ((150 - (awayScore.total ?? 0)) / 150) * 100,
                            homeStats.points_3_percentage ?? 0,
                            homeStats.points_ft_percentage ?? 0,
                            homeStats.rebounds_total ?? 0
                        ]
                    },
                    team2: {
                        name: awayTeam.name,
                        stats: [
                            ((awayScore.total ?? 0) / 150) * 100,
                            ((150 - (homeScore.total ?? 0)) / 150) * 100,
                            awayStats.points_3_percentage ?? 0,
                            awayStats.points_ft_percentage ?? 0,
                            awayStats.rebounds_total ?? 0
                        ]
                    }
                }
            };
        } catch (error) {
            console.error('Error processing basketball match data:', error);
            return null;
        }
    }
    if (selectedSport === 'cricket') {
        try {
            // Extract team names
            const teams = match.teamInfo || [];
            const team1Name = teams[0]?.name || 'Team 1';
            const team2Name = teams[1]?.name || 'Team 2';

            // Extract scores
            const team1Score = match.score?.[0] || { r: 0, w: 0, o: 0 };
            const team2Score = match.score?.[1] || { r: 0, w: 0, o: 0 };

            return {
                playerStats: {
                    labels: ['Runs', 'Wickets', 'Run Rate'],
                    datasets: [{
                        label: team1Name,
                        data: [
                            team1Score.r || 0,
                            team1Score.w || 0,
                            team1Score.o > 0 ? (team1Score.r / team1Score.o).toFixed(2) : 0
                        ],
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }, {
                        label: team2Name,
                        data: [
                            team2Score.r || 0,
                            team2Score.w || 0,
                            team2Score.o > 0 ? (team2Score.r / team2Score.o).toFixed(2) : 0
                        ],
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                teamStats: {
                    labels: ['Overall Performance', 'Batting', 'Run Rate', 'Wicket Retention', 'Scoring Rate'],
                    team1: {
                        name: team1Name,
                        stats: [
                            (team1Score.r / 200) * 100,  // Overall Performance
                            (team1Score.r / 150) * 100,  // Batting
                            (parseFloat(team1Score.o > 0 ? (team1Score.r / team1Score.o).toFixed(2) : 0) / 10) * 100,  // Run Rate
                            ((10 - team1Score.w) / 10) * 100,  // Wicket Retention
                            (team1Score.r / (team1Score.o * 10)) * 100  // Scoring Rate
                        ]
                    },
                    team2: {
                        name: team2Name,
                        stats: [
                            (team2Score.r / 200) * 100,
                            (team2Score.r / 150) * 100,
                            (parseFloat(team2Score.o > 0 ? (team2Score.r / team2Score.o).toFixed(2) : 0) / 10) * 100,
                            ((10 - team2Score.w) / 10) * 100,
                            (team2Score.r / (team2Score.o * 10)) * 100
                        ]
                    }
                }
            };
        } catch (error) {
            console.error('Error processing cricket match data:', error);
            return null;
        }
    }
}

// Add this function for proper cleanup
function cleanupDashboard() {
    if (window.updateInterval) {
        clearInterval(window.updateInterval);
        window.updateInterval = null;
    }
    
    Object.values(modalChartInstances).forEach(chart => {
        if (chart) {
            chart.destroy();
            chart = null;
        }
    });
}

// Initialize dashboard with error handling
async function initDashboard() {
    try {
        cleanupDashboard();
        isLoading = true;
        errorState = null;
        
        // Update UI to loading state
        const elements = ['scoreCards'];
        elements.forEach(elementId => {
            const element = document.getElementById(elementId);
            if (element) {
                showLoading(elementId);
            }
        });

        // Fetch and update live scores
        await updateScoreCards();
        
        // Set up real-time updates
        window.updateInterval = setInterval(async () => {
            try {
                await updateScoreCards();
            } catch (error) {
                console.error('Error in update interval:', error);
            }
        }, 60000); // Update every minute

    } catch (error) {
        console.error('Dashboard initialization error:', error);
        errorState = error.message;
        showError('scoreCards', `Failed to initialize ${selectedSport} dashboard. Error: ${error.message}`);
    } finally {
        isLoading = false;
    }
}

// Start the dashboard when page loads
window.addEventListener('load', () => {
    addSportSelector();
    addFootballStyles();
    addBasketballStyles();
    initDashboard();
});

// Add these variables at the top with other state management
let modalChartInstances = {
    playerChart: null,
    comparisonChart: null,
    partnershipChart: null,
    overByOverChart: null
};

// Add click event handler to score cards
function addMatchClickHandler(scoreCard, match) {
    scoreCard.style.cursor = 'pointer';
    scoreCard.addEventListener('click', () => {
        console.log('Match clicked:', match); // Debug log
        showMatchDetails(match);
    });
}

// Show match details in modal
function showMatchDetails(match) {
    const modal = document.getElementById('matchModal');
    const modalContent = modal.querySelector('.modal-content');
    
    // Clear previous sport attribute
    modalContent.removeAttribute('data-sport');
    // Set the sport attribute
    modalContent.setAttribute('data-sport', selectedSport);
    
    console.log('Showing match details:', match);
    console.log('Sport selected:', selectedSport);
    console.log('Modal sport attribute:', modalContent.getAttribute('data-sport'));
    const modalTitle = document.getElementById('modalTitle');
    const modalStatus = document.getElementById('modalStatus');
    const homeTeamStats = document.getElementById('homeTeamStats');
    const awayTeamStats = document.getElementById('awayTeamStats');
    
    // Clear previous content
    modalTitle.textContent = '';
    modalStatus.textContent = '';
    homeTeamStats.innerHTML = '';
    awayTeamStats.innerHTML = '';
    
    // Clear previous charts
    Object.values(modalChartInstances).forEach(chart => {
        if (chart) {
            chart.destroy();
            chart = null;
        }
    });

    if (!match) {
        console.error('No match data provided to showMatchDetails');
        return;
    }

    // Get team names based on sport
    let team1Name, team2Name;
    switch(selectedSport) {
        case 'cricket':
            team1Name = match.teams[0] || 'Unknown Team';
            team2Name = match.teams[1] || 'Unknown Team';
            modalTitle.textContent = `${team1Name} vs ${team2Name}`;
            modalStatus.textContent = match.status;
            break;
        case 'football':
            team1Name = match.teams.home.name;
            team2Name = match.teams.away.name;
            modalTitle.textContent = `${team1Name} vs ${team2Name}`;
            modalStatus.textContent = match.fixture.status.long;
            break;
        case 'basketball':
            team1Name = match.teams.home.name;
            team2Name = match.teams.away.name;
            modalTitle.textContent = `${team1Name} vs ${team2Name}`;
            modalStatus.textContent = match.status?.long || 'Unknown Status';
            break;
    }

    // Process match data for charts
    const chartData = processLiveMatchData(match);
    
    if (chartData) {
        // Create Match Statistics Chart (Bar)
        const playerCtx = document.getElementById('modalPlayerChart').getContext('2d');
        modalChartInstances.playerChart = new Chart(playerCtx, {
            type: 'bar',
            data: chartData.playerStats,
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Value'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Match Statistics'
                    },
                    legend: {
                        position: 'top'
                    }
                }
            }
        });

        // Create Team Performance Analysis Chart (Radar)
        const comparisonCtx = document.getElementById('modalComparisonChart').getContext('2d');
        modalChartInstances.comparisonChart = new Chart(comparisonCtx, {
            type: 'radar',
            data: {
                labels: chartData.teamStats.labels,
                datasets: [{
                    label: chartData.teamStats.team1.name,
                    data: chartData.teamStats.team1.stats,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }, {
                    label: chartData.teamStats.team2.name,
                    data: chartData.teamStats.team2.stats,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Team Performance Analysis'
                    },
                    legend: {
                        position: 'top'
                    }
                }
            }
        });

        // Sport-specific charts
        switch(selectedSport) {
            case 'cricket':
                try {
                    createCricketCharts(match, team1Name, team2Name);
                } catch (error) {
                    console.error('Error creating cricket charts:', error);
                }
                break;
            case 'football':
                try {
                    createFootballCharts(match, team1Name, team2Name);
                } catch (error) {
                    console.error('Error creating football charts:', error);
                }
                break;
            case 'basketball':
                try {
                    createBasketballCharts(match, team1Name, team2Name);
                } catch (error) {
                    console.error('Error creating basketball charts:', error);
                }
                break;
        }
    }

    if (selectedSport === 'cricket' && match.score) {
        // Get team scores
        const team1Score = match.score[0] || { r: 0, w: 0, o: 0 };
        const team2Score = match.score[1] || { r: 0, w: 0, o: 0 };

        // Calculate run rates
        const team1RunRate = team1Score.o > 0 ? (team1Score.r / team1Score.o).toFixed(2) : 0;
        const team2RunRate = team2Score.o > 0 ? (team2Score.r / team2Score.o).toFixed(2) : 0;

        // Update home team stats with actual team name
        homeTeamStats.innerHTML = `
            <h3>${team1Name}</h3>
            <div class="stat-grid">
                <div class="stat-item">
                    <span class="stat-label">Score</span>
                    <span class="stat-value">${team1Score.r}/${team1Score.w}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Overs</span>
                    <span class="stat-value">${team1Score.o}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Run Rate</span>
                    <span class="stat-value">${team1RunRate}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Wickets Left</span>
                    <span class="stat-value">${10 - team1Score.w}</span>
                </div>
            </div>
        `;

        // Update away team stats with actual team name
        awayTeamStats.innerHTML = `
            <h3>${team2Name}</h3>
            <div class="stat-grid">
                <div class="stat-item">
                    <span class="stat-label">Score</span>
                    <span class="stat-value">${team2Score.r}/${team2Score.w}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Overs</span>
                    <span class="stat-value">${team2Score.o}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Run Rate</span>
                    <span class="stat-value">${team2RunRate}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Wickets Left</span>
                    <span class="stat-value">${10 - team2Score.w}</span>
                </div>
            </div>
        `;
    }

    modal.style.display = 'block';
}

// Helper function to generate match statistics
function generateMatchStatistics(match) {
    // Parse score and generate realistic statistics
    let runs = 0, wickets = 0, overs = 20;
    let strikeRate = 0, economy = 0;

    try {
        if (match.score) {
            // Try to parse score like "120/6"
            const scoreMatch = match.score.match(/(\d+)\/(\d+)/);
            if (scoreMatch) {
                runs = parseInt(scoreMatch[1]) || 0;
                wickets = parseInt(scoreMatch[2]) || 0;
            }

            // Calculate strike rate and economy
            strikeRate = (runs / (overs * 6)) * 100;
            economy = runs / overs;
        }
    } catch (error) {
        console.error('Error parsing match statistics:', error);
    }

    return [
        runs,           // Runs
        wickets,        // Wickets
        overs,          // Overs
        strikeRate,     // Strike Rate
        economy         // Economy
    ];
}

// Helper function to generate team performance data
function generateTeamPerformance(match, teamIndex) {
    // Get team names
    const teams = match.name.split(' vs ');
    const isFirstTeam = teamIndex === 0;

    // Parse score to determine team performance
    let battingScore = 60; // Base score
    let bowlingScore = 60;
    let fieldingScore = 70;
    let runningScore = 65;
    let partnershipScore = 65;

    try {
        if (match.score) {
            // Adjust scores based on match result
            if (match.status.toLowerCase().includes('won')) {
                const winningTeam = match.status.split(' ')[0];
                const isWinner = (isFirstTeam && teams[0].includes(winningTeam)) ||
                               (!isFirstTeam && teams[1].includes(winningTeam));
                
                if (isWinner) {
                    battingScore += 20;
                    bowlingScore += 15;
                    fieldingScore += 10;
                    runningScore += 15;
                    partnershipScore += 20;
                }
            }

            // Parse score for additional adjustments
            const scoreMatch = match.score.match(/(\d+)\/(\d+)/);
            if (scoreMatch) {
                const runs = parseInt(scoreMatch[1]);
                const wickets = parseInt(scoreMatch[2]);
                
                // Adjust batting score based on runs
                if (runs > 150) battingScore += 10;
                if (wickets < 5) battingScore += 5;
            }
        }
    } catch (error) {
        console.error('Error generating team performance:', error);
    }

    return [
        battingScore,
        bowlingScore,
        fieldingScore,
        runningScore,
        partnershipScore
    ];
}

// Helper functions
function clearModalCharts() {
    Object.values(modalChartInstances).forEach(chart => {
        if (chart) {
            chart.destroy();
        }
    });
}

function calculateRunRate(match, teamIndex) {
    if (!match.score) return 'N/A';
    
    try {
        // Try to parse the score
        const score = match.score;
        if (typeof score === 'string') {
            const runs = parseInt(score);
            if (!isNaN(runs)) {
                // Assuming T20 match (20 overs)
                return (runs / 20).toFixed(2);
            }
        }
        return 'N/A';
    } catch (error) {
        console.error('Error calculating run rate:', error);
        return 'N/A';
    }
}

function generateCricketPlayerData(match) {
    // Generate player statistics based on available data
    return [0, 0, 0, 0, 0];
}

function generateCricketTeamComparison(match) {
    // Generate team comparison data
    return [{
        label: match.teamInfo?.[0]?.name || 'Team 1',
        data: [85, 70, 75, 80, 65],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
    }, {
        label: match.teamInfo?.[1]?.name || 'Team 2',
        data: [70, 85, 80, 75, 90],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
    }];
}

// Add modal close functionality
document.querySelector('.close-btn').addEventListener('click', () => {
    document.getElementById('matchModal').style.display = 'none';
});

window.addEventListener('click', (event) => {
    const modal = document.getElementById('matchModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Generate cricket match details
function generateCricketMatchDetails(match) {
    return `
        <h3>Match Details</h3>
        <div class="match-detail-grid">
            <div class="detail-item">
                <span class="detail-label">Venue:</span>
                <span class="detail-value">${match.venue || 'Not specified'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Match Type:</span>
                <span class="detail-value">${match.matchType || 'T20'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${new Date(match.date || match.dateTimeGMT).toLocaleDateString()}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Result:</span>
                <span class="detail-value">${match.status || 'In Progress'}</span>
            </div>
        </div>
    `;
}

// Generate cricket live updates
function generateCricketLiveUpdates(match) {
    return `
        <h3>Match Updates</h3>
        <div class="live-updates-container">
            <div class="update-item">
                <span class="update-time">Current Status:</span>
                <p class="update-text">${match.status || 'Status not available'}</p>
            </div>
            <div class="update-item">
                <span class="update-time">Match Information:</span>
                <p class="update-text">
                    Venue: ${match.venue || 'Not specified'}<br>
                    Format: ${match.matchType || 'T20'}<br>
                    Teams: ${match.name || 'Teams not specified'}
                </p>
            </div>
            ${match.score ? `
                <div class="update-item">
                    <span class="update-time">Score:</span>
                    <p class="update-text">${match.score}</p>
                </div>
            ` : ''}
        </div>
    `;
}

// Update the updateScoreCards function to add click handlers
// Add this line after creating each score card:
addMatchClickHandler(scoreCard, match); 

// Create Partnership Chart (Bar)
function createPartnershipChart(match, teamName) {
    const ctx = document.getElementById('partnershipChart').getContext('2d');
    const team1Score = match.score[0];
    
    // Calculate partnership data based on total runs
    const totalRuns = team1Score.r || 0;
    const partnerships = [
        { wicket: '1st', runs: Math.floor(totalRuns * 0.3) },
        { wicket: '2nd', runs: Math.floor(totalRuns * 0.2) },
        { wicket: '3rd', runs: Math.floor(totalRuns * 0.25) },
        { wicket: '4th', runs: Math.floor(totalRuns * 0.15) },
        { wicket: '5th', runs: Math.floor(totalRuns * 0.1) }
    ];

    modalChartInstances.partnershipChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: partnerships.map(p => p.wicket),
            datasets: [{
                label: `${teamName} Partnerships`,
                data: partnerships.map(p => p.runs),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Partnership Analysis'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Runs'
                    }
                }
            }
        }
    });
}

function createOverByOverChart(match, teamName) {
    const ctx = document.getElementById('overByOverChart').getContext('2d');
    const team1Score = match.score[0];
    
    // Generate over-by-over data
    const totalOvers = Math.floor(team1Score.o) || 0;
    const overs = Array.from({length: totalOvers}, (_, i) => i + 1);
    const runsPerOver = overs.map(() => 
        Math.floor(Math.random() * 12)
    );

    modalChartInstances.overByOverChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: overs,
            datasets: [{
                label: `${teamName} Runs per Over`,
                data: runsPerOver,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Over-by-Over Analysis'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Runs'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Over'
                    }
                }
            }
        }
    });
}

// Add football-specific styles
function addFootballStyles() {
    // Remove any existing football styles
    const existingStyle = document.getElementById('football-styles');
    if (existingStyle) {
        existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = 'football-styles';
    style.textContent = `
        .score-card.football {
            position: relative;
            overflow: hidden;
        }

        .score-card.football .match-status {
            position: absolute;
            top: 1rem;
            right: 1rem;
            padding: 0.4rem 0.8rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }

        .score-card.football .status-live {
            background-color: rgba(255, 0, 0, 0.1);
            color: #ff0000;
        }

        .score-card.football .status-finished {
            background-color: rgba(0, 0, 0, 0.05);
            color: var(--text-secondary);
        }

        .score-card.football .score {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            font-size: 2.2rem;
            margin: 1.5rem 0;
        }

        .score-card.football .team-score {
            font-weight: 700;
            color: var(--accent-color);
        }

        .score-card.football .score-divider {
            color: var(--text-secondary);
        }

        .score-card.football .league {
            color: var(--accent-color);
            font-weight: 500;
            margin-bottom: 0.5rem;
        }

        .score-card.football .time {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
        }

        .score-card.football .venue {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
    `;
    document.head.appendChild(style);
}

// Add basketball-specific styles
function addBasketballStyles() {
    // Remove any existing basketball styles
    const existingStyle = document.getElementById('basketball-styles');
    if (existingStyle) {
        existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = 'basketball-styles';
    style.textContent = `
        .score-card.basketball {
            position: relative;
            overflow: hidden;
        }

        .score-card.basketball::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(135deg, #ff6b6b, #ff8e53);
        }

        .score-card.basketball .match-status {
            position: absolute;
            top: 1rem;
            right: 1rem;
            padding: 0.4rem 0.8rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }

        .score-card.basketball .status-live {
            background-color: rgba(255, 0, 0, 0.1);
            color: #ff0000;
        }

        .score-card.basketball .status-finished {
            background-color: rgba(0, 0, 0, 0.05);
            color: var(--text-secondary);
        }

        .score-card.basketball .quarter-scores {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.5rem;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid rgba(0, 0, 0, 0.05);
        }

        .score-card.basketball .quarter {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.3rem;
            font-size: 0.9rem;
        }

        .score-card.basketball .quarter span:first-child {
            color: var(--text-secondary);
            font-weight: 500;
        }

        .score-card.basketball .quarter span:last-child {
            color: var(--text-primary);
            font-weight: 600;
        }
    `;
    document.head.appendChild(style);
} 
