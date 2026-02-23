Project Documentation: GitHub Contributor Insights
1. Title & Objective
"didyoucontribute: A Glassmorphic GitHub Contribution Visualizer"

Technology Chosen: Chart.js for data visualization, GSAP (GreenSock) for high-end animations, and GitHub’s REST API.

Why: I chose these to combine data-heavy technical information with a modern "Glassmorphic" UI aesthetic.

End Goal: To allow users to search for a specific GitHub contributor in any public repository and see their monthly commit frequency over the years.

2. Quick Summary of the Technology
Chart.js: A flexible JavaScript library for rendering HTML5 charts.

GSAP: The industry standard for high-performance web animations.

Use Case: This stack is commonly used in FinTech dashboards and SaaS analytics platforms.

Real-world Example: The GitHub "Contribution Graph" on a user's profile uses similar logic to visualize activity.

3. System Requirements
OS: Windows, Mac, or Linux.

Tools: VS Code (or any text editor), a modern Web Browser.

Dependencies: None (all libraries are loaded via CDN for simplicity).

4. Installation & Setup Instructions
To get this running on your local machine, follow these steps:

    1. Clone the Repository: Open your terminal and run:
    ```Bash
        git clone https://github.com/your-username/maki-stats.git
    ```
    2.Navigate to the Folder:
    ```Bash
        cd maki-stats
    ```

    3. Launch the App: * Right-click index.html in VS Code and select "Open with Live Server".

    4. The app will automatically open at http://127.0.0.1:5500.


5. Minimal Working Example
This app fetches data from the GitHub API and renders a bar chart.

```JavaScript
    // Example of the API call structure
    const url = `https://api.github.com/search/commits?q=author:user+repo:owner/repo`;
    const response = await fetch(url);
    const data = await response.json();
    // This data is then passed to Chart.js to render bars.
    Expected Output: A shrinking search bar that reveals a profile card with follower counts and a bar chart showing commit history.
```

6. AI Prompt Journal
This project was refined through strategic AI collaboration, particularly when dealing with complex API constraints.

Guided API Integration:

Challenge: The GitHub Search API has strict rate limits and requires specific headers to access the commit object.

AI Guidance: You helped me implement the application/vnd.github.v3+json header and a finally block to handle the loading state, ensuring the UI doesn't hang if the API fails.

UI Architecture:

Challenge: "Everything is ok.. but please don't touch anything to do with the chart."

AI Guidance: You provided a "wrapper" approach—writing the CSS and GSAP logic around my existing chart functions to preserve my core data logic while upgrading the visual shell.

7. Common Issues & Fixes
Issue: The GitHub API returned an error for large repositories.

Fix: Added headers specifically requesting the v3+json commit search schema to ensure the API version remained consistent.

Issue: Elements were hidden on page load.

Fix: Used gsap.set(".details", {display: "none"}) to ensure a clean entry animation.

8. References
Chart.js Official Docs

GSAP Animation Documentation

GitHub REST API Reference