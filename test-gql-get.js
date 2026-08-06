const axios = require('axios');

const query = `query contentHomeOverview($seriesId: Long!) {
  contentHomeOverview(seriesId: $seriesId) {
    content {
      title
      onIssue
      state
    }
  }
}`;

async function test() {
  const seriesId = 57925268;
  const url = `https://page.kakao.com/graphql?operationName=contentHomeOverview&query=${encodeURIComponent(query)}&variables=${encodeURIComponent(JSON.stringify({ seriesId }))}`;

  try {
    const res = await axios.get(url, {
      headers: {
        Referer: 'https://page.kakao.com/',
        Origin: 'https://page.kakao.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    console.log("=== GET GraphQL Success! ===");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("GET GraphQL failed:", err.message);
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    }
  }
}

test();
