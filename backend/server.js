const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

app.get('/api', (req, res) => {
  res.json({ message: 'Hello from backend' });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
