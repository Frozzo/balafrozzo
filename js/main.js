// Dati e modelli locali: il gioco gira ora senza server e senza moduli ES6.
const semi = ['♥', '♦', '♣', '♠'];
const valori = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function ottieniValoreChip(val) {
    if (['J', 'Q', 'K', 'A'].includes(val)) return [11, 12, 13, 14][['J', 'Q', 'K', 'A'].indexOf(val)];
    return parseInt(val);
}

const balatroScores = {
    "Scala Reale": { chips: 100, mult: 8 },
    "Scala Colore": { chips: 100, mult: 8 },
    "Poker": { chips: 60, mult: 7 },
    "Full": { chips: 40, mult: 4 },
    "Colore": { chips: 35, mult: 4 },
    "Scala": { chips: 30, mult: 4 },
    "Tris": { chips: 30, mult: 3 },
    "Doppia Coppia": { chips: 20, mult: 2 },
    "Coppia": { chips: 10, mult: 2 },
    "Carta Alta": { chips: 5, mult: 1 }
};

function getListaCharms() {
    return CharmRegistry.defaultList();
}

function getDbJoker() {
    return JokerRegistry.pools;
}

class Player {
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

class Deck {
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

const attendi = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const defaultStatistiche = {
    soldiTotali: 0,
    giocate: 0,
    vinte: 0,
    // nuove statistiche per azioni/round
    folds: 0,
    raises: 0,
    allins: 0,
    roundsPlayed: 0,
    roundsWon: 0,
    roundsLost: 0
};

let statistiche = { ...defaultStatistiche };

function caricaStatisticheLocali() {
    let stored = localStorage.getItem('balafrozzo_stats');
    if (stored) {
        try {
            let s = JSON.parse(stored);
            statistiche = Object.assign({ ...defaultStatistiche }, s);
        } catch (e) {
            console.warn('errore parsing stats locali', e);
            statistiche = { ...defaultStatistiche };
        }
    }
}

function salvaStatisticheLocali() {
    localStorage.setItem('balafrozzo_stats', JSON.stringify(statistiche));
}

let currentUser = null;

function showLoginScreen() {
    GameUI.setLoginOverlayVisible(true);
}
function hideLoginScreen() {
    GameUI.setLoginOverlayVisible(false);
}

function showMenu() {
    GameUI.showMenu();
    aggiornaStatsUI();
}

function logoutUser() {
    currentUser = null;
    statistiche = { ...defaultStatistiche };
    salvaStatisticheLocali();
    aggiornaStatsUI();
    showMenu();
}

function initLogoutVisibility() {
    GameUI.setLogoutVisible(false);
}

document.addEventListener('DOMContentLoaded', () => {
    const btnGuest = document.getElementById('btn-guest');
    if(btnGuest) btnGuest.onclick = () => {
        hideLoginScreen();
        showMenu();
        initLogoutVisibility();
    };
    const btnLogout = document.getElementById('btn-logout');
    if(btnLogout) btnLogout.onclick = logoutUser;
});

function salvaStatistiche() {
    salvaStatisticheLocali();
}

function aggiornaStatsUI() {
    GameUI.renderStats(statistiche);
}

function loginUser() {
    const nameField = document.getElementById('login-username');
    const msg = document.getElementById('login-msg');
    const user = nameField ? nameField.value.trim() : '';
    if (msg) msg.innerText = '';
    if (user) {
        currentUser = user;
        localStorage.setItem('balafrozzo_user', user);
        localStorage.setItem('balafrozzo_player_name', user);
    }
    hideLoginScreen();
    showMenu();
    initLogoutVisibility();
}

function registerUser() {
    loginUser();
}

let charmScelto = null; 
let rerollDisponibili = 0; 
let rerollShopRimanenti = 0;
let giocatori = []; 
let mioIndice = 0; 
let piatto = 0;
let mazzo = []; 
let carteComuniDati = []; 
let carteComuniDivs = [];
let faseGioco = 0; 
let valoreRaise = 50; 
let raiseActionLock = false;
let puntataAttualeDaCoprire = 0; 
let roundCorrente = 1; 
let maxRounds = 5;
let shopTimerInterval = null;
let shopTimeRemaining = 0;

const nomiFasi = ["PRE-FLOP", "FLOP", "TURN", "RIVER", "SHOWDOWN"];

// === INIZIALIZZAZIONE ===
window.onload = function() {
    caricaStatisticheLocali();
    document.getElementById('stat-soldi').innerText = `€ ${statistiche.soldiTotali}`;
    document.getElementById('stat-giocate').innerText = statistiche.giocate; 
    document.getElementById('stat-vinte').innerText = statistiche.vinte;
    // populate score list if the game partial is already in the DOM
    let cont = document.getElementById('lista-punteggi');
    if (cont) {
        Object.keys(balatroScores).reverse().forEach(m => { 
            let idRiga = "riga-" + m.replace(/\s+/g, '-'); 
            cont.innerHTML += `<div class="riga-punteggio" id="${idRiga}"><span>${m}</span><span class="chips-mult" id="lbl-mult-${idRiga}">${balatroScores[m].chips}X${balatroScores[m].mult}</span></div>`; 
        });
    }
    
    document.getElementById('btn-prepara').onclick = () => {
        inizializzaAudioEAvvia();
    };
    document.getElementById('btn-conferma-charm').onclick = avviaDalMenu;

    const bLogin = document.getElementById('btn-login');
    if (bLogin) { bLogin.onclick = loginUser; }
    const bReg = document.getElementById('btn-register');
    if (bReg) { bReg.onclick = registerUser; }
    const bGuest = document.getElementById('btn-guest');
    if (bGuest) { 
        bGuest.onclick = () => {
            currentUser = null;
            hideLoginScreen();
            showMenu();
            initLogoutVisibility();
        };
    }
    const bLogout = document.getElementById('btn-logout');
    if (bLogout) bLogout.onclick = logoutUser;

    hideLoginScreen();
    showMenu();
    initLogoutVisibility();
};

function mostraSceltaCharms() {
    GameUI.renderCharmSelection(getListaCharms(), statistiche, (charm, card) => {
        document.querySelectorAll('.carta-charm').forEach(el => el.classList.remove('selezionato'));
        card.classList.add('selezionato');
        charmScelto = charm.id;
        document.getElementById('btn-conferma-charm').disabled = false;
    });
}

function getColoreJoker(rarita) {
    if(rarita === "Comune") return "c-comune joker-common"; 
    if(rarita === "Non Comune") return "c-noncomune joker-uncommon";
    if(rarita === "Raro") return "c-raro joker-rare"; 
    return "c-leggendario joker-legendary";
}

function contaSlotJoker(g) { 
    return g.jokers.filter(j => j.edition !== "Negative").length; 
}

function vendiJoker(index) {
    playChipClick();
    let me = giocatori[0];
    let j = me.jokers[index];
    let rimborso = Math.ceil(j.costo / 2);
    me.crediti += rimborso;
    me.jokers.splice(index, 1);
    aggiornaSidebarJokers();
    aggiornaGraficaGiocatori();
    if(document.getElementById('schermo-shop').style.display === 'flex') {
        document.getElementById('soldi-shop').innerText = `${me.crediti} 🟡`;
        aggiornaInventarioShop();
    }
}

function getClasseEdizione(edition) {
    if(edition === "Foil") return "ed-foil";
    if(edition === "Polychrome") return "ed-poly";
    if(edition === "Negative") return "ed-neg";
    return "";
}

function getBadgeEdizione(edition) {
    if(!edition) return "";
    if(edition === "Foil") return `<span class="badge-edition">✨ Foil (+10 Mult)</span>`;
    if(edition === "Polychrome") return `<span class="badge-edition">🌈 Poly (x1.5 Mult)</span>`;
    if(edition === "Negative") return `<span class="badge-edition">⬛ Negative (+1 Slot)</span>`;
    return "";
}

function aggiornaSidebarJokers() {
    let container = document.getElementById('sidebar-jokers');
    container.innerHTML = '';
    let me = giocatori[0];
    if (!me) return;

    document.getElementById('slot-jokers').innerText = `${contaSlotJoker(me)}/4`;

    if (me.charm) {
        container.innerHTML += `
        <div class="sidebar-item sidebar-charm">
            <div class="side-j-titolo">✨ ${me.charm.nome}</div>
            <div class="side-j-desc">${me.charm.desc}</div>
        </div>`;
    }

    me.jokers.forEach((j, index) => {
        let jDiv = document.createElement('div');
        let cssEd = getClasseEdizione(j.edition);
        jDiv.className = `sidebar-item ${getColoreJoker(j.rarita)} ${cssEd}`;
        jDiv.draggable = true;
        
        let rimborso = Math.ceil(j.costo / 2);
        let badge = getBadgeEdizione(j.edition);
        
        jDiv.innerHTML = `
            <div class="side-j-titolo">${j.nome} <span style="font-size:10px; opacity:0.7;">(${j.rarita})</span></div>
            ${badge}
            <div class="side-j-desc">${j.desc}</div>
            <button class="btn-vendi" onclick="vendiJoker(${index})">Vendi (+${rimborso}🟡)</button>
        `;
        
        jDiv.ondragstart = (e) => { e.dataTransfer.setData('text/plain', index); jDiv.style.opacity = '0.5'; };
        jDiv.ondragend = (e) => { jDiv.style.opacity = '1'; };
        jDiv.ondragover = (e) => e.preventDefault();
        jDiv.ondrop = (e) => {
            e.preventDefault(); 
            let fromIndex = parseInt(e.dataTransfer.getData('text/plain')); 
            let toIndex = index;
            if(fromIndex === toIndex) return;
            let temp = me.jokers[fromIndex]; 
            me.jokers.splice(fromIndex, 1); 
            me.jokers.splice(toIndex, 0, temp);
            aggiornaSidebarJokers(); 
            aggiornaGraficaGiocatori();
        };
        container.appendChild(jDiv);
    });
}

function aggiornaInventarioShop() {
    let list = document.getElementById('shop-inv-list');
    list.innerHTML = '';
    let me = giocatori[0];
    document.getElementById('shop-slot-jokers').innerText = `${contaSlotJoker(me)}/4`;

    me.jokers.forEach((j, index) => {
        let div = document.createElement('div');
        let cssEd = getClasseEdizione(j.edition);
        div.className = `shop-inv-item ${getColoreJoker(j.rarita)} ${cssEd}`;
        div.innerHTML = `
            <b>${j.nome}</b>
            ${getBadgeEdizione(j.edition)}
            <button class="btn-vendi" onclick="vendiJoker(${index})">Vendi (+${Math.ceil(j.costo/2)})</button>
        `;
        list.appendChild(div);
    });
}

function costruisciHTMLPostazioni() {
    GameUI.renderPlayers(giocatori);
}

function aggiornaGraficaGiocatori() {
    GameUI.renderBoard(giocatori, piatto, getColoreJoker, getClasseEdizione);
    aggiornaSidebarJokers();
}

function avviaDalMenu() {
    statistiche.giocate++; 
    aggiornaStatsUI();
    salvaStatistiche(); 
    roundCorrente = 1;
    // show score panel when match begins
    document.getElementById('pannello-punteggi').style.display = 'flex';
    let nomeP = document.getElementById('input-nome').value || "Tu";
    let numBot = parseInt(document.getElementById('input-bot').value); 
    if(numBot < 1) numBot = 1; 
    if(numBot > 5) numBot = 5;
    maxRounds = parseInt(document.getElementById('input-round').value); 
    if(maxRounds < 1) maxRounds = 1;
    
    let soldiIniziali = (charmScelto === 3) ? statistiche.soldiTotali + 1500 : statistiche.soldiTotali + 1000;
    let mioCharmDati = getListaCharms().find(c => c.id === charmScelto);
    
    giocatori = [];
    giocatori.push({ 
        id: 0, nome: nomeP, soldi: soldiIniziali, crediti: 4, isBot: false, inGioco: true, 
        carte: [], posId: 'pos-giocatore', charm: mioCharmDati, jokers: [] 
    });
    
    let charmsSbloccati = getListaCharms().filter(c => statistiche.giocate >= c.reqGiocate && statistiche.vinte >= c.reqVinte);
    for(let i=1; i<=numBot; i++) {
        let botCharm = charmsSbloccati[Math.floor(Math.random() * charmsSbloccati.length)];
        let soldiBot = (botCharm.id === 3) ? 1500 : 1000;
        giocatori.push({ 
            id: i, nome: "Bot " + i, soldi: soldiBot, crediti: 4, isBot: true, inGioco: true, 
            carte: [], posId: 'pos-bot-' + i, charm: botCharm, jokers: [] 
        });
    }

    if (charmScelto === 1) rerollDisponibili = 1;
    document.getElementById('btn-conferma-charm').disabled = true;

    document.getElementById('schermata-menu').style.display = 'none'; 
    document.getElementById('area-gioco').style.display = 'flex'; 
    document.getElementById('controlli').style.display = 'flex';
    costruisciHTMLPostazioni(); 
    aggiornaGraficaGiocatori(); 
    prossimoStepMano();
}

function ritornaAlMenu() {
    // hide scoreboard panel when leaving game
    document.getElementById('pannello-punteggi').style.display = 'none';
    document.getElementById('area-gioco').style.display = 'none';
    document.getElementById('schermo-shop').style.display = 'none';
    document.getElementById('schermata-menu').style.display = 'flex';
    document.getElementById('btn-inizia').style.display = 'block';
    document.getElementById('stat-soldi').innerText = `€ ${statistiche.soldiTotali}`;
    document.getElementById('stat-giocate').innerText = statistiche.giocate; 
    document.getElementById('stat-vinte').innerText = statistiche.vinte;
    
    faseGioco = 0; 
    piatto = 0; 
    puntataAttualeDaCoprire = 0;
    raiseActionLock = false;
    giocatori = []; 
    charmScelto = null;
    document.querySelectorAll('.carta-charm').forEach(el => el.classList.remove('selezionato'));
    document.getElementById('menu-base').style.display = 'flex';
    document.getElementById('schermata-charms').style.display = 'none';
}

function creaMazzo() { 
    let m=[]; 
    for(let s of semi) 
        for(let v of valori) 
            m.push({valore:v,seme:s,valoreChip:ottieniValoreChip(v)}); 
    return m; 
}

function mescola(m) { 
    for (let i=m.length-1; i>0; i--) { 
        const j=Math.floor(Math.random()*(i+1)); 
        [m[i], m[j]]=[m[j], m[i]]; 
    } 
}

function creaElementoCarta(cartaDati, contenitoreId, ritardo, coperta=false) { 
    setTimeout(playCardDeal, ritardo * 1000);
    let div = document.createElement('div'); 
    div.classList.add('carta', 'animazione-entrata'); 
    div.style.animationDelay = `${ritardo}s`; 
    if (coperta) div.classList.add('coperta'); 
    else { 
        div.innerText = cartaDati.valore + cartaDati.seme; 
        if (['♥','♦'].includes(cartaDati.seme)) div.classList.add('rossa'); 
    } 
    cartaDati.divHTML = div; 
    document.getElementById(contenitoreId).appendChild(div); 
    return div; 
}

async function lanciaFiches(idPostazione, valore, testoSpeciale = null) {
    playChipClick();
    let tavolo = document.getElementById('tavolo-verde'); 
    let postazione = document.getElementById(idPostazione); 
    let centro = document.getElementById('centro-tavolo');
    let fiches = document.createElement('div'); 
    fiches.className = 'fiches-volanti'; 
    fiches.innerText = testoSpeciale ? testoSpeciale : `💵 €${valore}`;
    let rP = postazione.getBoundingClientRect(); 
    let rT = tavolo.getBoundingClientRect();
    fiches.style.left = (rP.left - rT.left + 50) + 'px'; 
    fiches.style.top = (rP.top - rT.top + 20) + 'px';
    tavolo.appendChild(fiches); 
    void fiches.offsetWidth; 
    let rC = centro.getBoundingClientRect();
    fiches.style.left = (rC.left - rT.left + 150) + 'px'; 
    fiches.style.top = (rC.top - rT.top + 20) + 'px';
    fiches.style.transform = 'scale(0.5)'; 
    fiches.style.opacity = '0';
    await attendi(600); 
    fiches.remove(); 
    aggiornaGraficaGiocatori();
}

function impostaBottoni(attivi) { 
    document.querySelectorAll('.btn-gioco').forEach(b => b.disabled = !attivi); 
    document.getElementById('btn-inizia').disabled = attivi;
    if (attivi) raiseActionLock = false;
    let btnCheck = document.getElementById('btn-check');
    if (puntataAttualeDaCoprire > 0) { 
        btnCheck.innerText = `Call (€${puntataAttualeDaCoprire})`; 
        btnCheck.style.backgroundColor = "#e67e22"; 
    } else { 
        btnCheck.innerText = `Check`; 
        btnCheck.style.backgroundColor = "#3498db"; 
    }
}

async function faiRerollCharm() {
    if(rerollDisponibili > 0 && faseGioco === 0) {
        rerollDisponibili--; 
        document.getElementById('btn-reroll').style.display = 'none';
        let me = giocatori[0]; 
        document.getElementById(`mano-0`).innerHTML = ''; 
        me.carte = [mazzo.pop(), mazzo.pop()]; 
        creaElementoCarta(me.carte[0], `mano-0`, 0); 
        creaElementoCarta(me.carte[1], `mano-0`, 0.1); 
        aggiornaRadarMano();
    }
}

function valutaManoCompleta(carteMano, carteTerra, proprietario) {
    const result = HandEvaluator.evaluate(carteMano, carteTerra, proprietario, balatroScores);
    window.dispatchEvent(new CustomEvent('balafrozzo:handEvaluated', {
        detail: { result, proprietario }
    }));
    return result;
}

function aggiornaRadarMano() {
    document.querySelectorAll('.riga-punteggio').forEach(el => el.classList.remove('evidenziata')); 
    document.querySelectorAll('.carta').forEach(el => el.classList.remove('carta-evidenziata'));
    let me = giocatori[0]; 
    if (!me.inGioco || me.carte.length === 0) return;

    let carteScoperte = carteComuniDati.slice(0, (faseGioco === 1 ? 3 : (faseGioco === 2 ? 4 : (faseGioco >= 3 ? 5 : 0))));
    let miaValutazione = valutaManoCompleta(me.carte, carteScoperte, me); 
    let idRiga = "riga-" + miaValutazione.nome.replace(/\s+/g, '-'); 
    let riga = document.getElementById(idRiga);
    
    if (riga) { 
        riga.classList.add('evidenziata'); 
        let testoMult = document.getElementById(`lbl-mult-${idRiga}`); 
        if (testoMult) testoMult.innerText = `${miaValutazione.base.chips}X${miaValutazione.base.mult}`; 
    }
    for (let c of miaValutazione.carteAttive) { 
        if (c.divHTML && !c.divHTML.classList.contains('coperta')) { 
            c.divHTML.classList.add('carta-evidenziata'); 
        } 
    }
}

async function iniziaMano() {
    faseGioco = 0; 
    piatto = 0; 
    valoreRaise = 50; 
    puntataAttualeDaCoprire = 0; 
    document.getElementById('btn-raise').innerText = "Raise (€50)";
    document.getElementById('carte-comuni').innerHTML = ''; 
    document.getElementById('indicatore-fase').innerText = nomiFasi[faseGioco];
    document.getElementById('indicatore-round').innerText = `ROUND ${roundCorrente} / ${maxRounds}`;
    document.getElementById('annuncio-vincitore').style.display = 'none';
    document.getElementById('btn-inizia').style.display = 'none'; 

    if(rerollDisponibili > 0) document.getElementById('btn-reroll').style.display = 'block'; 
    else document.getElementById('btn-reroll').style.display = 'none';

    for(let g of giocatori) { 
        g.inGioco = g.soldi > 0; 
        g.carte = []; 
        document.getElementById(`mano-${g.id}`).innerHTML = ''; 
        document.getElementById(`scorebox-${g.id}`).style.display = 'none'; 
        document.getElementById(`scorebox-${g.id}`).classList.remove('vincitore-glow');
    }
    aggiornaGraficaGiocatori(); 
    aggiornaRadarMano();

    let ante = 10; 
    let animazioni = [];
    for(let g of giocatori) { 
        if(g.inGioco && g.soldi >= ante) { 
            g.soldi -= ante; 
            piatto += ante; 
            animazioni.push(lanciaFiches(g.posId, ante, "Ante")); 
        } 
    }
    await Promise.all(animazioni);

    mazzo = creaMazzo(); 
    mescola(mazzo);
    let delay = 0;
    for(let g of giocatori) { 
        if(g.inGioco) { 
            g.carte = [mazzo.pop(), mazzo.pop()]; 
            creaElementoCarta(g.carte[0], `mano-${g.id}`, delay, g.isBot); 
            creaElementoCarta(g.carte[1], `mano-${g.id}`, delay + 0.1, g.isBot); 
            delay += 0.2; 
        } 
    }

    carteComuniDati = [mazzo.pop(), mazzo.pop(), mazzo.pop(), mazzo.pop(), mazzo.pop()]; 
    carteComuniDivs = [];
    for (let i=0; i<5; i++) { 
        carteComuniDivs.push(creaElementoCarta(carteComuniDati[i], 'carte-comuni', delay + (i*0.1), true)); 
    }

    await attendi((delay + 0.5) * 1000); 
    aggiornaRadarMano(); 
    impostaBottoni(true);
}

function assegnaEdizione(giocatore) {
    let chanceFoil = 0.15; 
    let chancePoly = 0.10; 
    let chanceNeg = 0.05;
    if (giocatore.charm && giocatore.charm.id === 5) {
        chanceFoil *= 1.5; 
        chancePoly *= 1.5; 
        chanceNeg *= 1.5;
    }
    let r = Math.random();
    if (r < chanceNeg) return "Negative";
    if (r < chanceNeg + chancePoly) return "Polychrome";
    if (r < chanceNeg + chancePoly + chanceFoil) return "Foil";
    return null;
}

function generaJokerRandom() {
    return JokerFactory.create(getDbJoker());
}

function popolaCarteShop() {
    playCardDeal();
    let container = document.getElementById('container-joker-shop');
    container.innerHTML = '';
    let me = giocatori[0];
    let shopItems = [generaJokerRandom(), generaJokerRandom(), generaJokerRandom(), generaJokerRandom()];

    shopItems.forEach((j, index) => {
        j.edition = assegnaEdizione(me);
        if (j.edition === "Negative") j.costo *= 2;

        let div = document.createElement('div');
        let cssClass = getColoreJoker(j.rarita);
        let edClass = getClasseEdizione(j.edition);
        let badge = getBadgeEdizione(j.edition);
        
        let animClass = "";
        if(j.rarita==="Non Comune") animClass="anim-uncommon";
        if(j.rarita==="Raro") animClass="anim-rare";
        if(j.rarita==="Leggendario") animClass="anim-legendary";

        div.className = `carta-joker-shop ${cssClass} ${edClass} ${animClass}`;
        div.innerHTML = `
            <div class="j-nome">${j.nome}</div>
            <div class="j-rarita">${j.rarita}</div>
            ${badge}
            <div class="j-desc">${j.desc}</div>
            <div class="j-costo">${j.costo} 🟡</div>
            <button class="btn-compra" id="btn-compra-${index}">Compra</button>
        `;
        container.appendChild(div);

        document.getElementById(`btn-compra-${index}`).onclick = function() {
            let me = giocatori[0];
            let slotsOccupati = contaSlotJoker(me);
            let occupaSlot = (j.edition !== "Negative");

            if(me.crediti >= j.costo) {
                if(occupaSlot && slotsOccupati >= 4) {
                    alert("Hai raggiunto il limite di 4 Joker normali! Vendi qualcosa o cerca Joker Negativi.");
                    return;
                }
                playChipClick();
                me.crediti -= j.costo;
                me.jokers.push(j);
                document.getElementById('soldi-shop').innerText = `${me.crediti} 🟡`;
                aggiornaInventarioShop();
                this.innerText = "VENDUTO"; 
                this.disabled = true; 
                this.style.background = "#555"; 
                this.style.color = "#888";
            }
        };
    });
    return shopItems;
}

function aggiornaBtnReroll() {
    let btn = document.getElementById('btn-shop-reroll');
    btn.innerText = `Reroll (1 🟡) - Rimasti: ${rerollShopRimanenti}`;
    if (rerollShopRimanenti <= 0 || giocatori[0].crediti < 1) btn.disabled = true; 
    else btn.disabled = false;
}

function eseguiRerollShop() {
    let me = giocatori[0];
    if (rerollShopRimanenti > 0 && me.crediti >= 1) {
        playChipClick();
        me.crediti -= 1;
        rerollShopRimanenti--;
        document.getElementById('soldi-shop').innerText = `${me.crediti} 🟡`;
        popolaCarteShop();
        aggiornaBtnReroll();
    }
}

function apriShop() {
    document.getElementById('schermo-shop').style.display = 'flex';
    document.getElementById('soldi-shop').innerText = `${giocatori[0].crediti} 🟡`;
    
    rerollShopRimanenti = roundCorrente;
    aggiornaBtnReroll();
    aggiornaInventarioShop();

    let shopItems = popolaCarteShop();

    for(let g of giocatori) {
        if(g.isBot) {
            let sceltiPerBot = [...shopItems].sort(() => 0.5 - Math.random());
            for(let jb of sceltiPerBot) {
                let slotsOcc = contaSlotJoker(g);
                let occ = (jb.edition !== "Negative");
                if(g.crediti >= jb.costo && (!occ || slotsOcc < 4)) {
                    g.crediti -= jb.costo;
                    g.jokers.push(jb);
                    break; 
                }
            }
        }
    }
    
    // start shop timer: 25s for round 1, 30s for round 2, 35s for round 3, etc.
    shopTimeRemaining = 25 + (roundCorrente - 1) * 5;
    let timerDisplay = document.getElementById('timer-shop');
    if (!timerDisplay) {
        // create timer display if it doesn't exist
        timerDisplay = document.createElement('div');
        timerDisplay.id = 'timer-shop';
        timerDisplay.style.cssText = 'position:absolute;top:20px;right:30px;font-size:32px;font-weight:bold;color:#f1c40f;text-shadow:0 0 10px #f1c40f;';
        document.getElementById('schermo-shop').appendChild(timerDisplay);
    }
    
    // clear any existing timer
    if (shopTimerInterval) clearInterval(shopTimerInterval);
    
    // start countdown
    shopTimerInterval = setInterval(() => {
        shopTimeRemaining--;
        if (timerDisplay) timerDisplay.innerText = `${shopTimeRemaining}s`;
        
        if (shopTimeRemaining <= 0) {
            clearInterval(shopTimerInterval);
            chiudiShop();
        }
    }, 1000);
    
    // show initial time
    timerDisplay.innerText = `${shopTimeRemaining}s`;
}

function chiudiShop() {
    playChipClick();
    if (shopTimerInterval) clearInterval(shopTimerInterval); // stop the timer
    document.getElementById('schermo-shop').style.display = 'none';
    aggiornaGraficaGiocatori();
    roundCorrente++;
    iniziaMano(); 
}

async function prossimoStepMano() {
    if (roundCorrente >= maxRounds && faseGioco >= 4) {
        ritornaAlMenu();
        return;
    }
    if (faseGioco >= 4) { 
        apriShop(); 
    } else { 
        iniziaMano(); 
    }
}

function cambiaRaise(d) { 
    valoreRaise += d; 
    if(valoreRaise<50) valoreRaise=50; 
    let me=giocatori[0]; 
    if(valoreRaise>me.soldi) valoreRaise=me.soldi; 
    document.getElementById('btn-raise').innerText = `Raise (€${valoreRaise})`; 
}

async function faiRaise() {
    if (raiseActionLock) return;

    statistiche.raises++;
    aggiornaStatsUI();
    salvaStatistiche();

    let me = giocatori[mioIndice]; 
    let tot = puntataAttualeDaCoprire + valoreRaise; 
    if (me.soldi >= tot) {
        raiseActionLock = true;
        impostaBottoni(false);
        me.soldi -= tot; 
        piatto += tot; 
        try {
            await lanciaFiches(me.posId, tot); 
        } finally {
            raiseActionLock = false;
        }
        let botA = []; 
        let sc = carteComuniDati.slice(0, (faseGioco === 1 ? 3 : (faseGioco === 2 ? 4 : (faseGioco >= 3 ? 5 : 0))));
        for(let g of giocatori) { 
            if(g.isBot && g.inGioco && g.soldi > 0) { 
                let vB = valutaManoCompleta(g.carte, sc, g); 
                let fM = Object.keys(balatroScores).reverse().indexOf(vB.nome); 
                if (faseGioco >= 1 && fM === 0 && Math.random() < 0.8) { 
                    g.inGioco = false; 
                } else { 
                    let pB = Math.min(valoreRaise, g.soldi); 
                    g.soldi -= pB; 
                    piatto += pB; 
                    botA.push(lanciaFiches(g.posId, pB)); 
                }
            } 
        }
        await Promise.all(botA); 
        puntataAttualeDaCoprire = 0; 
        valoreRaise = 50; 
        document.getElementById('btn-raise').innerText = `Raise (€50)`; 
        avanzaFaseGioco();
    }
}

async function faiCheck() { 
    let me = giocatori[mioIndice]; 
    impostaBottoni(false); 
    if (puntataAttualeDaCoprire > 0) {
        if(me.soldi >= puntataAttualeDaCoprire) { 
            me.soldi -= puntataAttualeDaCoprire; 
            piatto += puntataAttualeDaCoprire; 
            await lanciaFiches(me.posId, puntataAttualeDaCoprire, "Call"); 
        } else { 
            let p = me.soldi; 
            me.soldi = 0; 
            piatto += p; 
            await lanciaFiches(me.posId, p, "All-In Call!"); 
        }
    } else { 
        await attendi(300); 
    }
    puntataAttualeDaCoprire = 0; 
    avanzaFaseGioco(); 
}

async function faiFold() { 
    // statistiche fold
    statistiche.folds++;
    aggiornaStatsUI();
    salvaStatistiche();

    giocatori[mioIndice].inGioco = false; 
    aggiornaGraficaGiocatori(); 
    faseGioco = 4; 
    avanzaFaseGioco(); 
}

async function faiAllIn() {
    // statistiche all-in
    statistiche.allins++;
    aggiornaStatsUI();
    salvaStatistiche();

    let me = giocatori[0]; 
    let punt = me.soldi;
    if(punt > 0) {
        me.soldi = 0; 
        piatto += punt; 
        await lanciaFiches(me.posId, punt, "ALL-IN!");
        let botA=[]; 
        for(let g of giocatori) { 
            if(g.isBot && g.inGioco) { 
                let bp = Math.min(punt, g.soldi); 
                g.soldi -= bp; 
                piatto += bp; 
                botA.push(lanciaFiches(g.posId, bp)); 
            } 
        }
        await Promise.all(botA); 
        faseGioco = 4; 
        avanzaFaseGioco();
    }
}

async function gira(div, d) { 
    if(!div.classList.contains('coperta')) return; 
    div.style.transform="scaleX(0)"; 
    await attendi(150); 
    playCardFlip();
    div.classList.remove('coperta'); 
    div.innerText=d.valore+d.seme; 
    if(['♥','♦'].includes(d.seme)) div.classList.add('rossa'); 
    div.style.transform="scaleX(1)"; 
    await attendi(150); 
}

async function controlloRilancioBot() {
    if (faseGioco === 0 || faseGioco >= 4) return;
    let sc = carteComuniDati.slice(0, (faseGioco === 1 ? 3 : (faseGioco === 2 ? 4 : (faseGioco >= 3 ? 5 : 0))));
    let q = false;
    for(let g of giocatori) {
        if (g.isBot && g.inGioco && g.soldi >= 50 && !q) {
            let v = valutaManoCompleta(g.carte, sc, g);
            let i = Object.keys(balatroScores).reverse().indexOf(v.nome);
            if (i > 0 && Math.random() < 0.3) { 
                q = true; 
                puntataAttualeDaCoprire = 50; 
                g.soldi -= 50; 
                piatto += 50; 
                await lanciaFiches(g.posId, 50, "Raise!"); 
                document.getElementById('indicatore-fase').innerText = `${g.nome.toUpperCase()} RILANCIA!`; 
            }
        }
    }
}

async function avanzaFaseGioco() {
    if(faseGioco < 4 && giocatori[0].inGioco) faseGioco++;
    let attivi = giocatori.filter(g => g.inGioco);
    if (attivi.length === 1 && attivi[0].id === 0) { 
        document.getElementById('indicatore-fase').innerText = "TUTTI FOLDANO! HAI VINTO!"; 
        faseGioco = 4; 
    } else { 
        document.getElementById('indicatore-fase').innerText = nomiFasi[faseGioco]; 
    }

    let ds = 0; 
    if(faseGioco===1) ds=3; 
    else if(faseGioco===2) ds=4; 
    else if(faseGioco>=3) ds=5;
    for(let i=0; i<ds; i++) await gira(carteComuniDivs[i], carteComuniDati[i]);
    aggiornaRadarMano(); 
    if(faseGioco < 4) await controlloRilancioBot(); 
    if (faseGioco > 0) document.getElementById('btn-reroll').style.display = 'none';
    if(faseGioco>=4) { 
        avviaShowdown(); 
    } else { 
        impostaBottoni(true); 
    }
}

async function animaNumero(elemento, start, end, velocita = 30) {
    let corr = start; 
    let step = Math.ceil((end - start) / 40); 
    if(step < 1) step = 1;
    while(corr < end) { 
        corr += step; 
        if(corr > end) corr = end; 
        elemento.innerText = corr; 
        await attendi(velocita); 
    }
}

async function eseguiShowdownGiocatore(g, vincitoreId) {
    let v = valutaManoCompleta(g.carte, carteComuniDati, g);
    let box = document.getElementById(`scorebox-${g.id}`); 
    let tChips = document.getElementById(`scorechips-${g.id}`); 
    let tMult = document.getElementById(`scoremult-${g.id}`);
    
    box.style.display = 'block'; 
    tMult.classList.remove('ruota-mult'); 
    tChips.classList.remove('fuoco'); 
    tChips.style.color = '#3498db'; 
    tMult.style.color = '#e74c3c';
    document.getElementById(`scoretitolo-${g.id}`).innerText = v.nome;
    tChips.innerText = v.base.chips; 
    tMult.innerText = v.base.mult;
    await attendi(1000); 

    let chipsAttuali = v.base.chips; 
    let multAttuale = v.base.mult;
    let isVincitore = (g.id === vincitoreId);

    if (isVincitore || chipsAttuali > 30) tChips.classList.add('fuoco');

    startSlotSound();
    for(let i=0; i<5; i++) { 
        if(v.migliori[i]) { 
            let nt = chipsAttuali + v.migliori[i].valoreChip; 
            await animaNumero(tChips, chipsAttuali, nt, 15); 
            chipsAttuali = nt; 
        } 
    }
    stopSlotSound();

    let iconeJokers = document.getElementById(`jokers-${g.id}`).children;
    let offsetIcone = 0;
    
    if(g.charm) {
        if(iconeJokers[0]) { 
            iconeJokers[0].style.transform = "scale(1.5) translateY(-5px)"; 
            iconeJokers[0].style.boxShadow = "0 0 10px #f1c40f"; 
        }
        await attendi(400);
        if(iconeJokers[0]) { 
            iconeJokers[0].style.transform = "scale(1) translateY(0)"; 
            iconeJokers[0].style.boxShadow = "1px 1px #000"; 
        }
        offsetIcone = 1; 
    }

    if(g.jokers.length > 0) await attendi(200); 
    
    for(let i=0; i<g.jokers.length; i++) {
        let j = g.jokers[i];
        let domIconIndex = i + offsetIcone;
        
        if(j.tipo === "regola") continue; 

        if(j.cond === "Sempre" || j.cond === v.nome) {
            if(iconeJokers[domIconIndex]) { 
                iconeJokers[domIconIndex].style.transform = "scale(1.5) translateY(-5px)"; 
                iconeJokers[domIconIndex].style.boxShadow = "0 0 10px #fff"; 
            }
            startSlotSound();

            if(j.tipo === "+chips") {
                let nt = chipsAttuali + j.val; 
                await animaNumero(tChips, chipsAttuali, nt, 15); 
                chipsAttuali = nt;
            } 
            else if (j.tipo === "+mult") {
                let nm = multAttuale + j.val; 
                await animaNumero(tMult, multAttuale, nm, 15); 
                multAttuale = nm;
            }
            else if (j.tipo === "xmult") {
                tMult.classList.add('ruota-mult');
                let nm = multAttuale * j.val; 
                await animaNumero(tMult, multAttuale, nm, 20); 
                multAttuale = nm;
                setTimeout(() => tMult.classList.remove('ruota-mult'), 500);
            }
            
            if (j.edition === "Foil") {
                let nm = multAttuale + 10; 
                await animaNumero(tMult, multAttuale, nm, 10); 
                multAttuale = nm;
            }
            if (j.edition === "Polychrome") {
                tMult.classList.add('ruota-mult');
                let nm = Math.floor(multAttuale * 1.5); 
                await animaNumero(tMult, multAttuale, nm, 15); 
                multAttuale = nm;
                setTimeout(() => tMult.classList.remove('ruota-mult'), 500);
            }

            stopSlotSound();
            await attendi(400); 
            if(iconeJokers[domIconIndex]) { 
                iconeJokers[domIconIndex].style.transform = "scale(1) translateY(0)"; 
                iconeJokers[domIconIndex].style.boxShadow = "1px 1px #000"; 
            }
        }
    }

    if(isVincitore) { 
        await attendi(800); 
    } 
    
    tMult.classList.add('ruota-mult'); 
    await attendi(400);
    startSlotSound();
    let punteggioFinale = chipsAttuali * multAttuale; 
    await animaNumero(tChips, chipsAttuali, punteggioFinale, 25);
    stopSlotSound();

    if(isVincitore) { 
        box.classList.add('vincitore-glow'); 
        tChips.style.color = "#2ecc71"; 
        tChips.classList.remove('fuoco'); 
    } else { 
        box.style.opacity = '0.6'; 
        tChips.classList.remove('fuoco'); 
    }
}

async function avviaShowdown() {
    impostaBottoni(false); 
    document.getElementById('indicatore-fase').innerText = "SHOWDOWN!";
    
    for(let g of giocatori) { 
        if(g.isBot && g.inGioco) { 
            let manoDiv = document.getElementById(`mano-${g.id}`); 
            manoDiv.innerHTML = ''; 
            creaElementoCarta(g.carte[0], `mano-${g.id}`, 0); 
            creaElementoCarta(g.carte[1], `mano-${g.id}`, 0); 
        } 
    }
    await attendi(800);
    
    let risultati = [];
    for(let g of giocatori) {
        if(g.inGioco) {
            let v = valutaManoCompleta(g.carte, carteComuniDati, g);
            let tempChips = v.base.chips; 
            let tempMult = v.base.mult;
            for(let i=0; i<5; i++) if(v.migliori[i]) tempChips += v.migliori[i].valoreChip;
            for(let j of g.jokers) {
                if(j.tipo === "regola") continue;
                if(j.cond === "Sempre" || j.cond === v.nome) {
                    if(j.tipo === "+chips") tempChips += j.val;
                    else if(j.tipo === "+mult") tempMult += j.val;
                    else if(j.tipo === "xmult") tempMult *= j.val;
                    
                    if (j.edition === "Foil") tempMult += 10;
                    if (j.edition === "Polychrome") tempMult = Math.floor(tempMult * 1.5);
                }
            }
            risultati.push({ id: g.id, tot: tempChips * tempMult });
        }
    }
    risultati.sort((a,b) => b.tot - a.tot);
    
    let vincitoreId = risultati[0].id; 
    let nomeVincitore = giocatori.find(g => g.id === vincitoreId).nome;
    let listaAnimazioni = []; 
    for(let g of giocatori) { 
        if(g.inGioco) listaAnimazioni.push(eseguiShowdownGiocatore(g, vincitoreId)); 
    }
    
    await Promise.all(listaAnimazioni); 
    await attendi(500);
    
    let bannerCentrale = document.getElementById('annuncio-vincitore'); 
    bannerCentrale.style.display = 'block';
    
    // round finished, update counters
    statistiche.roundsPlayed++;
    if (vincitoreId === 0) {
        statistiche.vinte++;
        statistiche.roundsWon++;
        bannerCentrale.innerHTML = `HAI VINTO €${piatto}<br><span style="font-size: 20px;">Punteggio: ${risultati[0].tot.toLocaleString()}</span>`;
        bannerCentrale.style.borderColor = "#2ecc71"; 
        bannerCentrale.style.boxShadow = "0 0 40px #2ecc71";
    } else {
        statistiche.roundsLost++;
        bannerCentrale.innerHTML = `${nomeVincitore.toUpperCase()} VINCE €${piatto}!<br><span style="font-size: 20px;">Punteggio: ${risultati[0].tot.toLocaleString()}</span>`;
        bannerCentrale.style.borderColor = "#e74c3c"; 
        bannerCentrale.style.boxShadow = "0 0 40px #e74c3c";
    }
    // persist new statistics
    aggiornaStatsUI();
    salvaStatistiche();
    
    giocatori.find(g => g.id === vincitoreId).soldi += piatto; 
    piatto = 0; 
    
    for(let g of giocatori) { 
        if(g.id === vincitoreId) g.crediti += 2;
        else g.crediti += 1; 
    }
    
    aggiornaGraficaGiocatori();
    let pD = giocatori[0].soldi - ((charmScelto===3)?1500:1000); 
    statistiche.soldiTotali += pD; 
    if(statistiche.soldiTotali<0) statistiche.soldiTotali=0; 
    salvaStatistiche();

    let btnFine = document.getElementById('btn-inizia'); 
    btnFine.style.display = 'block'; 
    btnFine.disabled = false;
    impostaBottoni(false); // disable all game buttons; only shop button is clickable
    if (roundCorrente < maxRounds) btnFine.innerText = "Vai al Negozio"; 
    else btnFine.innerText = "Partita Finita (Torna al Menu)";
}

// -----------------------------------------------------------------------------
// Rendiamo accessibili alcune funzioni al `window` perché usate da attributi
// `onclick` presenti nell'HTML (inline handlers e generazione dinamica).
// Quando il file viene caricato come <module> i suoi simboli non sono globali.
// -----------------------------------------------------------------------------
window.prossimoStepMano = prossimoStepMano;
window.faiFold = faiFold;
window.faiCheck = faiCheck;
window.cambiaRaise = cambiaRaise;
window.faiRaise = faiRaise;
window.faiAllIn = faiAllIn;
window.faiRerollCharm = faiRerollCharm;
window.chiudiShop = chiudiShop;
window.eseguiRerollShop = eseguiRerollShop;
window.vendiJoker = vendiJoker;
