const { MongoClient } = require('mongodb');
const config = require('../../../config');
const mongoConfig = require('./mongo.config');
const woltConfig = require('../../wolt/wolt.config');
const utilsService = require('../../utils.service');
const logger = new (require('../../logger.service'))(module.filename);

const loggerConnectFunctionName = 'mongo';

let subscriptionCollection;
let userCollection;
let analyticLogCollection;

const client = new MongoClient(mongoConfig.MONGO_DB_URL);

(async function connectToMongo() {
    try {
        await client.connect();
        logger.info(loggerConnectFunctionName, 'Connected successfully to mongo server');

        const WOLT_DB = client.db(mongoConfig.WOLT.NAME);
        subscriptionCollection = WOLT_DB.collection(mongoConfig.WOLT.COLLECTIONS.SUBSCRIPTIONS);
        userCollection = WOLT_DB.collection(mongoConfig.WOLT.COLLECTIONS.USER);
        analyticLogCollection = WOLT_DB.collection(mongoConfig.WOLT.COLLECTIONS.ANALYTIC_LOGS);
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

async function saveUserDetails({ telegramUserId, chatId, firstName, lastName, username }) {
    try {
        const existingUser = await userCollection.findOne({ telegramUserId });
        if (existingUser) {
            return;
        }
        const user = { telegramUserId, chatId, firstName, lastName, username };
        return userCollection.insertOne(user);
    } catch (err) {
        logger.error(saveUserDetails.name, `err: ${utilsService.getErrorMessage(err)}`);
    }
}

function sendAnalyticLog(eventName, { chatId, data = null }) {
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
    return analyticLogCollection.insertOne(log);
}

module.exports = {
    getActiveSubscriptions,
    getSubscription,
    addSubscription,
    archiveSubscription,
    getExpiredSubscriptions,
    saveUserDetails,
    sendAnalyticLog,
}
