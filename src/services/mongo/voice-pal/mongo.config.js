const MONGO_DB_URL = process.env.MONGO_DB_URL;

const VOICE_PAL = {
    NAME: 'VoicePal',
    COLLECTIONS: {
        USER: 'User',
        ANALYTIC_LOGS: 'AnalyticLogs',
    }
};

module.exports = {
    MONGO_DB_URL,
    VOICE_PAL,
};
