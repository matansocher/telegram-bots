const config = require('../../../config');
const MONGO_DB_URL = process.env.MONGO_DB_URL;

const NOTEBOOK = {
    NAME: config.isProd ? 'Notebook' : 'NotebookStaging',
    COLLECTIONS: {
        USER: 'User',
        ANALYTIC_LOGS: 'AnalyticLogs',
        LIST: 'List',
        LIST_ITEM: 'ListItem',
    }
};

module.exports = {
    MONGO_DB_URL,
    NOTEBOOK,
};
