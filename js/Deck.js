import { semi, valori, ottieniValoreChip } from './data.js';

export class Deck {
    constructor() {
        this.cards = [];
        this.reset();
    }

    reset() {
        this.cards = [];
        for (let s of semi) {
            for (let v of valori) {
                this.cards.push({ valore: v, seme: s, valoreChip: ottieniValoreChip(v) });
            }
        }
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        return this.cards.pop();
    }
}
