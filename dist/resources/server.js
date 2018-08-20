const express = require('express');
const app = express();
const router = express.Router();
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT;

const main = JSON.parse(fs.readFileSync('package.json', 'utf8')).main;

app.use(express.static(__dirname));
app.use('/', router);

router.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, main));
});

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
