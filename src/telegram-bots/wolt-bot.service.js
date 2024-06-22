const TelegramBot = require('node-telegram-bot-api');
const { BOTS } = require('../config');
const mongoService = require('../services/mongo/wolt/mongo.service');
const generalBotService = require('./general-bot.service');
const woltConfig = require('../services/wolt/wolt.config');
const woltUtils = require('../services/wolt/wolt.utils');
const woltService = require('../services/wolt/wolt.service');
const utilsService = require('../services/utils.service');
const { ANALYTIC_EVENT_NAMES, WOLT_BOT_OPTIONS, INITIAL_BOT_RESPONSE } = require('../services/wolt/wolt.config');
const bot = new TelegramBot(process.env.WOLT_TELEGRAM_BOT_TOKEN, { polling: true });
const logger = new (require('../services/logger.service'))(module.filename);

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ worker $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
(async function startInterval() {
    await cleanExpiredSubscriptions();
    const subscriptions = await mongoService.getActiveSubscriptions();
    if (subscriptions && subscriptions.length) {
        await woltService.refreshRestaurants();
        await alertSubscribers(subscriptions);
    }

    const secondsToNextRefresh = getSecondsToNextRefresh();
    setTimeout(async () => {
        await startInterval();
    }, secondsToNextRefresh * 1000);
})();

function getSecondsToNextRefresh() {
    const currentHour = new Date().getHours() + woltConfig.HOURS_DIFFERENCE_FROM_UTC;
    const israelHour = currentHour % 24;
    return woltConfig.HOUR_OF_DAY_TO_REFRESH_MAP[israelHour];
}

function alertSubscribers(subscriptions) {
    try {
        const restaurantsWithSubscriptionNames = subscriptions.map(subscription => subscription.restaurant);
        const subscribedAndOnlineRestaurants = woltService.getRestaurants().filter(restaurant => restaurantsWithSubscriptionNames.includes(restaurant.name) && restaurant.isOnline);
        const promisesArr = [];
        subscribedAndOnlineRestaurants.forEach(restaurant => {
            const relevantSubscriptions = subscriptions.filter(subscription => subscription.restaurant === restaurant.name);
            relevantSubscriptions.forEach(subscription => {
                const restaurantLinkUrl = woltService.getRestaurantLink(restaurant);
                const inlineKeyboardButtons = [
                    { text: restaurant.name, url: restaurantLinkUrl },
                ];
                const inlineKeyboardMarkup = generalBotService.getInlineKeyboardMarkup(inlineKeyboardButtons);
                const replyText = `${restaurant.name} is now open!, go ahead and order!`;
                // promisesArr.push(generalBotService.sendMessage(bot, subscription.chatId, replyText, inlineKeyboardMarkup), woltUtils.getKeyboardOptions());
                promisesArr.push(generalBotService.sendPhoto(bot, subscription.chatId, subscription.restaurantPhoto, { ...inlineKeyboardMarkup, caption: replyText }));
                promisesArr.push(mongoService.archiveSubscription(subscription.chatId, subscription.restaurant));
                promisesArr.push(mongoService.sendAnalyticLog(ANALYTIC_EVENT_NAMES.SUBSCRIPTION_FULFILLED, { chatId: subscription.chatId, data: restaurant.name }));
            });
        });
        return Promise.all(promisesArr);
    } catch (err) {
        logger.error(alertSubscribers.name, `error - ${utilsService.getErrorMessage(err)}`);
    }
}

async function cleanExpiredSubscriptions() {
    try {
        const expiredSubscriptions = await mongoService.getExpiredSubscriptions();
        const promisesArr = []
        expiredSubscriptions.forEach(subscription => {
            promisesArr.push(mongoService.archiveSubscription(subscription.chatId, subscription.restaurant));
            const currentHour = new Date().getHours();
            if (currentHour >= woltConfig.MIN_HOUR_TO_ALERT_USER && currentHour <= woltConfig.MAX_HOUR_TO_ALERT_USER) { // let user know that subscription was removed only between 8am to 11pm
                promisesArr.push(generalBotService.sendMessage(bot, subscription.chatId, `Subscription for ${subscription.restaurant} was removed since it didn't open for the last ${woltConfig.SUBSCRIPTION_EXPIRATION_HOURS} hours`), woltUtils.getKeyboardOptions());
            }
            promisesArr.push(mongoService.sendAnalyticLog(ANALYTIC_EVENT_NAMES.SUBSCRIPTION_FAILED, { chatId: subscription.chatId, data: subscription.restaurant }));
        });
        await Promise.all(promisesArr);
    } catch (err) {
        logger.error(cleanExpiredSubscriptions.name, `error - ${utilsService.getErrorMessage(err)}`);
    }
}

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ bot interceptors $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
bot.onText(/\/start/, startHandler);

async function startHandler(message) {
    const { chatId, firstName, lastName, telegramUserId, username } = generalBotService.getMessageData(message);
    const logBody = `start :: chatId: ${chatId}, firstname: ${firstName}, lastname: ${lastName}`;

    try {
        logger.info(startHandler.name, `${logBody} - start`);
        mongoService.saveUserDetails({ chatId, telegramUserId, firstName, lastName, username });
        const replyText = INITIAL_BOT_RESPONSE.replace('{firstName}', firstName || username || '');
        await generalBotService.sendMessage(bot, chatId, replyText, woltUtils.getKeyboardOptions());
        mongoService.sendAnalyticLog(ANALYTIC_EVENT_NAMES.START, { chatId })
        logger.info(startHandler.name, `${logBody} - success`);
    } catch (err) {
        logger.error(startHandler.name, `${logBody} - error - ${utilsService.getErrorMessage(err)}`);
        await generalBotService.sendMessage(bot, chatId, `Sorry, but something went wrong`, woltUtils.getKeyboardOptions());
    }
}

bot.onText(/\/show/, showHandler);

async function showHandler(message) {
    const { chatId, firstName, lastName } = generalBotService.getMessageData(message);
    const logBody = `/\show :: chatId: ${chatId}, firstname: ${firstName}, lastname: ${lastName}`;
    logger.info(showHandler.name, `${logBody} - start`);

    try {
        const subscriptions = await mongoService.getActiveSubscriptions(chatId);
        if (!subscriptions.length) {
            const replyText = 'You don\'t have any active subscriptions yet';
            return await generalBotService.sendMessage(bot, chatId, replyText, woltUtils.getKeyboardOptions());
        }

        const promisesArr = subscriptions.map(subscription => {
            const inlineKeyboardButtons = [
                { text: 'Remove', callback_data: `remove - ${subscription.restaurant}` },
            ];
            const inlineKeyboardMarkup = generalBotService.getInlineKeyboardMarkup(inlineKeyboardButtons);
            return generalBotService.sendMessage(bot, chatId, subscription.restaurant, inlineKeyboardMarkup);
        });
        await Promise.all(promisesArr);
        mongoService.sendAnalyticLog(ANALYTIC_EVENT_NAMES.SHOW, { chatId })
        logger.info(showHandler.name, `${logBody} - success`);
    } catch (err) {
        logger.error(showHandler.name, `error - ${utilsService.getErrorMessage(err)}`);
        await generalBotService.sendMessage(bot, chatId, `Sorry, but something went wrong`, woltUtils.getKeyboardOptions());
    }
}

bot.on('text', textHandler);

async function textHandler(message) {
    let { chatId, firstName, lastName, text: restaurant } = generalBotService.getMessageData(message);
    restaurant = restaurant.toLowerCase();

    // prevent built in options to be processed also here
    if (Object.keys(WOLT_BOT_OPTIONS).map(option => WOLT_BOT_OPTIONS[option]).includes(restaurant)) return;

    const logBody = `message :: chatId: ${chatId}, firstname: ${firstName}, lastname: ${lastName}, restaurant: ${restaurant}`;
    logger.info(textHandler.name, `${logBody} - start`);

    try {
        mongoService.sendAnalyticLog(ANALYTIC_EVENT_NAMES.SEARCH, { data: restaurant, chatId });

        const isLastUpdatedTooOld = new Date().getTime() - woltService.getLastUpdated() > woltConfig.TOO_OLD_LIST_THRESHOLD_MS;
        if (isLastUpdatedTooOld) { // lst updated is less than a minute
            await woltService.refreshRestaurants();
        }
        const matchedRestaurants = getFilteredRestaurantsByName(restaurant);
        if (!matchedRestaurants.length) {
            const replyText = `I am sorry, I didn\'t find any restaurants matching your search - '${restaurant}'`;
            return await generalBotService.sendMessage(bot, chatId, replyText, woltUtils.getKeyboardOptions());
        }
        const restaurants = await woltService.enrichRestaurants(matchedRestaurants);
        const inlineKeyboardButtons = restaurants.map(restaurant => {
            const isAvailableComment = restaurant.isOnline ? 'Open' : restaurant.isOpen ? 'Busy' : 'Closed';
            return {
                text: `${restaurant.name} - ${isAvailableComment}`,
                callback_data: restaurant.name,
            };
        });
        const inlineKeyboardMarkup = generalBotService.getInlineKeyboardMarkup(inlineKeyboardButtons);
        const replyText = 'Choose one of the above restaurants so I can notify you when it\'s online';
        await generalBotService.sendMessage(bot, chatId, replyText, inlineKeyboardMarkup);
        logger.info(textHandler.name, `${logBody} - success`);
    } catch (err) {
        logger.error(refreshRestaurants.name, `error - ${utilsService.getErrorMessage(err)}`);
        await generalBotService.sendMessage(bot, chatId, `Sorry, but something went wrong`, woltUtils.getKeyboardOptions());
    }
}

bot.on('callback_query', callbackQueryHandler);

async function callbackQueryHandler(callbackQuery) {
    const { chatId, firstName, lastName, data: restaurant } = generalBotService.getCallbackQueryData(callbackQuery);
    const logBody = `callback_query :: chatId: ${chatId}, firstname: ${firstName}, lastname: ${lastName}, restaurant: ${restaurant}`;
    logger.info(callbackQueryHandler.name, `${logBody} - start`);

    try {

        const restaurantName = restaurant.replace('remove - ', '');
        const existingSubscription = await mongoService.getSubscription(chatId, restaurantName);

        if (restaurant.startsWith('remove - ')) {
            return await handleCallbackRemoveSubscription(chatId, restaurantName, existingSubscription);
        }

        await handleCallbackAddSubscription(chatId, restaurant, existingSubscription);
        logger.info(callbackQueryHandler.name, `${logBody} - success`);
    } catch (err) {
        logger.error(callbackQueryHandler.name, `error - ${utilsService.getErrorMessage(err)}`);
        await generalBotService.sendMessage(bot, chatId, `Sorry, but something went wrong`, woltUtils.getKeyboardOptions());
    }
}

bot.on('polling_error', async (error) => generalBotService.botErrorHandler(BOTS.WOLT.name, 'polling_error', error));
bot.on('error', async (error) => generalBotService.botErrorHandler(BOTS.WOLT.name, 'error', error));


// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ helper functions $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
async function handleCallbackAddSubscription(chatId, restaurant, existingSubscription) {
    let replyText;
    let form = {};
    if (existingSubscription) {
        replyText = '' +
            `It seems you already have a subscription for ${restaurant} is open.\n\n` +
            `Let\'s wait a few minutes - it might open soon.`;
    } else {
        const restaurantDetails = woltService.getRestaurants().find(r => r.name === restaurant) || null;
        if (restaurantDetails && restaurantDetails.isOnline) {
            replyText = '' +
                `It looks like ${restaurant} is open now\n\n` +
                `Go ahead and order your food :)`;
            const restaurantLinkUrl = woltService.getRestaurantLink(restaurantDetails);
            const inlineKeyboardButtons = [
                { text: restaurantDetails.name, url: restaurantLinkUrl },
            ];
            form = generalBotService.getInlineKeyboardMarkup(inlineKeyboardButtons);
        } else {
            replyText = `No Problem, you will be notified once ${restaurant} is open.\n\n` +
                `FYI: If the venue won\'t open soon, registration will be removed after ${woltConfig.SUBSCRIPTION_EXPIRATION_HOURS} hours.\n\n` +
                `You can search and register for another restaurant if you like.`;
            await mongoService.addSubscription(chatId, restaurant, restaurantDetails.photo);
        }
    }

    mongoService.sendAnalyticLog(ANALYTIC_EVENT_NAMES.SUBSCRIBE, { data: restaurant, chatId });
    await generalBotService.sendMessage(bot, chatId, replyText, form);
}

async function handleCallbackRemoveSubscription(chatId, restaurant, existingSubscription) {
    let replyText;
    if (existingSubscription) {
        const restaurantToRemove = restaurant.replace('remove - ', '');
        await mongoService.archiveSubscription(chatId, restaurantToRemove);
        replyText = `Subscription for ${restaurantToRemove} was removed`;
    } else {
        replyText = `It seems you don\'t have a subscription for ${restaurant}.\n\n` +
            `You can search and register for another restaurant if you like`;
    }
    mongoService.sendAnalyticLog(ANALYTIC_EVENT_NAMES.UNSUBSCRIBE, { data: restaurant, chatId });
    return await generalBotService.sendMessage(bot, chatId, replyText, woltUtils.getKeyboardOptions());
}

function getFilteredRestaurantsByName(searchInput) {
    const restaurants = [...woltService.getRestaurants()];
    return restaurants.filter(restaurant => {
        return restaurant.name.toLowerCase().includes(searchInput.toLowerCase());
    }).slice(0, woltConfig.MAX_NUM_OF_RESTAURANTS_TO_SHOW);
}
