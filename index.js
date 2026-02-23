let myChart;

function processGitHubData(apiResponse) {
  const items = apiResponse.items || [];
  const yearMonthCounts = {};
  let highestCount = 0;
  items.forEach((item) => {
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
  let maxBarsInOneYear = 0;
  labels.forEach((year) => {
    const activeMonths = Object.keys(yearMonthCounts[year]).length;
    if (activeMonths > maxBarsInOneYear) {
      maxBarsInOneYear = activeMonths;
    }
  });
  const datasets = [];
  for (let i = 0; i < maxBarsInOneYear; i++) {
    const datasetData = labels.map((year) => {
      const months = Object.keys(yearMonthCounts[year]).sort((a, b) => a - b);
      return months[i] ? yearMonthCounts[year][months[i]] : 0;
    });
    datasets.push({
      data: datasetData,
      backgroundColor: "#007FFF",
      borderRadius: 5,
      categoryPercentage: 0.8,
      barPercentage: 0.9,
    });
  }
  const dynamicMax = Math.max(100, Math.ceil(highestCount / 100) * 100);
  return { labels, datasets, dynamicMax };
}

function updateChart(chartData) {
  const ctx = document.getElementById("myChart");
  if (myChart) {
    myChart.destroy();
  }
  let actualMax = 0;
  chartData.datasets.forEach((dataset) => {
    const maxInDataset = Math.max(...dataset.data);
    if (maxInDataset > actualMax) actualMax = maxInDataset;
  });
  let finalMax, finalStep;
  if (actualMax <= 10) {
    finalMax = 10;
    finalStep = 2;
  } else if (actualMax <= 50) {
    finalMax = 50;
    finalStep = 10;
  } else if (actualMax <= 100) {
    finalMax = 100;
    finalStep = 50;
  } else {
    finalMax = Math.ceil(actualMax / 100) * 100;
    finalStep = 100;
  }
  if (actualMax === 0) {
    finalMax = 10;
    finalStep = 2;
  }

  const gridColors = ["transparent"];
  for (let i = 0; i < chartData.labels.length - 1; i++) {
    gridColors.push("rgba(255, 255, 255, 0.2)");
  }
  gridColors.push("transparent");

  myChart = new Chart(ctx, {
    type: "bar",
    data: { labels: chartData.labels, datasets: chartData.datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: false,
          border: { display: true, dash: [4, 4], color: "transparent" },
          grid: { display: true, color: gridColors, drawTicks: false },
          ticks: { color: "#fff" },
        },
        y: {
          position: "right",
          min: 0,
          max: finalMax,
          ticks: { stepSize: finalStep, color: "#fff" },
          border: { display: true, dash: [4, 4], color: "transparent" },
          grid: { color: "rgba(255, 255, 255, 0.2)", drawTicks: false },
        },
      },
      plugins: { legend: { display: false } },
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  gsap.from(".searchbar", {
    y: -100,
    opacity: 0,
    duration: 1.2,
    ease: "power4.out",
  });

  const searchBtn = document.querySelector(".searchIcon");
  const loader = document.getElementById("loading-overlay");

  searchBtn.addEventListener("click", async () => {
    const user = document.querySelector("#username").value;
    const repo = document.querySelector("#repo").value;

    if (!user || !repo) return alert("Enter both fields!");

    loader.style.display = "flex";

    try {
      // 1. Fetch Basic Profile (for Followers)
      const userRes = await fetch(`https://api.github.com/users/${user}`);
      const userData = await userRes.json();

      // 2. Fetch Detailed Stats (for Additions/Deletions)
      const statsRes = await fetch(
        `https://api.github.com/repos/${repo}/stats/contributors`,
      );
      const statsData = await statsRes.json();

      // 3. Fetch Commits (for your Chart - untouched)
      const url = `https://api.github.com/search/commits?q=author:${user}+repo:${repo}&sort=author-date&order=desc&per_page=100`;
      const commitRes = await fetch(url, {
        headers: { Accept: "application/vnd.github.v3+json" },
      });
      const githubData = await commitRes.json();

      if (githubData.items && githubData.items.length > 0) {
        revealLayout();

        // Calculate Additions/Deletions from statsData
        let totalAdds = 0;
        let totalDels = 0;

        // Find the specific user in the contributors array
        const userStats = statsData.find(
          (u) => u.author.login.toLowerCase() === user.toLowerCase(),
        );
        if (userStats) {
          userStats.weeks.forEach((week) => {
            totalAdds += week.a;
            totalDels += week.d;
          });
        }

        // Update UI
        document.getElementById("display-name").textContent =
          userData.name || userData.login;
        document.getElementById("profile-pic").src = userData.avatar_url;
        document.getElementById("follower-count").textContent =
          userData.followers;
        // document.getElementById('adds-count').textContent = `+${totalAdds.toLocaleString()}`;
        // document.getElementById('dels-count').textContent = `-${totalDels.toLocaleString()}`;

        updateChart(processGitHubData(githubData));
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      loader.style.display = "none";
    }
  });
});

function revealLayout() {
  const tl = gsap.timeline();
  tl.to(".searchbar", { height: "12rem", duration: 0.8, ease: "power3.inOut" })
    .set(".details", { display: "flex" })
    .fromTo(
      ".details",
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.8 },
    );
}
