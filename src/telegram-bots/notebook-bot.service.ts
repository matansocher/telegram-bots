import TelegramBot from 'node-telegram-bot-api';
import { BOTS } from '../config';
const bot = new TelegramBot(process.env.NOTEBOOK_BOT_TOKEN, { polling: true });
import { NOTEBOOK_BOT_ACTIONS, NOTEBOOK_BOT_ACTIONS_TO_SAVE, NOTEBOOK_BOT_ACTIONS_TO_HANDLE, INITIAL_BOT_RESPONSE } from '../services/notebook/notebook.config';
import NotebookService from '../services/notebook/notebook.service';
import notebookUtils from '../services/notebook/notebook.utils';
import generalBotService from './general-bot.service';
import * as utilsService from '../services/utils.service';
import userSelectionService from '../services/notebook/user-selections.service';
import LoggerService from '../services/logger.service';
const logger = new LoggerService(module.filename);

bot.onText(/\/start/, startHandler);

async function startHandler(message) {
    const functionName = 'start listener';
    const { chatId, firstName, lastName, telegramUserId, username } = generalBotService.getMessageData(message);
    const logBody = `start :: chatId: ${chatId}, firstname: ${firstName}, lastname: ${lastName}, username: ${username}`;
    logger.info(functionName, `${logBody} - start`);

    try {
        const notebookService = new NotebookService(bot, chatId);
        await notebookService.handleStartAction({ telegramUserId, chatId, firstName, lastName, username });
        logger.info(functionName, `${logBody} - success`);
    } catch (err) {
        logger.error(functionName, `${logBody} - error - ${utilsService.getErrorMessage(err)}`);
        await generalBotService.sendMessage(bot, chatId, `Sorry, but something went wrong`);
    }
}

bot.on('message', handleMessage);

async function handleMessage(message) {
    const functionName = 'message listener';
    const { chatId, firstName, lastName, text  } = generalBotService.getMessageData(message);
    const logBody = `chatId: ${chatId}, firstname: ${firstName}, lastname: ${lastName}`;

    if (text === '/start') return;

    try {
        logger.info(functionName, `${logBody} - start`);

        const notebookService = new NotebookService(bot, chatId);
        const actionsToSave = Object.keys(NOTEBOOK_BOT_ACTIONS_TO_SAVE).map(action => NOTEBOOK_BOT_ACTIONS_TO_SAVE[action].displayName);
        const actionsToHandle = Object.keys(NOTEBOOK_BOT_ACTIONS_TO_HANDLE).map(action => NOTEBOOK_BOT_ACTIONS_TO_HANDLE[action].displayName);
        if (actionsToSave.includes(text)) {
            await notebookService.handleActionSelection(text);
        } else if (actionsToHandle.includes(text)) {
            const userAction = Object.keys(NOTEBOOK_BOT_ACTIONS_TO_HANDLE).find(action => NOTEBOOK_BOT_ACTIONS_TO_HANDLE[action].displayName === text);
            await notebookService.handleAction(message, NOTEBOOK_BOT_ACTIONS_TO_HANDLE[userAction]);
        } else {
            const { action, data } = userSelectionService.getCurrentUserAction(chatId);
            await notebookService.handleAction(message, action, data);
        }

        logger.info(functionName, `${logBody} - success`);
    } catch (err) {
        logger.error(functionName, `${logBody} - error - ${utilsService.getErrorMessage(err)}`);
        await generalBotService.sendMessage(bot, chatId, `Sorry, but something went wrong`);
    }
}

bot.on('callback_query', callbackQueryHandler);

async function callbackQueryHandler(callbackQuery) {
    const { chatId, firstName, lastName, text, data } = generalBotService.getCallbackQueryData(callbackQuery);
    const logBody = `callback_query :: chatId: ${chatId}, firstname: ${firstName}, lastname: ${lastName}, data: ${data}`;
    logger.info(callbackQueryHandler.name, `${logBody} - start`);

    try {
        const { action, listId, itemId } = generalBotService.decodeCallbackData(data);
        // const list = await mongoService.getList(chatId, listId);
        const botAction = Object.keys(NOTEBOOK_BOT_ACTIONS).find(actionObj => actionObj === action);
        const actionObj = NOTEBOOK_BOT_ACTIONS[botAction];

        const notebookService = new NotebookService(bot, chatId);
        const actionsToSave = Object.keys(NOTEBOOK_BOT_ACTIONS_TO_SAVE).map(action => NOTEBOOK_BOT_ACTIONS_TO_SAVE[action].displayName);
        if (actionsToSave.includes(actionObj.displayName)) {
            await notebookService.handleActionSelection(actionObj.displayName, { listId, itemId });
        } else {
            const userAction = Object.keys(NOTEBOOK_BOT_ACTIONS_TO_HANDLE).find(action => action === botAction);
            await notebookService.handleAction(callbackQuery, NOTEBOOK_BOT_ACTIONS_TO_HANDLE[userAction], generalBotService.decodeCallbackData(data));
        }

        logger.info(callbackQueryHandler.name, `${logBody} - success`);
    } catch (err) {
        logger.error(callbackQueryHandler.name, `error - ${utilsService.getErrorMessage(err)}`);
        await generalBotService.sendMessage(bot, chatId, `Sorry, but something went wrong`, notebookUtils.getKeyboardOptions());
    }
}

bot.on('polling_error', async (error) => generalBotService.botErrorHandler(BOTS.NOTEBOOK.name, 'polling_error', error));
bot.on('error', async (error) => generalBotService.botErrorHandler(BOTS.NOTEBOOK.name, 'error', error));
