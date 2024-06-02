const TelegramBot = require('node-telegram-bot-api');
const { BOTS } = require('../config');
const mongoConfig = require('../services/mongo/mongo.config');
const mongoService = require('../services/mongo/mongo.service');
const generalBotService = require('./general-bot.service');
const woltService = require('../services/wolt/wolt.service');
const woltConfig = require('../services/wolt/wolt.config');
const utilsService = require('../services/utils.service');
const { ANALYTIC_EVENT_NAMES, WOLT_BOT_OPTIONS, INITIAL_BOT_RESPONSE } = require('../services/wolt/wolt.config');
const bot = new TelegramBot(process.env.WOLT_TELEGRAM_BOT_TOKEN, { polling: true });
const logger = new (require('../services/logger.service'))(module.filename);

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ worker $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
let restaurantsList = [];

(async function startInterval() {
    await refreshRestaurants();
    const subscriptions = await mongoService.getActiveSubscriptions();
    // get the names of the restaurants that are online
    if (subscriptions.length) {
        await alertSubscribers(subscriptions);
    }

    await cleanExpiredSubscriptions();
    const secondsToNextRefresh = getSecondsToNextRefresh();
    setTimeout(async () => {
        await startInterval();
    }, secondsToNextRefresh * 1000);
})();

async function refreshRestaurants() {
    try {
        const restaurants = await woltService.getRestaurantsList();
        if (restaurants.length) {
            restaurantsList = [...restaurants];
            logger.info(refreshRestaurants.name, 'Restaurants list was refreshed successfully');
        }
    } catch (err) {
        logger.error(refreshRestaurants.name, `error - ${utilsService.getErrorMessage(err)}`);
    }
}

function alertSubscribers(subscriptions) {
    try {
        const restaurantsWithSubscriptionNames = subscriptions.map(subscription => subscription.restaurant);
        const filteredRestaurants = restaurantsList.filter(restaurant => restaurantsWithSubscriptionNames.includes(restaurant.name) && restaurant.isOnline);
        const promisesArr = [];
        filteredRestaurants.forEach(restaurant => {
            const relevantSubscriptions = subscriptions.filter(subscription => subscription.restaurant === restaurant.name);
            relevantSubscriptions.forEach(subscription => {
                const restaurantLinkUrl = woltService.getRestaurantLink(restaurant);
                const inlineKeyboardButtons = [
                    { text: restaurant.name, url: restaurantLinkUrl },
                ];
                const inlineKeyboardMarkup = generalBotService.getInlineKeyboardMarkup(inlineKeyboardButtons);
                const replyText = `${restaurant.name} is now open!, go ahead and order!`;
                promisesArr.push(generalBotService.sendMessage(bot, subscription.chatId, replyText, inlineKeyboardMarkup), getKeyboardOptions());
                promisesArr.push(mongoService.archiveSubscription(subscription.chatId, subscription.restaurant));
                promisesArr.push(mongoService.sendAnalyticLog(mongoConfig.WOLT.NAME, ANALYTIC_EVENT_NAMES.SUBSCRIPTION_FULFILLED, { chatId: subscription.chatId, restaurant: restaurant.name }));
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
                promisesArr.push(generalBotService.sendMessage(bot, subscription.chatId, `Subscription for ${subscription.restaurant} was removed since it didn't open for the last ${woltConfig.SUBSCRIPTION_EXPIRATION_HOURS} hours`), getKeyboardOptions());
            }
            promisesArr.push(mongoService.sendAnalyticLog(mongoConfig.WOLT.NAME, ANALYTIC_EVENT_NAMES.SUBSCRIPTION_FAILED, { chatId: subscription.chatId, restaurant: subscription.restaurant }));
        });
        await Promise.all(promisesArr);
    } catch (err) {
        logger.error(cleanExpiredSubscriptions.name, `error - ${utilsService.getErrorMessage(err)}`);
    }
}

function getSecondsToNextRefresh() {
    const currentHour = new Date().getHours() + woltConfig.HOURS_DIFFERENCE_FROM_UTC;
    const israelHour = currentHour % 24;
    return woltConfig.HOUR_OF_DAY_TO_REFRESH_MAP[israelHour];
}

// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ bot interceptors $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
function getKeyboardOptions() {
    return {
        reply_markup: {
            keyboard: Object.keys(WOLT_BOT_OPTIONS).map(option => {
                return [{ text: WOLT_BOT_OPTIONS[option] }];
            }),
            resize_keyboard: true,
        },
    }
}

bot.onText(/\/start/, startHandler);

async function startHandler(message) {
    const { chatId, firstName, lastName, telegramUserId, username } = generalBotService.getMessageData(message);
    const logBody = `start :: chatId: ${chatId}, firstname: ${firstName}, lastname: ${lastName}`;

    try {
        logger.info(startHandler.name, `${logBody} - start`);
        mongoService.saveUserDetails(mongoConfig.WOLT.NAME, { chatId, telegramUserId, firstName, lastName, username });
        const replyText = INITIAL_BOT_RESPONSE.replace('{firstName}', firstName || username || '');
        await generalBotService.sendMessage(bot, chatId, replyText, getKeyboardOptions());
        mongoService.sendAnalyticLog(mongoConfig.WOLT.NAME, ANALYTIC_EVENT_NAMES.START, { chatId })
        logger.info(startHandler.name, `${logBody} - success`);
    } catch (err) {
        logger.error(startHandler.name, `${logBody} - error - ${utilsService.getErrorMessage(err)}`);
        await generalBotService.sendMessage(bot, chatId, `Sorry, but something went wrong`, getKeyboardOptions());
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
            return await generalBotService.sendMessage(bot, chatId, replyText, getKeyboardOptions());
        }

        const promisesArr = subscriptions.map(subscription => {
            const inlineKeyboardButtons = [
                { text: 'Remove', callback_data: `remove - ${subscription.restaurant}` },
            ];
            const inlineKeyboardMarkup = generalBotService.getInlineKeyboardMarkup(inlineKeyboardButtons);
            return generalBotService.sendMessage(bot, chatId, subscription.restaurant, inlineKeyboardMarkup);
        });
        await Promise.all(promisesArr);
        mongoService.sendAnalyticLog(mongoConfig.WOLT.NAME, ANALYTIC_EVENT_NAMES.SHOW, { chatId })
        logger.info(showHandler.name, `${logBody} - success`);
    } catch (err) {
        logger.error(showHandler.name, `error - ${utilsService.getErrorMessage(err)}`);
        await generalBotService.sendMessage(bot, chatId, `Sorry, but something went wrong`, getKeyboardOptions());
    }
}

bot.on('text', textHandler);

async function textHandler(message) {
    let { chatId, firstName, lastName, text: restaurant } = generalBotService.getMessageData(message);
    restaurant = restaurant.toLowerCase();

    // prevent built in options to be processed also here
    if (Object.keys(WOLT_BOT_OPTIONS).map(key => WOLT_BOT_OPTIONS[key]).includes(restaurant)) return;

    const logBody = `message :: chatId: ${chatId}, firstname: ${firstName}, lastname: ${lastName}, restaurant: ${restaurant}`;
    logger.info(textHandler.name, `${logBody} - start`);

    try {
        mongoService.sendAnalyticLog(mongoConfig.WOLT.NAME, ANALYTIC_EVENT_NAMES.SEARCH, { restaurant, chatId });

        const filteredRestaurants = getFilteredRestaurants(restaurant);
        if (!filteredRestaurants.length) {
            const replyText = `I am sorry, I didn\'t find any restaurants matching your search - '${restaurant}'`;
            return await generalBotService.sendMessage(bot, chatId, replyText, getKeyboardOptions());
        }
        const restaurants = await woltService.enrichRestaurants(filteredRestaurants);
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
        await generalBotService.sendMessage(bot, chatId, `Sorry, but something went wrong`, getKeyboardOptions());
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
        logger.error(refreshRestaurants.name, `error - ${utilsService.getErrorMessage(err)}`);
        await generalBotService.sendMessage(bot, chatId, `Sorry, but something went wrong`, getKeyboardOptions());
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
        const restaurantDetails = restaurantsList.find(r => r.name === restaurant) || null;
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
            await mongoService.addSubscription(chatId, restaurant);
        }
    }

    mongoService.sendAnalyticLog(mongoConfig.WOLT.NAME, ANALYTIC_EVENT_NAMES.SUBSCRIBE, { restaurant, chatId });
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
    mongoService.sendAnalyticLog(mongoConfig.WOLT.NAME, ANALYTIC_EVENT_NAMES.UNSUBSCRIBE, { restaurant, chatId });
    return await generalBotService.sendMessage(bot, chatId, replyText, getKeyboardOptions());
}

function getFilteredRestaurants(searchInput) {
    const restaurants = [...restaurantsList];
    return restaurants.filter(restaurant => {
        return restaurant.name.toLowerCase().includes(searchInput.toLowerCase());
    }).slice(0, woltConfig.MAX_NUM_OF_RESTAURANTS_TO_SHOW);
}