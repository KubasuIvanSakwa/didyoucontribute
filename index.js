// index.js

let myChart; // Global reference so we can destroy/recreate it on search

// --- 1. DATA PROCESSING HELPER ---
function processGitHubData(apiResponse) {
    const items = apiResponse.items || [];
    const yearMonthCounts = {};
    let highestCount = 0;

    // Group commits by Year, then by Month
    items.forEach(item => {
        const dateStr = item.commit.author.date; 
        const date = new Date(dateStr);
        const year = date.getFullYear().toString();
        const month = date.getMonth(); 

        if (!yearMonthCounts[year]) yearMonthCounts[year] = {};
        if (!yearMonthCounts[year][month]) yearMonthCounts[year][month] = 0;

        yearMonthCounts[year][month]++;

        if (yearMonthCounts[year][month] > highestCount) {
            highestCount = yearMonthCounts[year][month];
        }
    });

    const labels = Object.keys(yearMonthCounts).sort();

    // Find the max number of bars needed for a single year
    let maxBarsInOneYear = 0;
    labels.forEach(year => {
        const activeMonths = Object.keys(yearMonthCounts[year]).length;
        if (activeMonths > maxBarsInOneYear) {
            maxBarsInOneYear = activeMonths;
        }
    });

    // Build the datasets dynamically
    const datasets = [];
    for (let i = 0; i < maxBarsInOneYear; i++) {
        const datasetData = labels.map(year => {
            const months = Object.keys(yearMonthCounts[year]).sort((a,b) => a - b);
            return months[i] ? yearMonthCounts[year][months[i]] : 0;
        });

        datasets.push({
            data: datasetData,
            backgroundColor: '#007FFF',
            borderRadius: 5,
            categoryPercentage: 0.8, // Gap between years
            barPercentage: 0.9       // Gap between bars in the same year
        });
    }

    // Dynamic Max for Y-Axis (nearest 100)
    const dynamicMax = Math.max(100, Math.ceil(highestCount / 100) * 100);

    return { labels, datasets, dynamicMax };
}

function updateChart(chartData) {
    const ctx = document.getElementById('myChart');
    
    if (myChart) {
        myChart.destroy();
    }

    // 1. Calculate Dynamic Scaling
    let actualMax = 0;
    chartData.datasets.forEach(dataset => {
        const maxInDataset = Math.max(...dataset.data);
        if (maxInDataset > actualMax) actualMax = maxInDataset;
    });

    let finalMax, finalStep;
    if (actualMax <= 10) {
        finalMax = 10; finalStep = 2;
    } else if (actualMax <= 50) {
        finalMax = 50; finalStep = 10;
    } else if (actualMax <= 100) {
        finalMax = 100; finalStep = 50;
    } else {
        finalMax = Math.ceil(actualMax / 100) * 100; finalStep = 100;
    }
    if (actualMax === 0) { finalMax = 10; finalStep = 2; }

    // 2. Build the perfect array for the vertical lines
    // For 4 labels, we get 5 lines: [transparent, white, white, white, transparent]
    const gridColors = ['transparent'];
    for (let i = 0; i < chartData.labels.length - 1; i++) {
        gridColors.push('rgba(255, 255, 255, 0.2)');
    }
    gridColors.push('transparent');

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: chartData.datasets
        },
        options: {
            animation: true,
            scales: {
                x: {
                    stacked: false,
                    border: { 
                        display: true,       // MUST BE TRUE to enable dashes!
                        dash: [4, 4],        // This dashes the grid lines!
                        color: 'transparent' // Hides the solid baseline
                    },
                    grid: { 
                        display: true,
                        color: gridColors,   // Feeds our array of colors
                        drawTicks: false,
                        z: -1 
                    },
                    ticks: { color: '#fff', padding: 10 }
                },
                y: {
                    position: 'right',
                    min: 0,
                    max: finalMax,
                    ticks: { stepSize: finalStep, color: '#fff', padding: 10 },
                    border: { 
                        display: true,       // MUST BE TRUE
                        dash: [4, 4], 
                        color: 'transparent' // Hides the right vertical axis line
                    },
                    grid: { 
                        color: 'rgba(255, 255, 255, 0.2)', 
                        drawTicks: false,
                        z: -1 
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: true }
            }
        }
    });
}
// --- 3. MAIN APP LOGIC ---
document.addEventListener("DOMContentLoaded", (event) => {
    // Register GSAP
    if (typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    // Initialize the Chart IMMEDIATELY on load with dummy data
    const initialData = {
        labels: ['2023', '2024', '2025', '2026'],
        datasets: [
            { data: [10, 12, 15, 5], backgroundColor: '#007FFF', borderRadius: 5, categoryPercentage: 0.8, barPercentage: 0.9 },
            { data: [0, 8, 15, 0], backgroundColor: '#007FFF', borderRadius: 5, categoryPercentage: 0.8, barPercentage: 0.9 },
            { data: [0, 0, 10, 0], backgroundColor: '#007FFF', borderRadius: 5, categoryPercentage: 0.8, barPercentage: 0.9 }
        ],
        dynamicMax: 100
    };

    updateChart(initialData);
    console.log('New chart created successfully');

    // Search Button Logic
    const searchBtn = document.querySelector('.searchIcon');

    searchBtn.addEventListener('click', async () => {
        const user = document.querySelector('#username').value;
        const repo = document.querySelector('#repo').value;

        if (!user || !repo) return alert("Enter both fields!");
        if (!repo.includes('/')) return alert("Use format owner/repo");

        try {
            // NOTE: Changed per_page to 100 so the chart actually has data to show!
            const url = `https://api.github.com/search/commits?q=author:${user}+repo:${repo}&sort=author-date&order=desc&per_page=100`;
            const response = await fetch(url, {
                headers: { 'Accept': 'application/vnd.github.v3+json' }
            });

            const githubData = await response.json();

            if (githubData.items && githubData.items.length > 0) {
                console.log("Success:", githubData);
                
                // Update your profile UI
                const authorData = githubData.items[0].author;
                if(authorData) {
                    document.querySelector('.detailsHeader p').textContent = authorData.login || user;
                    document.querySelector('.dp img').src = authorData.avatar_url;
                }

                // Process the fetched data and update the chart
                const processedChartData = processGitHubData(githubData);
                updateChart(processedChartData);

            } else {
                alert("No commits found.");
            }
        } catch (err) {
            console.error("Single fetch error:", err);
        }
    });
});