const TelegramBot = require('node-telegram-bot-api');
const { BOTS } = require('../config');
const { ANALYTIC_EVENT_NAMES, VOICE_PAL_OPTIONS, INITIAL_BOT_RESPONSE } = require('../services/voice-pal/voice-pal.config');
const bot = new TelegramBot(process.env.VOICE_PAL_TELEGRAM_BOT_TOKEN, { polling: true });
const generalBotService = require('./general-bot.service');
const MessageAggregator = require('./messages-aggregator.service');
const utilsService = require('../services/utils.service');
const VoicePalService = require('../services/voice-pal/voice-pal.service');
const voicePalUtils = require('../services/voice-pal/voice-pal.utils');
const mongoService = require('../services/mongo/voice-pal/mongo.service');
const mongoConfig = require('../services/mongo/mongo.config');
const userSelectionService = require('../services/user-selections.service');
const logger = new (require('../services/logger.service.js'))(module.filename);

bot.onText(/\/start/, startHandler);

async function startHandler(message) {
    const functionName = 'start listener';
    const { chatId, firstName, lastName, telegramUserId, username } = generalBotService.getMessageData(message);
    const logBody = `start :: chatId: ${chatId}, firstname: ${firstName}, lastname: ${lastName}, username: ${username}`;
    logger.info(functionName, `${logBody} - start`);

    try {
        mongoService.saveUserDetails({ telegramUserId, chatId, firstName, lastName, username });
        const replyText = INITIAL_BOT_RESPONSE.replace('{firstName}', firstName || username || '');
        await generalBotService.sendMessage(bot, chatId, replyText, voicePalUtils.getKeyboardOptions());
        mongoService.sendAnalyticLog(ANALYTIC_EVENT_NAMES.Start, { chatId })
        logger.info(functionName, `${logBody} - success`);
    } catch (err) {
        logger.error(functionName, `${logBody} - error - ${utilsService.getErrorMessage(err)}`);
        await generalBotService.sendMessage(bot, chatId, `Sorry, but something went wrong`);
    }
}


const messageAggregator = new MessageAggregator(handleMessage);

bot.on('message', (message) => messageAggregator.handleIncomingMessage(message));

async function handleMessage(message) {
    const functionName = 'message listener';
    const { chatId, firstName, lastName, text  } = generalBotService.getMessageData(message);
    const logBody = `chatId: ${chatId}, firstname: ${firstName}, lastname: ${lastName}`;

    if (text === '/start') return;

    try {
        logger.info(functionName, `${logBody} - start`);

        const voicePalService = new VoicePalService(bot, chatId);
        const availableActions = Object.keys(VOICE_PAL_OPTIONS).map(option => VOICE_PAL_OPTIONS[option].displayName);
        if (availableActions.includes(text)) {
            await voicePalService.handleActionSelection(text);
        } else {
            const userAction = userSelectionService.getCurrentUserAction(chatId);
            await voicePalService.handleAction(message, userAction);
        }

        logger.info(functionName, `${logBody} - success`);
    } catch (err) {
        logger.error(functionName, `${logBody} - error - ${utilsService.getErrorMessage(err)}`);
        await generalBotService.sendMessage(bot, chatId, `Sorry, but something went wrong`);
    }
}

bot.on('polling_error', async (error) => generalBotService.botErrorHandler(BOTS.VOICE_PAL.name, 'polling_error', error));
bot.on('error', async (error) => generalBotService.botErrorHandler(BOTS.VOICE_PAL.name, 'error', error));
