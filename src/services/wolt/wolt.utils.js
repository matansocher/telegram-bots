const { WOLT_BOT_OPTIONS } = require('./wolt.config');


function getKeyboardOptions() {
    return {
        reply_markup: {
            keyboard: Object.keys(WOLT_BOT_OPTIONS).map(option => {
                return [{ text: WOLT_BOT_OPTIONS[option] }];
            }),
            resize_keyboard: true,
        },
    }
}

module.exports = {
    getKeyboardOptions,
};
