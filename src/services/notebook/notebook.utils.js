const { NOTEBOOK_BOT_OPTIONS} = require('./notebook.config');

function getKeyboardOptions() {
    return {
        reply_markup: {
            keyboard: Object.keys(NOTEBOOK_BOT_OPTIONS).map(option => {
                return [{ text: NOTEBOOK_BOT_OPTIONS[option] }];
            }),
            resize_keyboard: true,
        },
    }
}

module.exports = {
    getKeyboardOptions
};
