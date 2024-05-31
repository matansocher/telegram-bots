
const SUBSCRIPTION_MODEL = {
    chatId: Number,
    restaurant: String,
    isActive: Boolean,
    createdAt: Number,
}

const USER_MODEL = {
    telegramUserId: Number,
    chatId: Number,
    firstName: String,
    lastName: String,
    username: String,
}

const ANALYTIC_LOG_MODEL = {
    eventName: String,
    restaurant: String,
    isActive: Boolean,
    createdAt: Number,
}

const CONVERSATION_MODEL = {
    chatId: Number,
    assistantId: String,
    threadId: String,
    createdAt: Number,
}

module.exports = {}
