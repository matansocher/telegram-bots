const { VOICE_PAL_OPTIONS} = require('./voice-pal.config');

function getKeyboardOptions() {
    return {
        reply_markup: {
            keyboard: Object.keys(VOICE_PAL_OPTIONS).map(option => {
                return [{ text: VOICE_PAL_OPTIONS[option].displayName }];
            }),
            resize_keyboard: true,
        },
    }
}

module.exports = {
    getKeyboardOptions,
};
