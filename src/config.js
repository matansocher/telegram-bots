const isProd = process.env.IS_PROD === 'true';

const BOTS = {
    WOLT: {
        name: 'Wolt Bot',
    },
    VOICE_PAL: {
        name: 'Voice Pal Bot',
    },
};

module.exports = {
    isProd,
    BOTS,
};
