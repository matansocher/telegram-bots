import { isProd } from '../../../config';

export const MONGO_DB_URL = process.env.MONGO_DB_URL;

export const NOTEBOOK = {
    NAME: isProd ? 'Notebook' : 'NotebookStaging',
    COLLECTIONS: {
        USER: 'User',
        ANALYTIC_LOGS: 'AnalyticLogs',
        LIST: 'List',
        LIST_ITEM: 'ListItem',
    }
};
