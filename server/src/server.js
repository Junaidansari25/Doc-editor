require('dotenv').config();
const { createApp } = require('./app');

const port = process.env.PORT || 4000;
const app = createApp();

app.listen(port, () => {
  console.log(`Ajaia Docs Lite API running on http://localhost:${port}`);
});
