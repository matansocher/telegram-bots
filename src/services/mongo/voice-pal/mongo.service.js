const { MongoClient } = require('mongodb');
const config = require('../../../config');
const mongoConfig = require('./mongo.config');
const utilsService = require('../../utils.service');
const logger = new (require('../../logger.service'))(module.filename);

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
        logger.error(loggerConnectFunctionName, 'Failed to connect to mongo server', err);
        throw err;
    }
})();

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
    saveUserDetails,
    sendAnalyticLog,
}
