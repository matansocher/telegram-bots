const { VOICE_PAL_OPTIONS } = require('./voice-pal/voice-pal.config');
const userActions = {};

function getCurrentUserAction(chatId) {
    const userAction = userActions[chatId];
    if (!userAction) {
        return null;
    }
    const relevantActionKey = Object.keys(VOICE_PAL_OPTIONS).find(option => VOICE_PAL_OPTIONS[option].displayName === userAction);
    if (!relevantActionKey) {
        return null;
    }
    return VOICE_PAL_OPTIONS[relevantActionKey];
}

function setCurrentUserAction(chatId, action) {
    userActions[chatId] = action;
}

function removeCurrentUserAction(chatId) {
    delete userActions[chatId];
}

module.exports = {
    getCurrentUserAction,
    setCurrentUserAction,
    removeCurrentUserAction,
};
