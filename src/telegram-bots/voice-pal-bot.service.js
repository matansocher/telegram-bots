const TelegramBot = require('node-telegram-bot-api');
const { BOTS } = require('../config');
const { VOICE_PAL_OPTIONS } = require('../services/voice-pal/voice-pal.config');
const bot = new TelegramBot(process.env.VOICE_PAL_TELEGRAM_BOT_TOKEN, { polling: true });
const generalBotService = require('./general-bot.service');
const MessageAggregator = require('./messages-aggregator.service');
const utilsService = require('../services/utils.service');
const VoicePalService = require('../services/voice-pal/voice-pal.service');
const userSelectionService = require('../services/voice-pal/user-selections.service');
const logger = new (require('../services/logger.service.js'))(module.filename);

const messageAggregator = new MessageAggregator(handleMessage);

bot.on('message', (message) => messageAggregator.handleIncomingMessage(message));

async function handleMessage(message) {
    const functionName = 'message listener';
    const { chatId, telegramUserId, firstName, lastName, username, text  } = generalBotService.getMessageData(message);
    const logBody = `chatId: ${chatId}, firstname: ${firstName}, lastname: ${lastName}`;

    try {
        logger.info(functionName, `${logBody} - start`);

        const voicePalService = new VoicePalService(bot, chatId);
        const availableActions = Object.keys(VOICE_PAL_OPTIONS).map(option => VOICE_PAL_OPTIONS[option].displayName);
        if (availableActions.includes(text)) {
            await voicePalService.handleActionSelection(text, { telegramUserId, chatId, firstName, lastName, username });
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
