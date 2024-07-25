import { MongoClient, ObjectId } from 'mongodb';
import * as config from '../../../config';
import * as mongoConfig from './mongo.config';
import * as utilsService from '../../utils.service';
import LoggerService from '../../logger.service';
const logger = new LoggerService(module.filename);

const loggerConnectFunctionName = 'mongo';

let userCollection;
let analyticLogCollection;
let listCollection;
let listItemCollection;

const client = new MongoClient(mongoConfig.MONGO_DB_URL);

(async function connectToMongo() {
    try {
        await client.connect();
        logger.info(loggerConnectFunctionName, 'Connected successfully to mongo server');

        const DB = client.db(mongoConfig.NOTEBOOK.NAME);
        userCollection = DB.collection(mongoConfig.NOTEBOOK.COLLECTIONS.USER);
        analyticLogCollection = DB.collection(mongoConfig.NOTEBOOK.COLLECTIONS.ANALYTIC_LOGS);
        listCollection = DB.collection(mongoConfig.NOTEBOOK.COLLECTIONS.LIST);
        listItemCollection = DB.collection(mongoConfig.NOTEBOOK.COLLECTIONS.LIST_ITEM);
    } catch (err) {
        logger.error(loggerConnectFunctionName, `Failed to connect to mongo server - error - ${utilsService.getErrorMessage(err)}`);
        throw err;
    }
})();

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

export async function getMultipleResults(cursor) {
    const results = [];
    for await (const doc of cursor) {
        results.push(doc);
    }
    return results;
}

export function getLists(chatId) {
    try {
        const filter = { chatId, isActive: true };
        const cursor = listCollection.find(filter);
        return getMultipleResults(cursor);
    } catch (err) {
        logger.error(getLists.name, `err: ${utilsService.getErrorMessage(err)}`);
        return [];
    }
}

export function getList(chatId, listId) {
    const filter = { _id: new ObjectId(listId), chatId, isActive: true };
    return listCollection.findOne(filter);
}

export function createList(chatId, name) {
    const list = {
        chatId,
        name,
        isActive: true,
        createdAt: new Date(),
    };
    return listCollection.insertOne(list);
}

export function updateList(chatId, listId, newName, newPhoto) {
    const filter = { _id: new ObjectId(listId), chatId, isActive: true };
    const updateObj = { $set: {} };
    if (newName) {
        updateObj.$set.name = newName;
    }
    if (newPhoto) {
        updateObj.$set.photo = newPhoto;
    }
    return listCollection.updateOne(filter, updateObj);
}

export function removeList(chatId, listId) {
    const filter = { _id: new ObjectId(listId), chatId, isActive: true };
    const updateObj = { $set: { isActive: false } };
    return listCollection.updateOne(filter, updateObj);
}

export function getListItems(chatId, listId) {
    const filter = { chatId, listId, isActive: true };
    const cursor = listItemCollection.find(filter);
    return getMultipleResults(cursor);
}

export function createListItem(chatId, listId, name) {
    const listItem = {
        chatId,
        listId,
        name,
        isActive: true,
        createdAt: new Date(),
    };
    return listItemCollection.insertOne(listItem);
}

export function updateListItem(chatId, listItemId, { name, photo }) {
    const filter = { _id: new ObjectId(listItemId), chatId, isActive: true };
    const updateObj = { $set: {} };
    if (name) {
        updateObj.$set.name = name;
    }
    if (photo) {
        updateObj.$set.photo = photo;
    }
    return listItemCollection.updateOne(filter, updateObj);
}

export function removeListItem(chatId, listItemId) {
    const filter = { _id: new ObjectId(listItemId), chatId, isActive: true };
    const updateObj = { $set: { isActive: false } };
    return listItemCollection.updateOne(filter, updateObj);
}
