const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');
db.all("SELECT count(*) FROM naver_webtoon", (err, rows) => {
  console.log("naver_webtoon count:", rows);
});
db.all("SELECT count(*) FROM kakao_webtoon", (err, rows) => {
  console.log("kakao_webtoon count:", rows);
});
db.all("SELECT count(*) FROM normalized_webtoon WHERE provider='NAVER'", (err, rows) => {
  console.log("normalized_webtoon NAVER count:", rows);
});
