class Charm {
    constructor(data) {
        Object.assign(this, data);
    }

    static listFromRaw(rawList) {
        return rawList.map(d => new Charm(d));
    }

}

const CharmRegistry = {
    defaultList() {
        return [
            new Charm({ id: 1, icona: '🃏', nome: 'Cambio Rapido', desc: 'Puoi scartare e ripescare la tua mano iniziale (1 volta).', reqGiocate: 0, reqVinte: 0 }),
            new Charm({ id: 2, icona: '🛒', nome: 'Cliente VIP', desc: 'Sconto nello Shop (Non ancora attivi).', reqGiocate: 0, reqVinte: 0 }),
            new Charm({ id: 3, icona: '💰', nome: 'Tasche Piene', desc: 'Inizi la partita con 1500€ invece di 1000€.', reqGiocate: 3, reqVinte: 0 }),
            new Charm({ id: 4, icona: '🔥', nome: 'Mano Calda', desc: '+1 Moltiplicatore base a Carta Alta e Coppia.', reqGiocate: 0, reqVinte: 1 }),
            new Charm({ id: 5, icona: '🍀', nome: 'Sculato', desc: 'Aumenta del 50% la probabilità che i Joker nello shop abbiano Edizioni Speciali.', reqGiocate: 5, reqVinte: 2 })
        ];
    }
};

window.Charm = Charm;
window.CharmRegistry = CharmRegistry;
