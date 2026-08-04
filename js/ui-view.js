window.GameUI = {
    setLoginOverlayVisible(visible) {
        const el = document.getElementById('schermata-login');
        if (el) el.style.display = visible ? 'flex' : 'none';
    },

    showMenu() {
        const ids = ['pannello-punteggi', 'schermata-menu', 'schermata-charms', 'area-gioco', 'schermo-shop'];
        const values = ['none', 'flex', 'none', 'none', 'none'];
        ids.forEach((id, index) => {
            const el = document.getElementById(id);
            if (el) el.style.display = values[index];
        });
        const menuBase = document.getElementById('menu-base');
        if (menuBase) menuBase.style.display = 'flex';
    },

    renderStats(statistiche) {
        const fields = {
            'stat-soldi': `€ ${statistiche.soldiTotali}`,
            'stat-giocate': statistiche.giocate,
            'stat-vinte': statistiche.vinte,
            'stat-folds': statistiche.folds,
            'stat-raises': statistiche.raises,
            'stat-allins': statistiche.allins,
            'stat-rounds-played': statistiche.roundsPlayed,
            'stat-rounds-won': statistiche.roundsWon,
            'stat-rounds-lost': statistiche.roundsLost
        };
        Object.entries(fields).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.innerText = value;
        });
    },

    renderCharmSelection(charms, statistiche, onSelectCharm) {
        const menuBase = document.getElementById('menu-base');
        const charmsScreen = document.getElementById('schermata-charms');
        const scorePanel = document.getElementById('pannello-punteggi');
        const container = document.getElementById('contenitore-charms');
        if (menuBase) menuBase.style.display = 'none';
        if (charmsScreen) charmsScreen.style.display = 'flex';
        if (scorePanel) scorePanel.style.display = 'none';
        if (!container) return;

        container.innerHTML = '';
        charms.forEach(charm => {
            const unlocked = statistiche.giocate >= charm.reqGiocate && statistiche.vinte >= charm.reqVinte;
            const card = document.createElement('div');
            card.className = `carta-charm ${unlocked ? '' : 'bloccato'}`;
            card.innerHTML = `<div class="charm-icona">${unlocked ? charm.icona : '🔒'}</div><div style="font-weight:bold; color:#f1c40f; margin-bottom:5px;">${charm.nome}</div><div style="font-size:12px; color:#ccc;">${unlocked ? charm.desc : `Sblocca: Gioca ${charm.reqGiocate}, Vinci ${charm.reqVinte}`}</div>`;
            if (unlocked) {
                card.onclick = () => onSelectCharm(charm, card);
            }
            container.appendChild(card);
        });
    },

    renderPlayers(players) {
        players.forEach(player => {
            const slot = document.getElementById(player.posId);
            if (!slot) return;
            slot.style.display = 'flex';
            slot.innerHTML = `
                <div class="box-fluttuante" id="scorebox-${player.id}">
                    <div class="titolo-mano" id="scoretitolo-${player.id}">Mano</div>
                    <div class="zona-calcolo"><span class="c-chips" id="scorechips-${player.id}">0</span><span style="color:#fff; font-size:14px; margin:0 3px;">X</span><span class="c-mult" id="scoremult-${player.id}">0</span></div>
                </div>
                <div class="zona-joker" id="jokers-${player.id}"></div>
                <div class="nome-giocatore">${player.nome}</div>
                <div class="badge-soldi" id="testosoldi-${player.id}">€ ${player.soldi}</div>
                <div class="msg-fold" id="msgfold-${player.id}" style="display:none;">FOLD</div>
                <div class="mano-carte" id="mano-${player.id}"></div>
            `;
        });
    },

    renderBoard(players, piatto, getColoreJoker, getClasseEdizione) {
        players.forEach(player => {
            const textSoldi = document.getElementById(`testosoldi-${player.id}`);
            const slot = document.getElementById(player.posId);
            const msgFold = document.getElementById(`msgfold-${player.id}`);
            const jokers = document.getElementById(`jokers-${player.id}`);

            if (textSoldi) textSoldi.innerText = `€ ${player.soldi}`;
            if (slot) slot.style.opacity = player.inGioco ? '1' : '0.4';
            if (msgFold) msgFold.style.display = player.inGioco ? 'none' : 'block';
            if (!jokers) return;

            jokers.innerHTML = '';
            if (player.charm) {
                jokers.innerHTML += `<div class="mini-joker charm-icon">✨<div class="custom-tooltip"><b>${player.charm.nome}</b><br>${player.charm.desc}</div></div>`;
            }
            player.jokers.forEach(joker => {
                const colorClass = getColoreJoker(joker.rarita);
                const editionClass = getClasseEdizione(joker.edition);
                const badge = joker.edition ? `<br>[${joker.edition}]` : '';
                jokers.innerHTML += `<div class="mini-joker ${colorClass} ${editionClass}">J<div class="custom-tooltip"><b>${joker.nome}</b>${badge}<br>${joker.desc}</div></div>`;
            });
        });

        const pot = document.getElementById('valore-piatto');
        if (pot) pot.innerText = `€ ${piatto}`;
    },

    setLogoutVisible(visible) {
        const button = document.getElementById('btn-logout');
        if (button) button.style.display = visible ? 'block' : 'none';
    }
};