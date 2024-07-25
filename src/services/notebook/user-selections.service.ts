import { NOTEBOOK_BOT_ACTIONS, NOTEBOOK_BOT_ACTIONS_TO_HANDLE, NOTEBOOK_BOT_ACTIONS_TO_SAVE } from './notebook.config';

const userActions = {};

export function getCurrentUserAction(chatId) {
    const userAction = userActions[chatId];
    if (!userAction) {
        return null;
    }
    const { action, data = {} } = userAction;
    const relevantActionKey = Object.keys(NOTEBOOK_BOT_ACTIONS).find(option => NOTEBOOK_BOT_ACTIONS[option].displayName === action);
    if (!relevantActionKey) {
        return null;
    }
    return { action: NOTEBOOK_BOT_ACTIONS[relevantActionKey], data };
}

export function setCurrentUserAction(chatId, action, data) {
    userActions[chatId] = {
        action,
        data
    };
}

export function removeCurrentUserAction(chatId) {
    delete userActions[chatId];
}
