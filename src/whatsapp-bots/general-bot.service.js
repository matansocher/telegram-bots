const { get: _get, chunk: _chunk } = require('lodash');
const { BOT_BROADCAST_ACTIONS } = require('../telegram-bots/general-bot.config');
const utilsService = require('../services/utils.service');
const logger = new (require('../services/logger.service.js'))(module.filename);

function getMessageData(message) {
    return {
        chatId: _get(message, 'key.remoteJid', ''),
        whatsappUserId: _get(message, 'key.id', ''),
        username: _get(message, 'pushName', ''),
        text: _get(message, 'message.conversation', '') || _get(message, 'caption', ''),
        audio: _get(message, 'message.audioMessage.url', null),
        video: _get(message, 'message.videoMessage.url', null),
        photo: _get(message, 'message.imageMessage.url', null),
        date: _get(message, 'messageTimestamp', 0) * 1000,
    };
}

async function sendMessage(bot, chatId, messageText, form = {}) {
    try {
        return await bot.sendMessage(chatId, messageText, form);
    } catch (err) {
        logger.error(sendMessage.name, `err: ${utilsService.getErrorMessage(err)}`);
        throw err;
    }
}

async function editMessageText(bot, chatId, messageId, messageText) {
    try {
        return await bot.editMessageText(messageText, { chat_id: chatId, message_id: messageId });
    } catch (err) {
        logger.error(editMessageText.name, `err: ${utilsService.getErrorMessage(err)}`);
        throw err;
    }
}

async function deleteMessage(bot, chatId, messageId) {
    try {
        await bot.deleteMessage(chatId, messageId);
    } catch (err) {
        logger.error(deleteMessage.name, `err: ${utilsService.getErrorMessage(err)}`);
    }
}

async function sendVoice(bot, chatId, audioFilePath) {
    try {
        await bot.sendVoice(chatId, audioFilePath);
    } catch (err) {
        logger.error(sendVoice.name, `err: ${utilsService.getErrorMessage(err)}`);
    }
}

async function sendVenue(bot, chatId, latitude, longitude, title, address) {
    try {
        await bot.sendVenue(chatId, latitude, longitude, title, address);
    } catch (err) {
        logger.error(sendVenue.name, `err: ${utilsService.getErrorMessage(err)}`);
    }
}

async function sendPhoto(bot, chatId, imageUrl, form = {}) {
    try {
        await bot.sendPhoto(chatId, imageUrl, form);
    } catch (err) {
        logger.error(sendPhoto.name, `err: ${utilsService.getErrorMessage(err)}`);
    }
}

function setBotTyping(bot, chatId, action = BOT_BROADCAST_ACTIONS.TYPING) {
    try {
        bot.sendChatAction(chatId, action);
    } catch (err) {
        logger.error(setBotTyping.name, `err: ${utilsService.getErrorMessage(err)}`);
    }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

module.exports = {
    getMessageData,
    sendMessage,
    editMessageText,
    deleteMessage,
    sendVoice,
    sendVenue,
    sendPhoto,
    setBotTyping,
    sleep,
};
