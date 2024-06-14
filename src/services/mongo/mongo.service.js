const { MongoClient } = require('mongodb');
const config = require('../../config');
const mongoConfig = require('./mongo.config');
const woltConfig = require('../wolt/wolt.config');
const utilsService = require('../utils.service');
const logger = new (require('../logger.service'))(module.filename);

const loggerConnectFunctionName = 'mongo';

let subscriptionCollection;
let userCollectionWolt;
let analyticLogCollectionWolt;

let userCollectionVoicePal;
let analyticLogCollectionVoicePal;

let reminderCollection;
let userCollectionReminders;
let analyticLogCollectionReminders;

const client = new MongoClient(mongoConfig.MONGO_DB_URL);

(async function connectToMongo() {
    try {
        await client.connect();
        logger.info(loggerConnectFunctionName, 'Connected successfully to mongo server');

        const WOLT_DB = client.db(mongoConfig.WOLT.NAME);
        subscriptionCollection = WOLT_DB.collection(mongoConfig.WOLT.COLLECTIONS.SUBSCRIPTIONS);
        userCollectionWolt = WOLT_DB.collection(mongoConfig.WOLT.COLLECTIONS.USER);
        analyticLogCollectionWolt = WOLT_DB.collection(mongoConfig.WOLT.COLLECTIONS.ANALYTIC_LOGS);

        const VOICE_PAL_DB = client.db(mongoConfig.VOICE_PAL.NAME);
        userCollectionVoicePal = VOICE_PAL_DB.collection(mongoConfig.VOICE_PAL.COLLECTIONS.USER);
        analyticLogCollectionVoicePal = VOICE_PAL_DB.collection(mongoConfig.VOICE_PAL.COLLECTIONS.ANALYTIC_LOGS);

        const REMINDERS_DB = client.db(mongoConfig.REMINDERS.NAME);
        reminderCollection = REMINDERS_DB.collection(mongoConfig.REMINDERS.COLLECTIONS.REMINDER);
        userCollectionReminders = REMINDERS_DB.collection(mongoConfig.REMINDERS.COLLECTIONS.USER);
        analyticLogCollectionReminders = REMINDERS_DB.collection(mongoConfig.REMINDERS.COLLECTIONS.ANALYTIC_LOGS);
    } catch (err) {
        logger.error(loggerConnectFunctionName, 'Failed to connect to mongo server', err);
        throw err;
    }
})();

async function getActiveSubscriptions(chatId = null) {
    try {
        const filter = { isActive: true };
        if (chatId) filter.chatId = chatId;
        const cursor = subscriptionCollection.find(filter);
        return getMultipleResults(cursor);
    } catch (err) {
        logger.error(getActiveSubscriptions.name, `err: ${utilsService.getErrorMessage(err)}`);
        return [];
    }
}

async function getSubscription(chatId, restaurant) {
    const filter = { chatId, restaurant, isActive: true };
    return subscriptionCollection.findOne(filter);
}

async function addSubscription(chatId, restaurant, restaurantPhoto) {
    const subscription = {
        chatId,
        restaurant,
        restaurantPhoto,
        isActive: true,
        createdAt: new Date().getTime(),
    };
    return subscriptionCollection.insertOne(subscription);
}

function archiveSubscription(chatId, restaurant) {
    const filter = { chatId, restaurant, isActive: true };
    const updateObj = { $set: { isActive: false } };
    return subscriptionCollection.updateOne(filter, updateObj);
}

async function getExpiredSubscriptions() {
    const validLimitTimestamp = new Date().getTime() - (woltConfig.SUBSCRIPTION_EXPIRATION_HOURS * 60 * 60 * 1000);
    const filter = { isActive: true, createdAt: { $lt: validLimitTimestamp } };
    const cursor = subscriptionCollection.find(filter);
    return getMultipleResults(cursor);
}

async function getMultipleResults(cursor) {
    const results = [];
    for await (const doc of cursor) {
        results.push(doc);
    }
    return results;
}

async function saveWoltUserDetails({ telegramUserId, chatId, firstName, lastName, username }) {
    try {
        const existingUser = await userCollectionWolt.findOne({ telegramUserId });
        if (existingUser) {
            return;
        }
        const user = { telegramUserId, chatId, firstName, lastName, username };
        return userCollectionWolt.insertOne(user);
    } catch (err) {
        logger.error(saveWoltUserDetails.name, `err: ${utilsService.getErrorMessage(err)}`);
    }
}

async function saveVoicePalUserDetails({ telegramUserId, chatId, firstName, lastName, username }) {
    try {
        const existingUser = await userCollectionVoicePal.findOne({ telegramUserId });
        if (existingUser) {
            return;
        }
        const user = { telegramUserId, chatId, firstName, lastName, username };
        return userCollectionVoicePal.insertOne(user);
    } catch (err) {
        logger.error(saveVoicePalUserDetails.name, `err: ${utilsService.getErrorMessage(err)}`);
    }
}

function sendWoltAnalyticLog(eventName, { chatId, data = null }) {
    if (!config.isProd) {
        return;
    }
    const log = {
        chatId,
        data,
        eventName,
        // message,
        // error,
        createdAt: new Date().getTime(),
    };
    return analyticLogCollectionWolt.insertOne(log);
}

function sendVoicePalAnalyticLog(eventName, { chatId, data = null }) {
    if (!config.isProd) {
        return;
    }
    const log = {
        chatId,
        data,
        eventName,
        // message,
        // error,
        createdAt: new Date().getTime(),
    };
    return analyticLogCollectionWolt.insertOne(log);
}

module.exports = {
    getActiveSubscriptions,
    getSubscription,
    addSubscription,
    archiveSubscription,
    getExpiredSubscriptions,
    saveWoltUserDetails,
    saveVoicePalUserDetails,
    sendWoltAnalyticLog,
    sendVoicePalAnalyticLog,
}
