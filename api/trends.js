const googleTrends = require('google-trends-api');

export default async function handler(request, response) {
  try {
    const { keywords, period } = request.query;
    
    // Parse keywords
    const keywordList = keywords ? keywords.split(',').map(k => k.trim()).filter(k => k.length > 0) : ['ETF', '연금투자'];
    if (keywordList.length === 0) keywordList.push('주식');

    // Parse period (default 15 days)
    const days = parseInt(period) || 15;
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - days);

    // Fetch from Google Trends
    const results = await googleTrends.interestOverTime({
      keyword: keywordList,
      startTime: startTime,
      geo: 'KR'
    });

    const parsedData = JSON.parse(results);
    
    // Format data for Chart.js
    const labels = [];
    const datasetsData = Array.from({ length: keywordList.length }, () => []);

    if (parsedData && parsedData.default && parsedData.default.timelineData) {
      parsedData.default.timelineData.forEach(item => {
        // Formatted Axis Time (e.g. "Mar 1")
        labels.push(item.formattedAxisTime);
        
        // Push value for each keyword
        item.value.forEach((val, idx) => {
          if (datasetsData[idx]) {
            datasetsData[idx].push(val);
          }
        });
      });
    }

    return response.status(200).json({
      labels: labels,
      datasets: datasetsData.map((data, index) => ({
        keyword: keywordList[index],
        data: data
      }))
    });

  } catch (error) {
    console.error("Google Trends API Error:", error);
    return response.status(500).json({ error: 'Failed to fetch trends data' });
  }
}
