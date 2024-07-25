import { MongoClient } from 'mongodb';
import * as config from '../../../config';
import * as mongoConfig from './mongo.config';
import * as utilsService from '../../utils.service';
import LoggerService from '../../logger.service';
const logger = new LoggerService(module.filename);

const loggerConnectFunctionName = 'mongo';

let userCollection;
let analyticLogCollection;

const client = new MongoClient(mongoConfig.MONGO_DB_URL);

(async function connectToMongo() {
    try {
        await client.connect();
        logger.info(loggerConnectFunctionName, 'Connected successfully to mongo server');

        const DB = client.db(mongoConfig.VOICE_PAL.NAME);
        userCollection = DB.collection(mongoConfig.VOICE_PAL.COLLECTIONS.USER);
        analyticLogCollection = DB.collection(mongoConfig.VOICE_PAL.COLLECTIONS.ANALYTIC_LOGS);
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

export function sendAnalyticLog(eventName, { chatId, data = null, error = '' }) {
    if (!config.isProd) {
        return;
    }
    const log = {
        chatId,
        data,
        eventName,
        ...(!!error && { error }),
        createdAt: new Date(),
    };
    return analyticLogCollection.insertOne(log);
}
