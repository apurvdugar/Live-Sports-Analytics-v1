// Chart instances for each sport
const sportChartInstances = {
    cricket: {
        partnershipChart: null,
        overByOverChart: null
    },
    football: {
        possessionChart: null,
        shotAnalysisChart: null,
        passMapChart: null,
        heatmapChart: null,
        eventTimelineChart: null,
        teamComparisonChart: null
    },
    basketball: {
        scoringChart: null,
        quarterAnalysisChart: null,
        scoringProgressionChart: null,
        basketballComparisonChart: null
    }
};

// Football Charts
function createFootballCharts(match, homeTeam, awayTeam) {
    try {
        console.log('Creating football charts for:', homeTeam, 'vs', awayTeam);
        
        // Clear any existing charts
        Object.values(sportChartInstances.football).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });

        // Only create charts that can show real data
        if (document.getElementById('eventTimelineChart')) {
            createEventTimelineChart(match, homeTeam, awayTeam);
        }

        if (document.getElementById('teamComparisonChart')) {
            createTeamComparisonChart(match, homeTeam, awayTeam);
        }
    } catch (error) {
        console.error('Error creating football charts:', error);
    }
}

function createEventTimelineChart(match, homeTeam, awayTeam) {
    const ctx = document.getElementById('eventTimelineChart').getContext('2d');
    const elapsed = match.fixture.status.elapsed || 0;
    const events = [];

    // Add match start
    events.push({
        x: 0,
        y: 1,
        type: 'Start',
        detail: 'Match Start'
    });

    // Add halftime if match has progressed past it
    if (elapsed > 45) {
        events.push({
            x: 45,
            y: 1,
            type: 'HT',
            detail: 'Half Time'
        });
    }

    // Add current time marker
    events.push({
        x: elapsed,
        y: 1,
        type: 'Current',
        detail: `Current (${elapsed}')`
    });

    // Add score if there are goals
    if (match.goals.home > 0 || match.goals.away > 0) {
        events.push({
            x: elapsed,
            y: 1,
            type: 'Score',
            detail: `${match.goals.home} - ${match.goals.away}`
        });
    }

    sportChartInstances.football.eventTimelineChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Match Events',
                data: events,
                backgroundColor: (context) => {
                    const value = context.raw;
                    if (value.type === 'Start') return 'rgba(75, 192, 192, 1)';
                    if (value.type === 'HT') return 'rgba(255, 206, 86, 1)';
                    if (value.type === 'Current') return 'rgba(255, 99, 132, 1)';
                    if (value.type === 'Score') return 'rgba(54, 162, 235, 1)';
                    return 'rgba(153, 102, 255, 1)';
                },
                pointRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Match Timeline'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const point = events[context.dataIndex];
                            return `${point.type}: ${point.detail}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    display: false,
                    min: 0,
                    max: 2
                },
                x: {
                    title: {
                        display: true,
                        text: 'Match Time (minutes)'
                    },
                    min: 0,
                    max: 90,
                    ticks: {
                        stepSize: 15
                    }
                }
            }
        }
    });
}

function createTeamComparisonChart(match, homeTeam, awayTeam) {
    const ctx = document.getElementById('teamComparisonChart').getContext('2d');
    
    // Only use data we can accurately calculate
    const metrics = {
        home: {
            goals: match.goals.home || 0,
            matchProgress: match.fixture.status.elapsed || 0,
            status: match.fixture.status.short || ''
        },
        away: {
            goals: match.goals.away || 0,
            matchProgress: match.fixture.status.elapsed || 0,
            status: match.fixture.status.short || ''
        }
    };

    sportChartInstances.football.teamComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Goals'],
            datasets: [{
                label: homeTeam,
                data: [metrics.home.goals],
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }, {
                label: awayTeam,
                data: [metrics.away.goals],
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Match Score (${metrics.home.matchProgress}')`
                },
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw} goals`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    title: {
                        display: true,
                        text: 'Goals Scored'
                    }
                }
            }
        }
    });
}

// Basketball Charts
function createBasketballCharts(match, homeTeam, awayTeam) {
    try {
        console.log('Creating basketball charts for:', homeTeam, 'vs', awayTeam);
        
        // Clear any existing charts
        Object.values(sportChartInstances.basketball).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });

        console.log('Creating basketball charts with containers:', {
            scoring: document.getElementById('scoringChart'),
            quarter: document.getElementById('quarterAnalysisChart'),
            progression: document.getElementById('scoringProgressionChart'),
            comparison: document.getElementById('basketballComparisonChart')
        });

        // Create scoring distribution chart
        if (document.getElementById('scoringChart')) {
            createScoringChart(match, homeTeam, awayTeam);
        } else {
            console.error('Scoring chart container not found');
        }

        // Create quarter analysis chart
        if (document.getElementById('quarterAnalysisChart')) {
            createQuarterAnalysisChart(match, homeTeam, awayTeam);
        } else {
            console.error('Quarter analysis chart container not found');
        }

        // Create scoring progression chart
        if (document.getElementById('scoringProgressionChart')) {
            createScoringProgressionChart(match, homeTeam, awayTeam);
        } else {
            console.error('Scoring progression chart container not found');
        }

        // Create team comparison chart
        if (document.getElementById('basketballComparisonChart')) {
            createBasketballComparisonChart(match, homeTeam, awayTeam);
        } else {
            console.error('Basketball comparison chart container not found');
        }
    } catch (error) {
        console.error('Error creating basketball charts:', error);
    }
}

function createScoringChart(match, homeTeam, awayTeam) {
    const ctx = document.getElementById('scoringChart').getContext('2d');
    const homeScores = match.scores.home;
    const awayScores = match.scores.away;

    // Calculate quarter percentages of total score
    const homeTotal = homeScores.total || 0;
    const awayTotal = awayScores.total || 0;

    const homeQuarterPercentages = [
        (homeScores.quarter_1 / homeTotal) * 100 || 0,
        (homeScores.quarter_2 / homeTotal) * 100 || 0,
        (homeScores.quarter_3 / homeTotal) * 100 || 0,
        (homeScores.quarter_4 / homeTotal) * 100 || 0
    ];

    const awayQuarterPercentages = [
        (awayScores.quarter_1 / awayTotal) * 100 || 0,
        (awayScores.quarter_2 / awayTotal) * 100 || 0,
        (awayScores.quarter_3 / awayTotal) * 100 || 0,
        (awayScores.quarter_4 / awayTotal) * 100 || 0
    ];

    sportChartInstances.basketball.scoringChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            datasets: [{
                label: `${homeTeam} (%)`,
                data: homeQuarterPercentages,
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }, {
                label: `${awayTeam} (%)`,
                data: awayQuarterPercentages,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Scoring Distribution by Quarter (%)'
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Percentage of Total Score'
                    }
                }
            }
        }
    });
}

function createQuarterAnalysisChart(match, homeTeam, awayTeam) {
    const ctx = document.getElementById('quarterAnalysisChart').getContext('2d');
    const homeScores = match.scores.home;
    const awayScores = match.scores.away;

    sportChartInstances.basketball.quarterAnalysisChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            datasets: [{
                label: homeTeam,
                data: [
                    homeScores.quarter_1 || 0,
                    homeScores.quarter_2 || 0,
                    homeScores.quarter_3 || 0,
                    homeScores.quarter_4 || 0
                ],
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.4,
                fill: true
            }, {
                label: awayTeam,
                data: [
                    awayScores.quarter_1 || 0,
                    awayScores.quarter_2 || 0,
                    awayScores.quarter_3 || 0,
                    awayScores.quarter_4 || 0
                ],
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Points per Quarter'
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Points'
                    }
                }
            }
        }
    });
}

function createScoringProgressionChart(match, homeTeam, awayTeam) {
    const ctx = document.getElementById('scoringProgressionChart').getContext('2d');
    const homeScores = match.scores.home;
    const awayScores = match.scores.away;

    // Calculate cumulative scores for each quarter
    const homeProgression = [
        homeScores.quarter_1 || 0,
        (homeScores.quarter_1 || 0) + (homeScores.quarter_2 || 0),
        (homeScores.quarter_1 || 0) + (homeScores.quarter_2 || 0) + (homeScores.quarter_3 || 0),
        homeScores.total || 0
    ];

    const awayProgression = [
        awayScores.quarter_1 || 0,
        (awayScores.quarter_1 || 0) + (awayScores.quarter_2 || 0),
        (awayScores.quarter_1 || 0) + (awayScores.quarter_2 || 0) + (awayScores.quarter_3 || 0),
        awayScores.total || 0
    ];

    sportChartInstances.basketball.scoringProgressionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            datasets: [{
                label: homeTeam,
                data: homeProgression,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: awayTeam,
                data: awayProgression,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Cumulative Score Progression'
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Total Points'
                    }
                }
            }
        }
    });
}

function createBasketballComparisonChart(match, homeTeam, awayTeam) {
    const ctx = document.getElementById('basketballComparisonChart').getContext('2d');
    const homeScores = match.scores.home;
    const awayScores = match.scores.away;

    // Calculate performance metrics
    const homeMetrics = {
        scoringEfficiency: (homeScores.total / 100) * 100,
        quarterConsistency: calculateConsistency(homeScores),
        scoringDominance: calculateDominance(homeScores.total, awayScores.total),
        momentum: calculateMomentum(homeScores),
        overallPerformance: (homeScores.total / Math.max(homeScores.total, awayScores.total)) * 100
    };

    const awayMetrics = {
        scoringEfficiency: (awayScores.total / 100) * 100,
        quarterConsistency: calculateConsistency(awayScores),
        scoringDominance: calculateDominance(awayScores.total, homeScores.total),
        momentum: calculateMomentum(awayScores),
        overallPerformance: (awayScores.total / Math.max(homeScores.total, awayScores.total)) * 100
    };

    sportChartInstances.basketball.basketballComparisonChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: [
                'Scoring Efficiency',
                'Quarter Consistency',
                'Scoring Dominance',
                'Momentum',
                'Overall Performance'
            ],
            datasets: [{
                label: homeTeam,
                data: Object.values(homeMetrics),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }, {
                label: awayTeam,
                data: Object.values(awayMetrics),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Team Performance Comparison'
                },
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    }
                }
            }
        }
    });
}

// Helper functions for basketball metrics
function calculateConsistency(scores) {
    const quarters = [
        scores.quarter_1 || 0,
        scores.quarter_2 || 0,
        scores.quarter_3 || 0,
        scores.quarter_4 || 0
    ];
    const avg = quarters.reduce((a, b) => a + b, 0) / 4;
    const variance = quarters.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / 4;
    // Convert variance to a 0-100 scale (lower variance = higher consistency)
    return Math.max(0, 100 - (Math.sqrt(variance) * 2));
}

function calculateDominance(teamScore, opposingScore) {
    if (teamScore === 0 && opposingScore === 0) return 50;
    return Math.min(100, (teamScore / Math.max(teamScore, opposingScore)) * 100);
}

function calculateMomentum(scores) {
    const quarters = [
        scores.quarter_1 || 0,
        scores.quarter_2 || 0,
        scores.quarter_3 || 0,
        scores.quarter_4 || 0
    ];
    // Calculate if team improved over quarters
    let momentum = 50; // Start at neutral momentum
    for (let i = 1; i < quarters.length; i++) {
        if (quarters[i] > quarters[i-1]) momentum += 12.5;
        else if (quarters[i] < quarters[i-1]) momentum -= 12.5;
    }
    return Math.min(100, Math.max(0, momentum));
}

// Cricket Charts
function createCricketCharts(match, team1Name, team2Name) {
    try {
        console.log('Creating cricket charts for:', team1Name, 'vs', team2Name);
        console.log('Match data:', match);
        
        // Clear existing charts
        Object.values(sportChartInstances.cricket).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });

        const partnershipContainer = document.getElementById('partnershipChart');
        const overByOverContainer = document.getElementById('overByOverChart');
        
        console.log('Chart containers:', {
            partnership: partnershipContainer,
            overByOver: overByOverContainer
        });

        if (partnershipContainer) {
            createPartnershipChart(match, team1Name);
        } else {
            console.error('Partnership chart container not found');
        }
        
        if (overByOverContainer) {
            createOverByOverChart(match, team1Name);
        } else {
            console.error('Over-by-over chart container not found');
        }
    } catch (error) {
        console.error('Error creating cricket charts:', error);
    }
}

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

    sportChartInstances.cricket.partnershipChart = new Chart(ctx, {
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
            maintainAspectRatio: false,
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

    sportChartInstances.cricket.overByOverChart = new Chart(ctx, {
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
            maintainAspectRatio: false,
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