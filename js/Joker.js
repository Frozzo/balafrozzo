import { dbJoker } from './data.js';

export class Joker {
    constructor(props) {
        Object.assign(this, props);
    }

    static random() {
        let r = Math.random();
        let pool = dbJoker.common;
        if (r > 0.65 && r <= 0.88) pool = dbJoker.uncommon;
        else if (r > 0.88 && r <= 0.98) pool = dbJoker.rare;
        else if (r > 0.98) pool = dbJoker.legendary;
        let base = pool[Math.floor(Math.random() * pool.length)];
        return new Joker(JSON.parse(JSON.stringify(base)));
    }
}
