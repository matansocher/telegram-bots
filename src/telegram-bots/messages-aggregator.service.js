const TIMEOUT_MS = 100;
const messagesCache = {}; // { chatId: { message, timeoutId } }

class MessagesAggregator {
    constructor(processMessageCallback) {
        this.processMessageCallback = processMessageCallback;
    }

    handleIncomingMessage(message) {
        const { id: chatId } = message.chat;
        if (!messagesCache[chatId]) {
            this.handleIncomingMessageNotInCache(chatId, message);
        } else {
            this.handleIncomingMessageInCache(chatId, message);
        }
    }

    handleIncomingMessageNotInCache(chatId, message) {
        const timeoutId = this.startOrResetTimeout(chatId);
        messagesCache[chatId] = { message, timeoutId };
    }

    handleIncomingMessageInCache(chatId, message) {
        const timeoutId = this.startOrResetTimeout(chatId);
        const combinedMessage = { ...messagesCache[chatId].message, ...message };
        messagesCache[chatId] = { message: combinedMessage, timeoutId };
    }

    startOrResetTimeout(chatId) {
        if (messagesCache[chatId] && messagesCache[chatId].timeoutId) {
            clearTimeout(messagesCache[chatId].timeoutId);
        }
        return setTimeout(() => {
            this.handleTimeoutEnd(chatId);
        }, TIMEOUT_MS);
    }

    handleTimeoutEnd(chatId) {
        const { message } = messagesCache[chatId];
        delete messagesCache[chatId];
        this.processMessageCallback(message);
    }
}

module.exports = MessagesAggregator;
