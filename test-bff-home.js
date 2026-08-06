const axios = require('axios');

const kakaoPageBffApi = axios.create({
  baseURL: 'https://bff-page.kakao.com/api/gateway/api/v1',
  headers: {
    Referer: 'https://page.kakao.com/',
    Origin: 'https://page.kakao.com',
  },
  timeout: 30_000,
});

async function test() {
  const ids = [57925268, 62500829];
  for (const id of ids) {
    try {
      const res = await kakaoPageBffApi.get(`/content/home?series_id=${id}`);
      console.log(`=== ID: ${id} ===`);
      console.log("Keys in response:", Object.keys(res.data?.result || {}));
      if (res.data?.result?.meta) {
        console.log("Meta fields:", res.data.result.meta);
      }
      if (res.data?.result?.series) {
        console.log("Series fields:", {
          title: res.data.result.series.title,
          state: res.data.result.series.state,
          on_issue: res.data.result.series.on_issue,
          on_issue_state: res.data.result.series.on_issue_state,
        });
      }
    } catch (err) {
      console.error(`ID: ${id} error:`, err.message);
    }
  }
}

test();
