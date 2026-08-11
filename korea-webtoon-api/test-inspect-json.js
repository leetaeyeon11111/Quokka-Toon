const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'cross-webtoon.db');
console.log('Connecting to SQLite DB at:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(err.message);
    return;
  }

  db.all(`SELECT title, raw_json FROM webtoons LIMIT 5;`, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      db.close();
      return;
    }

    rows.forEach((row, i) => {
      console.log(`\n--- Item [${i}] Title: ${row.title} ---`);
      try {
        const data = JSON.parse(row.raw_json);
        console.log(JSON.stringify(data, null, 2));
      } catch (err) {
        console.log('JSON parse failed:', row.raw_json);
      }
    });

    db.close();
  });
});
