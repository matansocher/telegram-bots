const generalBotService = require('./general-bot.service');
const utilsService = require('../services/utils.service');
const logger = new (require('../services/logger.service.js'))(module.filename);

const DEFAULT_CYCLE_DURATION = 5000;

const LOADER_MESSAGES = [
    'Just a moment...',
    'Hold on, working on it...',
    'Still on it...',
    'Just a little bit longer...',
    'Hang tight, almost there...',
    'Any second now...',
    'Thanks for your patience...'
];

class MessageLoader {
    constructor(bot, chatId, options) {
        this.bot = bot;
        this.chatId = chatId;
        this.options = options;

        this.timeoutId = null;
        this.loaderMessageId = null;
        this.cycleIterationIndex = 0;
        this.isMessageProcessed = false;
    }

    waitForMessage() {
        try {
            generalBotService.setBotTyping(this.bot, this.chatId);
            this.cycleInitiator();
        } catch (err) {
            logger.error(this.waitForMessage.name, `error - ${utilsService.getErrorMessage(err)}`);
            this.stopLoader();
        }
    }

    cycleInitiator() {
        this.timeoutId = setTimeout(async () => {
            if (this.isMessageProcessed || this.cycleIterationIndex > LOADER_MESSAGES.length) {
                return;
            }
            await this.handleProcessCycle()
        }, this.options.cycleDuration || DEFAULT_CYCLE_DURATION);
    }

    async handleProcessCycle() {
        let messagePromise;

        const messageText = this.cycleIterationIndex < LOADER_MESSAGES.length ? LOADER_MESSAGES[this.cycleIterationIndex] : LOADER_MESSAGES[LOADER_MESSAGES.length - 1];
        if (this.cycleIterationIndex === 0) {
            messagePromise = generalBotService.sendMessage(this.bot, this.chatId, messageText);
        } else {
            messagePromise = generalBotService.editMessageText(this.bot, this.chatId, this.loaderMessageId, messageText);
        }
        generalBotService.setBotTyping(this.bot, this.chatId);

        const messageRes = await messagePromise;
        this.loaderMessageId = (messageRes && messageRes.message_id) ? messageRes.message_id : this.loaderMessageId;
        this.cycleIterationIndex = this.cycleIterationIndex + 1;
        this.cycleInitiator();
    }

    stopLoader() {
        this.isMessageProcessed = true;
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
        generalBotService.deleteMessage(this.bot, this.chatId, this.loaderMessageId);
    }
}

async function withMessageLoader(bot, chatId, options, action) {
    const messageLoader = new MessageLoader(bot, chatId, options);

    try {
        messageLoader.waitForMessage();
        await action();
    } catch (err) {
        logger.error(withMessageLoader.name, `error - ${utilsService.getErrorMessage(err)}`);
        messageLoader.stopLoader();
        throw err;
    } finally {
        messageLoader.stopLoader();
    }
}

module.exports = {
    withMessageLoader,
};
