export class Player {
    constructor({ id, nome, soldi, crediti = 4, isBot = false, posId = '', charm = null, jokers = [] }) {
        this.id = id;
        this.nome = nome;
        this.soldi = soldi;
        this.crediti = crediti;
        this.isBot = isBot;
        this.inGioco = true;
        this.carte = [];
        this.posId = posId;
        this.charm = charm;
        this.jokers = jokers;
    }
}
