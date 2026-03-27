const { initDatabase, db } = require('./src/models/database');

initDatabase();

setTimeout(() => {
  console.log('Checking if tables were created...');
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('Tables created:', tables.map(t => t.name));
    }
    db.close();
  });
}, 1000);