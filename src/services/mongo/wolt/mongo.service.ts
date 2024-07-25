import { MongoClient } from 'mongodb';
import * as config from '../../../config';
import * as mongoConfig from './mongo.config';
import * as woltConfig from '../../wolt/wolt.config';
import * as utilsService from '../../utils.service';
import LoggerService from '../../logger.service';
const logger = new LoggerService(module.filename);

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
        logger.error(loggerConnectFunctionName, `Failed to connect to mongo server - error - ${utilsService.getErrorMessage(err)}`);
        throw err;
    }
})();

export async function getActiveSubscriptions(chatId = null) {
    try {
        const filter: any = { isActive: true };
        if (chatId) filter.chatId = chatId;
        const cursor = subscriptionCollection.find(filter);
        return getMultipleResults(cursor);
    } catch (err) {
        logger.error(getActiveSubscriptions.name, `err: ${utilsService.getErrorMessage(err)}`);
        return [];
    }
}

export async function getSubscription(chatId, restaurant) {
    const filter = { chatId, restaurant, isActive: true };
    return subscriptionCollection.findOne(filter);
}

export async function addSubscription(chatId, restaurant, restaurantPhoto) {
    const subscription = {
        chatId,
        restaurant,
        restaurantPhoto,
        isActive: true,
        createdAt: new Date(),
    };
    return subscriptionCollection.insertOne(subscription);
}

export function archiveSubscription(chatId, restaurant) {
    const filter = { chatId, restaurant, isActive: true };
    const updateObj = { $set: { isActive: false } };
    return subscriptionCollection.updateOne(filter, updateObj);
}

export async function getExpiredSubscriptions() {
    const validLimitTimestamp = new Date().getTime() - (woltConfig.SUBSCRIPTION_EXPIRATION_HOURS * 60 * 60 * 1000);
    const filter = { isActive: true, createdAt: { $lt: validLimitTimestamp } };
    const cursor = subscriptionCollection.find(filter);
    return getMultipleResults(cursor);
}

export async function getMultipleResults(cursor) {
    const results = [];
    for await (const doc of cursor) {
        results.push(doc);
    }
    return results;
}

export async function saveUserDetails({ telegramUserId, chatId, firstName, lastName, username }) {
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

export function sendAnalyticLog(eventName, { chatId, data = null }) {
    if (!config.isProd) {
        return;
    }
    const log = {
        chatId,
        data,
        eventName,
        // message,
        // error,
        createdAt: new Date(),
    };
    return analyticLogCollection.insertOne(log);
}
