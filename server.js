const express = require('express');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
// serve static assets from project root
app.use(express.static(__dirname));

const DB_FILE = path.join(__dirname, 'db.json');

function readDb() {
    try {
        let content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content);
    } catch (e) {
        return { users: {} };
    }
}

function writeDb(db) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

app.post('/api/register', async (req, res) => {
    let { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
    let db = readDb();
    if (db.users[username]) {
        return res.status(409).json({ error: 'User already exists' });
    }
    let hash = await bcrypt.hash(password, 10);
    db.users[username] = {
        passwordHash: hash,
        soldi: 0,
        giocate: 0,
        vinte: 0,
        // statistiche round/azioni
        folds: 0,
        raises: 0,
        allins: 0,
        roundsPlayed: 0,
        roundsWon: 0,
        roundsLost: 0,
        charmsUnlocked: [],
    };
    writeDb(db);
    return res.json({ success: true });
});

app.post('/api/login', async (req, res) => {
    let { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
    let db = readDb();
    let user = db.users[username];
    if (!user) return res.status(404).json({ error: 'User not found' });
    let match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    return res.json({ success: true });
});

app.get('/api/profile/:username', (req, res) => {
    let db = readDb();
    let user = db.users[req.params.username];
    if (!user) return res.status(404).json({ error: 'User not found' });
    // omit passwordHash
    let { passwordHash, ...rest } = user;
    res.json(rest);
});

app.post('/api/profile/:username', (req, res) => {
    let db = readDb();
    let user = db.users[req.params.username];
    if (!user) return res.status(404).json({ error: 'User not found' });
    // update allowed fields
    let allowed = ['soldi', 'giocate', 'vinte', 'folds', 'raises', 'allins', 'roundsPlayed', 'roundsWon', 'roundsLost', 'charmsUnlocked'];
    allowed.forEach(key => {
        if (req.body[key] !== undefined) user[key] = req.body[key];
    });
    writeDb(db);
    res.json({ success: true });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
