(function () {
    const config = window.BALAFROZZO_AUDIO_CONFIG;
    let audioCtx = null;
    let bgmInterval = null;
    let slotInterval = null;
    let bgmAudio = null;
    let bgmOscillator = null;
    let bgmGain = null;

    function ensureAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtx;
    }

    function playTone({ freq, type, duration, volume }) {
        const ctx = ensureAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    }

    function playSequence(sequence) {
        sequence.forEach(step => {
            setTimeout(() => playTone(step), step.delay || 0);
        });
    }

    window.inizializzaAudioEAvvia = function () {
        const ctx = ensureAudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        window.avviaBGM();
        if (typeof window.mostraSceltaCharms === 'function') {
            window.mostraSceltaCharms();
        }
    };

    window.playCardDeal = function () {
        playSequence(config.sfx.cardDeal.sequence);
    };

    window.playCardFlip = function () {
        playSequence(config.sfx.cardFlip.sequence);
    };

    window.playChipClick = function () {
        playSequence(config.sfx.chipClick.sequence);
    };

    window.playUiPress = function () {
        playSequence(config.sfx.uiPress.sequence);
    };

    window.startSlotSound = function () {
        if (slotInterval) clearInterval(slotInterval);
        let currentFreq = config.sfx.slotTick.sequence[0].freq;
        slotInterval = setInterval(() => {
            playTone({ ...config.sfx.slotTick.sequence[0], freq: currentFreq });
            currentFreq = currentFreq === 1000 ? 1200 : 1000;
        }, 50);
    };

    window.stopSlotSound = function () {
        if (slotInterval) clearInterval(slotInterval);
        slotInterval = null;
    };

    window.avviaBGM = function () {
        if (config.music.mode === 'file') {
            if (!bgmAudio) {
                const resolvedSrc = new URL(config.music.src, window.location.href).href;
                bgmAudio = new Audio(resolvedSrc);
                bgmAudio.loop = config.music.loop;
                bgmAudio.preload = 'auto';
                bgmAudio.volume = config.music.volume;
                bgmAudio.addEventListener('error', () => {
                    if (config.music.allowFallback) {
                        config.music.mode = 'synth';
                        window.avviaBGM();
                    }
                }, { once: true });
            }
            bgmAudio.currentTime = 0;
            bgmAudio.play().catch(() => {
                if (config.music.allowFallback) {
                    config.music.mode = 'synth';
                    window.avviaBGM();
                }
            });
            return;
        }

        const ctx = ensureAudioContext();
        if (bgmOscillator) return;
        bgmOscillator = ctx.createOscillator();
        bgmGain = ctx.createGain();
        bgmOscillator.type = config.music.fallback.bgmType;
        bgmGain.gain.value = config.music.volume;
        bgmOscillator.connect(bgmGain);
        bgmGain.connect(ctx.destination);
        bgmOscillator.start();

        let index = 0;
        bgmInterval = setInterval(() => {
            if (audioCtx) {
                bgmOscillator.frequency.setTargetAtTime(config.music.fallback.notes[index], ctx.currentTime, 0.2);
            }
            index = (index + 1) % config.music.fallback.notes.length;
        }, config.music.fallback.stepMs);
    };

    window.BalafrozzoAudio = {
        get config() {
            return config;
        }
    };

    document.addEventListener('pointerdown', event => {
        const target = event.target;
        if (!target) return;
        if (target.closest('button, .btn-menu, .btn-gioco, .btn-compra, .btn-vendi, input, select, textarea')) {
            window.playUiPress();
        }
    }, true);

    document.addEventListener('keydown', event => {
        if (event.repeat) return;
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
            const target = event.target;
            if (target && target.closest && target.closest('input, button, select, textarea, [role="button"]')) {
                window.playUiPress();
            }
        }
    }, true);
}());