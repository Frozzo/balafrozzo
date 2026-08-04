window.HandEvaluator = {
    evaluate(carteMano, carteTerra, proprietario, balatroScores) {
        const tutte = carteMano.concat(carteTerra);
        if (tutte.length === 0) {
            return { nome: 'Carta Alta', base: { chips: 0, mult: 0 }, migliori: [], carteAttive: [] };
        }

        const haScorciatoia = proprietario.jokers.some(joker => joker.id === 'reg_u1');
        const haDaltonico = proprietario.jokers.some(joker => joker.id === 'reg_r1');

        tutte.sort((a, b) => b.valoreChip - a.valoreChip);
        const counts = {};
        const suits = {};
        for (const carta of tutte) {
            counts[carta.valoreChip] = (counts[carta.valoreChip] || 0) + 1;
            suits[carta.seme] = (suits[carta.seme] || 0) + 1;
        }

        let isFlush = false;
        if (haDaltonico) {
            const rossi = (suits['♥'] || 0) + (suits['♦'] || 0);
            const neri = (suits['♣'] || 0) + (suits['♠'] || 0);
            isFlush = rossi >= 5 || neri >= 5;
        } else {
            for (const suit of Object.keys(suits)) {
                if (suits[suit] >= 5) {
                    isFlush = true;
                    break;
                }
            }
        }

        const uniqueVals = [...new Set(tutte.map(carta => carta.valoreChip))];
        if (uniqueVals.includes(14)) uniqueVals.push(1);
        uniqueVals.sort((a, b) => b - a);

        let isStraight = false;
        let straightCount = 1;
        const cartePerScala = haScorciatoia ? 4 : 5;
        for (let i = 0; i < uniqueVals.length - 1; i++) {
            if (uniqueVals[i] - 1 === uniqueVals[i + 1]) {
                straightCount++;
                if (straightCount >= cartePerScala) {
                    isStraight = true;
                    break;
                }
            } else {
                straightCount = 1;
            }
        }

        const freq = Object.values(counts).sort((a, b) => b - a);
        const maxFreq = freq[0] || 0;
        const secFreq = freq[1] || 0;

        let nomeMano = 'Carta Alta';
        if (isStraight && isFlush) nomeMano = 'Scala Colore';
        else if (maxFreq === 4) nomeMano = 'Poker';
        else if (maxFreq === 3 && secFreq >= 2) nomeMano = 'Full';
        else if (isFlush) nomeMano = 'Colore';
        else if (isStraight) nomeMano = 'Scala';
        else if (maxFreq === 3) nomeMano = 'Tris';
        else if (maxFreq === 2 && secFreq >= 2) nomeMano = 'Doppia Coppia';
        else if (maxFreq === 2) nomeMano = 'Coppia';

        let multBase = balatroScores[nomeMano].mult;
        if (proprietario.charm && proprietario.charm.id === 4 && (nomeMano === 'Carta Alta' || nomeMano === 'Coppia')) {
            multBase += 1;
        }

        const migliori5 = tutte.slice(0, 5);
        let carteAttive = [];
        if (nomeMano === 'Carta Alta') {
            carteAttive = [tutte[0]];
        } else if (nomeMano === 'Coppia' || nomeMano === 'Doppia Coppia' || nomeMano === 'Tris' || nomeMano === 'Poker' || nomeMano === 'Full') {
            carteAttive = tutte.filter(carta => counts[carta.valoreChip] >= 2);
        } else {
            carteAttive = migliori5;
        }

        return {
            nome: nomeMano,
            base: { chips: balatroScores[nomeMano].chips, mult: multBase },
            migliori: migliori5,
            carteAttive
        };
    }
};