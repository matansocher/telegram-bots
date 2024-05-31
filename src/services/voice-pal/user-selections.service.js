const userActions = {};

function getCurrentUserAction(chatId) {
    return userActions[chatId];
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
