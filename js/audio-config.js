window.BALAFROZZO_AUDIO_CONFIG = {
    sfx: {
        cardDeal: { sequence: [{ freq: 600, type: 'sine', duration: 0.1, volume: 0.05 }, { delay: 50, freq: 800, type: 'sine', duration: 0.1, volume: 0.05 }] },
        cardFlip: { sequence: [{ freq: 300, type: 'triangle', duration: 0.15, volume: 0.1 }] },
        uiPress: { sequence: [{ freq: 880, type: 'square', duration: 0.04, volume: 0.04 }] },
        chipClick: { sequence: [{ freq: 1200, type: 'square', duration: 0.05, volume: 0.05 }] },
        slotTick: { sequence: [{ freq: 1000, type: 'square', duration: 0.05, volume: 0.02 }] }
    },
    music: {
        mode: 'file',
        src: 'The_Merchant%E2%80%99s_Porch.mp3',
        volume: 0.35,
        loop: true,
        allowFallback: true,
        fallback: {
            bgmType: 'square',
            stepMs: 400,
            notes: [
                329.63, 246.94, 261.63, 293.66,
                329.63, 293.66, 261.63, 246.94,
                220.00, 220.00, 261.63, 329.63,
                293.66, 261.63, 246.94, 196.00,
                220.00, 220.00, 246.94, 293.66,
                329.63, 293.66, 261.63, 246.94,
                196.00, 196.00, 246.94, 329.63,
                293.66, 261.63, 220.00
            ]
        }
    }
};