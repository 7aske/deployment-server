Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const app = express();
const router = express.Router();
const fs_1 = require("fs");
const path_1 = require("path");
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const main = JSON.parse(fs_1.readFileSync('package.json', 'utf8')).main;
app.use(express.static(__dirname));
app.use('/', router);
router.get('/', (req, res) => {
    res.sendFile(path_1.join(__dirname, main));
});
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
