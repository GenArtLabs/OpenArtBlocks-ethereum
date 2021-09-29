const express = require('express');
const { getMetadata, getLive, getImage } = require('./api');
const compression = require('compression');
const cors = require('cors');

// initialize express app
const app = express();
const port = process.env.PORT || 3333;

app.use(cors());

// configure middlewares
app.use(compression());
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// const publicAdminRoot = 'dist';
// app.get('/', (req, res) => {
//   res.sendFile('index.html', { root: publicAdminRoot });
// });
// app.use(express.static(publicAdminRoot));


app.get('/api/:id', getMetadata);
app.get('/live/:id', getLive);
app.get('/:id', getImage);

app.listen(port, () => {
  console.log(`Maker listening on port ${port}`);
});
