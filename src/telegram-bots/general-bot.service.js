const { get: _get } = require('lodash');
const utilsService = require('../services/utils.service');
const logger = new (require('../services/logger.service.js'))(module.filename);

function getMessageData(message) {
    return {
        chatId: _get(message, 'chat.id', ''),
        telegramUserId: _get(message, 'from.id', ''),
        firstName: _get(message, 'from.first_name', ''),
        lastName: _get(message, 'from.last_name', ''),
        username: _get(message, 'from.username', ''),
        text: _get(message, 'text', '') || _get(message, 'caption', ''),
        audio: _get(message, 'audio', '') || _get(message, 'voice', ''),
        video: _get(message, 'video', ''),
        date: _get(message, 'date', ''),
    };
}

function getCallbackQueryData(callbackQuery) {
    return {
        callbackQueryId: _get(callbackQuery, 'id', ''),
        chatId: _get(callbackQuery, 'from.id', ''),
        date: _get(callbackQuery, 'message.date', ''),
        firstName: _get(callbackQuery, 'from.first_name', ''),
        lastName: _get(callbackQuery, 'from.last_name', ''),
        data: _get(callbackQuery, 'data', ''),
    };
}

function getInlineKeyboardMarkup(inlineKeyboardButtons) {
    const inlineKeyboard = { inline_keyboard: [] };
    inlineKeyboardButtons.forEach(button => inlineKeyboard.inline_keyboard.push([button]));
    return { reply_markup: JSON.stringify(inlineKeyboard) };
}

async function sendMessage(bot, chatId, messageText, form = {}) {
    try {
        await bot.sendMessage(chatId, messageText, form);
    } catch (err) {
        logger.error(sendMessage.name, `err: ${utilsService.getErrorMessage(err)}`);
    }
}

async function sendAudio(bot, chatId, audioFilePath) {
    try {
        await bot.sendAudio(chatId, audioFilePath);
    } catch (err) {
        logger.error(sendAudio.name, `err: ${utilsService.getErrorMessage(err)}`);
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

async function sendPhoto(bot, chatId, imageUrl) {
    try {
        await bot.sendPhoto(chatId, imageUrl);
    } catch (err) {
        logger.error(sendPhoto.name, `err: ${utilsService.getErrorMessage(err)}`);
    }
}

async function setBotTyping(bot, chatId, form = {}) {
    try {
        await bot.sendChatAction(chatId, 'typing', form);
    } catch (err) {
        logger.error(setBotTyping.name, `err: ${utilsService.getErrorMessage(err)}`);
    }
}

function botErrorHandler(botName, handlerName, error) {
    const { code, message } = error;
    logger.info(`${botName} bot - ${handlerName}`, `code: ${code}, message: ${message}`);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

module.exports = {
    getMessageData,
    getCallbackQueryData,
    getInlineKeyboardMarkup,
    sendMessage,
    sendAudio,
    sendVoice,
    sendVenue,
    sendPhoto,
    setBotTyping,
    botErrorHandler,
    sleep,
};