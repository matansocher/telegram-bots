import { VOICE_PAL_OPTIONS } from './voice-pal.config';
const userActions = {};

export function getCurrentUserAction(chatId) {
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

export function setCurrentUserAction(chatId, action) {
    userActions[chatId] = action;
}

export function removeCurrentUserAction(chatId) {
    delete userActions[chatId];
}
