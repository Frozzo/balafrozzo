window.JokerFactory = {
    create(dbJoker) {
        const r = Math.random();
        let pool = dbJoker.common;
        if (r > 0.65 && r <= 0.88) pool = dbJoker.uncommon;
        else if (r > 0.88 && r <= 0.98) pool = dbJoker.rare;
        else if (r > 0.98) pool = dbJoker.legendary;
        const base = pool[Math.floor(Math.random() * pool.length)];
        return JSON.parse(JSON.stringify(base));
    }
};