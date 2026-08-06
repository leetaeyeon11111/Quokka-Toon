const axios = require('axios');

const kakaoPageApi = axios.create({
  baseURL: 'https://page.kakao.com/graphql',
  headers: {
    'Content-Type': 'application/json',
    Referer: 'https://page.kakao.com/',
    Origin: 'https://page.kakao.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  timeout: 30_000,
});

const query = `
query contentHomeOverview($seriesId: Long!) {
  contentHomeOverview(seriesId: $seriesId) {
    content {
      title
      onIssue
    }
  }
}
`;

async function test() {
  const ids = [57925268, 63866183, 63529460];
  for (const id of ids) {
    try {
      const res = await kakaoPageApi.post('', {
        query,
        variables: { seriesId: id },
        operationName: 'contentHomeOverview'
      });
      const content = res.data?.data?.contentHomeOverview?.content;
      console.log(`ID: ${id} | Title: ${content?.title} | onIssue: ${content?.onIssue}`);
    } catch (err) {
      console.error(`ID: ${id} error:`, err.message);
    }
  }
}

test();
