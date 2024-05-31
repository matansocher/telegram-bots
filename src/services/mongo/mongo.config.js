const MONGO_DB_URL = process.env.MONGO_DB_URL;

const WOLT = {
    NAME: 'Wolt',
    COLLECTIONS: {
        SUBSCRIPTIONS: 'Subscription',
        USER: 'User',
        ANALYTIC_LOGS: 'AnalyticLogs',
    }
};

const VOICE_PAL = {
    NAME: 'VoicePal',
    COLLECTIONS: {
        USER: 'User',
        ANALYTIC_LOGS: 'AnalyticLogs',
    }
};

const REMINDERS = {
    NAME: 'Reminders',
    COLLECTIONS: {
        REMINDER: 'Reminder',
        USER: 'User',
        ANALYTIC_LOGS: 'AnalyticLogs',
    }
};

module.exports = {
    MONGO_DB_URL,
    WOLT,
    VOICE_PAL,
    REMINDERS,
};
