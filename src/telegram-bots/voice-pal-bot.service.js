const TelegramBot = require('node-telegram-bot-api');
const { BOTS } = require('../config');
const { ANALYTIC_EVENT_NAMES, VOICE_PAL_OPTIONS, INITIAL_BOT_RESPONSE } = require('../services/voice-pal/voice-pal.config');
const bot = new TelegramBot(process.env.VOICE_PAL_STAGING_TELEGRAM_BOT_TOKEN, { polling: true });
const generalBotService = require('./general-bot.service');
const utilsService = require('../services/utils.service');
const { getKeyboardOptions, handleActionSelection, handleAction } = require('../services/voice-pal/voice-pal.service');
const mongoService = require('../services/mongo/mongo.service');
const mongoConfig = require('../services/mongo/mongo.config');
const logger = new (require('../services/logger.service.js'))(module.filename);

bot.onText(/\/start/, startHandler);

async function startHandler(message) {
    const functionName = 'start listener';
    const { chatId, firstName, lastName, telegramUserId, username } = generalBotService.getMessageData(message);
    const logBody = `start :: chatId: ${chatId}, firstname: ${firstName}, lastname: ${lastName}, username: ${username}`;
    logger.info(functionName, `${logBody} - start`);

    try {
        mongoService.saveUserDetails(mongoConfig.VOICE_PAL.NAME, { telegramUserId, chatId, firstName, lastName, username });
        const replyText = INITIAL_BOT_RESPONSE.replace('{firstName}', firstName || username || '');
        await generalBotService.sendMessage(bot, chatId, replyText, getKeyboardOptions());
        mongoService.sendAnalyticLog(mongoConfig.VOICE_PAL.NAME, ANALYTIC_EVENT_NAMES.START, { chatId })
        logger.info(functionName, `${logBody} - success`);
    } catch (err) {
        logger.error(functionName, `${logBody} - error - ${utilsService.getErrorMessage(err)}`);
        await generalBotService.sendMessage(bot, chatId, `Sorry, but something went wrong`);
    }
}

bot.on('message', async (message) => messageHandler('message listener', message));

async function messageHandler(functionName, message) {
    const { chatId, firstName, lastName, text  } = generalBotService.getMessageData(message);
    const logBody = `chatId: ${chatId}, firstname: ${firstName}, lastname: ${lastName}`;

    if (text === '/start') return

    try {
        logger.info(functionName, `${logBody} - start`);

        const availableActions = Object.keys(VOICE_PAL_OPTIONS).map(key => VOICE_PAL_OPTIONS[key]);
        if (availableActions.includes(text)) {
            await handleActionSelection(bot, chatId, text);
        } else {
            await handleAction(bot, message);
        }

        logger.info(functionName, `${logBody} - success`);
    } catch (err) {
        logger.error(functionName, `${logBody} - error - ${utilsService.getErrorMessage(err)}`);
        await generalBotService.sendMessage(bot, chatId, `Sorry, but something went wrong`);
    }
}

bot.on('polling_error', async (error) => generalBotService.botErrorHandler(BOTS.VOICE_PAL.name, 'polling_error', error));
bot.on('error', async (error) => generalBotService.botErrorHandler(BOTS.VOICE_PAL.name, 'error', error));
