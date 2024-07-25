import { get as _get, chunk as _chunk } from 'lodash';
import { BOT_BROADCAST_ACTIONS } from './general-bot.config';
import * as utilsService from '../services/utils.service';
import { LOCAL_FILES_PATH } from '../services/voice-pal/voice-pal.config';
import LoggerService from '../services/logger.service';
const logger = new LoggerService(module.filename);

export function getMessageData(message) {
    return {
        chatId: _get(message, 'chat.id', ''),
        telegramUserId: _get(message, 'from.id', ''),
        firstName: _get(message, 'from.first_name', ''),
        lastName: _get(message, 'from.last_name', ''),
        username: _get(message, 'from.username', ''),
        text: _get(message, 'text', '') || _get(message, 'caption', ''),
        audio: _get(message, 'audio', null) || _get(message, 'voice', null),
        video: _get(message, 'video', null),
        photo: _get(message, 'photo', null) || _get(message, 'sticker', null),
        date: _get(message, 'date', ''),
    };
}

export function getCallbackQueryData(callbackQuery) {
    return {
        callbackQueryId: _get(callbackQuery, 'id', ''),
        chatId: _get(callbackQuery, 'from.id', ''),
        date: _get(callbackQuery, 'message.date', ''),
        firstName: _get(callbackQuery, 'from.first_name', ''),
        lastName: _get(callbackQuery, 'from.last_name', ''),
        text: _get(callbackQuery, 'message.text', ''),
        data: _get(callbackQuery, 'data', ''),
    };
}

export function getInlineKeyboardMarkup(inlineKeyboardButtons, numberOfColumnsPerRow = 1) {
    const inlineKeyboard = { inline_keyboard: [] };
    inlineKeyboardButtons.forEach(button => inlineKeyboard.inline_keyboard.push(button));
    inlineKeyboard.inline_keyboard = _chunk(inlineKeyboard.inline_keyboard, numberOfColumnsPerRow);
    return { reply_markup: JSON.stringify(inlineKeyboard) };
}

export async function downloadFile(bot, fileId, path) {
    try {
        return await bot.downloadFile(fileId, path);
    } catch (err) {
        logger.error(downloadFile.name, `err: ${utilsService.getErrorMessage(err)}`);
        throw err;
    }
}

export async function downloadAudioFromVideoOrAudio(bot, { video, audio }) {
    try {
        let audioFileLocalPath = '';
        if (video && video.file_id) {
            const videoFileLocalPath = await downloadFile(bot, video.file_id, LOCAL_FILES_PATH);
            audioFileLocalPath = await utilsService.extractAudioFromVideo(videoFileLocalPath);
            utilsService.deleteFile(videoFileLocalPath);
        } else if (audio && audio.file_id) {
            audioFileLocalPath = await downloadFile(bot, audio.file_id, LOCAL_FILES_PATH);
        }
        return audioFileLocalPath;
    } catch (err) {
        logger.error(downloadAudioFromVideoOrAudio.name, `err: ${utilsService.getErrorMessage(err)}`);
        throw err;
    }
}

export async function sendMessage(bot, chatId, messageText, form = {}) {
    try {
        return await bot.sendMessage(chatId, messageText, form);
    } catch (err) {
        logger.error(sendMessage.name, `err: ${utilsService.getErrorMessage(err)}`);
        throw err;
    }
}

export async function editMessageText(bot, chatId, messageId, messageText) {
    try {
        return await bot.editMessageText(messageText, { chat_id: chatId, message_id: messageId });
    } catch (err) {
        logger.error(editMessageText.name, `err: ${utilsService.getErrorMessage(err)}`);
        throw err;
    }
}

export async function deleteMessage(bot, chatId, messageId) {
    try {
        await bot.deleteMessage(chatId, messageId);
    } catch (err) {
        logger.error(deleteMessage.name, `err: ${utilsService.getErrorMessage(err)}`);
    }
}

export async function sendAudio(bot, chatId, audioFilePath) {
    try {
        await bot.sendAudio(chatId, audioFilePath);
    } catch (err) {
        logger.error(sendAudio.name, `err: ${utilsService.getErrorMessage(err)}`);
    }
}

export async function sendVoice(bot, chatId, audioFilePath) {
    try {
        await bot.sendVoice(chatId, audioFilePath);
    } catch (err) {
        logger.error(sendVoice.name, `err: ${utilsService.getErrorMessage(err)}`);
    }
}

export async function sendVenue(bot, chatId, latitude, longitude, title, address) {
    try {
        await bot.sendVenue(chatId, latitude, longitude, title, address);
    } catch (err) {
        logger.error(sendVenue.name, `err: ${utilsService.getErrorMessage(err)}`);
    }
}

export async function sendPhoto(bot, chatId, imageUrl, form = {}) {
    try {
        await bot.sendPhoto(chatId, imageUrl, form);
    } catch (err) {
        logger.error(sendPhoto.name, `err: ${utilsService.getErrorMessage(err)}`);
    }
}

export function setBotTyping(bot, chatId, action = BOT_BROADCAST_ACTIONS.TYPING) {
    try {
        bot.sendChatAction(chatId, action);
    } catch (err) {
        logger.error(setBotTyping.name, `err: ${utilsService.getErrorMessage(err)}`);
    }
}

export function botErrorHandler(botName, handlerName, error) {
    const { code, message } = error;
    logger.info(`${botName} bot - ${handlerName}`, `code: ${code}, message: ${message}`);
}

export function decodeCallbackData(data) {
    return utilsService.queryParamsToObject(data);
}

export function encodeCallbackData(data) {
    return utilsService.objectToQueryParams(data);
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));
