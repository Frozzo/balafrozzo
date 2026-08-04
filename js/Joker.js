class Joker {
    constructor(props) {
        Object.assign(this, props);
    }

    static random() {
        return new Joker(JokerRegistry.randomTemplate());
    }
}

const JokerRegistry = {
    pools: {
        common: [
            { id: 'c1', nome: 'Jolly Zoppo', rarita: 'Comune', tipo: '+chips', cond: 'Sempre', val: 30, costo: 1, desc: '+30 Chips in qualsiasi mano.' },
            { id: 'c2', nome: 'Jolly Atletico', rarita: 'Comune', tipo: '+mult', cond: 'Sempre', val: 3, costo: 1, desc: '+3 Mult in qualsiasi mano.' },
            { id: 'c3', nome: 'Gemelli', rarita: 'Comune', tipo: '+chips', cond: 'Coppia', val: 50, costo: 1, desc: '+50 Chips se giochi una Coppia.' },
            { id: 'c4', nome: 'Lupo Solitario', rarita: 'Comune', tipo: '+mult', cond: 'Carta Alta', val: 5, costo: 1, desc: '+5 Mult se la mano è Carta Alta.' },
            { id: 'c5', nome: 'Pugnali', rarita: 'Comune', tipo: '+chips', cond: 'Doppia Coppia', val: 60, costo: 1, desc: '+60 Chips se giochi Doppia Coppia.' },
            { id: 'c6', nome: 'Rosso di Sera', rarita: 'Comune', tipo: '+mult', cond: 'Colore', val: 6, costo: 1, desc: '+6 Mult se giochi un Colore.' }
        ],
        uncommon: [
            { id: 'u1', nome: "Jolly D'Argento", rarita: 'Non Comune', tipo: '+chips', cond: 'Sempre', val: 80, costo: 2, desc: '+80 Chips sempre.' },
            { id: 'u2', nome: 'Jolly Specchio', rarita: 'Non Comune', tipo: 'xmult', cond: 'Coppia', val: 2, costo: 2, desc: 'x2 Mult finale se giochi una Coppia.' },
            { id: 'u3', nome: 'Astrologo', rarita: 'Non Comune', tipo: '+mult', cond: 'Doppia Coppia', val: 12, costo: 2, desc: '+12 Mult su Doppia Coppia.' },
            { id: 'u4', nome: 'Tridente', rarita: 'Non Comune', tipo: '+chips', cond: 'Tris', val: 150, costo: 2, desc: '+150 Chips se giochi un Tris.' },
            { id: 'reg_u1', nome: 'Scorciatoia', rarita: 'Non Comune', tipo: 'regola', cond: 'Passivo', val: 0, costo: 2, desc: 'Permette di fare Scala con solo 4 carte invece di 5.' }
        ],
        rare: [
            { id: 'r1', nome: "Jolly D'Oro", rarita: 'Raro', tipo: '+chips', cond: 'Sempre', val: 200, costo: 3, desc: '+200 Chips sempre.' },
            { id: 'r2', nome: 'Jolly Vampiro', rarita: 'Raro', tipo: 'xmult', cond: 'Sempre', val: 2, costo: 3, desc: 'x2 Mult finale sempre su tutto.' },
            { id: 'r3', nome: 'Pazzia', rarita: 'Raro', tipo: 'xmult', cond: 'Carta Alta', val: 5, costo: 3, desc: 'x5 Mult finale se giochi solo Carta Alta.' },
            { id: 'reg_r1', nome: 'Daltonico', rarita: 'Raro', tipo: 'regola', cond: 'Passivo', val: 0, costo: 3, desc: 'Cuori e Quadri = stesso seme. Picche e Fiori = stesso seme.' }
        ],
        legendary: [
            { id: 'l1', nome: 'Jolly Divino', rarita: 'Leggendario', tipo: 'xmult', cond: 'Sempre', val: 5, costo: 4, desc: 'x5 Mult finale su qualsiasi mano.' },
            { id: 'l2', nome: 'Re Mida', rarita: 'Leggendario', tipo: '+chips', cond: 'Coppia', val: 1000, costo: 4, desc: '+1000 Chips su una semplice Coppia.' },
            { id: 'l3', nome: "L'Onnisciente", rarita: 'Leggendario', tipo: 'xmult', cond: 'Carta Alta', val: 10, costo: 4, desc: 'x10 Mult su Carta Alta.' }
        ]
    },

    randomTemplate() {
        const r = Math.random();
        let pool = this.pools.common;
        if (r > 0.65 && r <= 0.88) pool = this.pools.uncommon;
        else if (r > 0.88 && r <= 0.98) pool = this.pools.rare;
        else if (r > 0.98) pool = this.pools.legendary;
        const base = pool[Math.floor(Math.random() * pool.length)];
        return JSON.parse(JSON.stringify(base));
    }
};

window.Joker = Joker;
window.JokerRegistry = JokerRegistry;
