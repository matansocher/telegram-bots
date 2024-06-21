const {
    INITIAL_BOT_RESPONSE,
    NOTEBOOK_BOT_ACTIONS_TO_SAVE,
    NOTEBOOK_LIST_ACTIONS,
    ANALYTIC_EVENT_NAMES, NOTEBOOK_LIST_ITEM_ACTIONS,
} = require('./notebook.config');
const notebookUtils = require('./notebook.utils');
const userSelectionService = require('./user-selections.service');
const mongoService = require('../mongo/notebook/mongo.service');
const generalBotService = require('../../telegram-bots/general-bot.service');
const { LOCAL_FILES_PATH } = require('../voice-pal/voice-pal.config');
const imgurService = require('../imgur.service');

class NotebookService {
    constructor(bot, chatId) {
        this.bot = bot;
        this.chatId = chatId;
    }

    async handleActionSelection(selection, data) {
        userSelectionService.setCurrentUserAction(this.chatId, selection, data);
        const relevantAction = Object.keys(NOTEBOOK_BOT_ACTIONS_TO_SAVE).find(option => NOTEBOOK_BOT_ACTIONS_TO_SAVE[option].displayName === selection);
        await generalBotService.sendMessage(this.bot, this.chatId, NOTEBOOK_BOT_ACTIONS_TO_SAVE[relevantAction].selectedActionResponse, notebookUtils.getKeyboardOptions());
    }

    async handleAction(message, userAction, data = null) {
        const { text, photo } = generalBotService.getMessageData(message);

        if (!userAction) {
            return generalBotService.sendMessage(this.bot, this.chatId, `Please select an action first.`);
        }

        await this[userAction.handler]({ text, photo }, data);

        // mongoService.sendAnalyticLog(ANALYTIC_EVENT_NAMES[userAction], { chatId: this.chatId });
        userSelectionService.removeCurrentUserAction(this.chatId);
    }

    async handleStartAction({ telegramUserId, chatId, firstName, lastName, username }) {
        mongoService.saveUserDetails({ telegramUserId, chatId, firstName, lastName, username });
        const replyText = INITIAL_BOT_RESPONSE.replace('{firstName}', firstName || username || '');
        await generalBotService.sendMessage(this.bot, this.chatId, replyText, notebookUtils.getKeyboardOptions());
        mongoService.sendAnalyticLog(ANALYTIC_EVENT_NAMES.Start, { chatId })
    }

    async handleShowListsAction() {
        const lists = await mongoService.getLists(this.chatId);
        if (!lists.length) {
            // const keyboardButtons = [NOTEBOOK_BOT_ACTIONS_TO_SAVE.NEW_LIST.displayName];
            // const inlineKeyboardMarkup = generalBotService.getInlineKeyboardMarkup(keyboardButtons);
            const replyText = 'You don\'t have any lists yet';
            return await generalBotService.sendMessage(this.bot, this.chatId, replyText, { ...notebookUtils.getKeyboardOptions() });
        }

        const promisesArr = lists.map(list => {
            const inlineKeyboardButtons = Object.keys(NOTEBOOK_LIST_ACTIONS).map(action => {
                return { text: NOTEBOOK_LIST_ACTIONS[action].displayName, callback_data: generalBotService.encodeCallbackData({ listId: list._id.toString(), action }) };
            });
            const inlineKeyboardMarkup = generalBotService.getInlineKeyboardMarkup(inlineKeyboardButtons, 2);
            if (list.photo) {
                return generalBotService.sendPhoto(this.bot, this.chatId, list.photo, { ...inlineKeyboardMarkup, caption: list.name });
                // return generalBotService.sendPhoto(this.bot, this.chatId, list.name, inlineKeyboardMarkup);
            }
            return generalBotService.sendMessage(this.bot, this.chatId, list.name, inlineKeyboardMarkup);
        });
        await Promise.all(promisesArr);
        // mongoService.sendAnalyticLog(ANALYTIC_EVENT_NAMES.SHOW, { chatId: this.chatId })
    }

    async handleNewListAction({ text }) {
        await mongoService.createList(this.chatId, text);
        await generalBotService.sendMessage(this.bot, this.chatId, `New list "${text}" created`, notebookUtils.getKeyboardOptions());
    }

    async handleRemoveListAction({ text }, { listId }) {
        await mongoService.removeList(this.chatId, listId);
        await generalBotService.sendMessage(this.bot, this.chatId, `List removed`, notebookUtils.getKeyboardOptions());
    }

    async handleUpdateListAction({ text, photo }, { listId }) {

        let photoURL;
        if (photo) {
            const fileId = photo.file_id || photo[photo.length - 1].file_id;
            const imageLocalPath = await generalBotService.downloadFile(this.bot, fileId, LOCAL_FILES_PATH);
            photoURL = await imgurService.uploadImage(imageLocalPath);
        }
        await mongoService.updateList(this.chatId, listId, text, photoURL);
        await generalBotService.sendMessage(this.bot, this.chatId, `List ${photo ? 'photo' : 'name'} updated`, notebookUtils.getKeyboardOptions());
    }

    async handleShowListItemsAction({ text }, { listId }) {
        const list = await mongoService.getList(this.chatId, listId);
        if (!list) {
            return await generalBotService.sendMessage(this.bot, this.chatId, `List not found`, notebookUtils.getKeyboardOptions());
        }

        const listItems = await mongoService.getListItems(this.chatId, listId);
        if (!listItems || !listItems.length) {
            return await generalBotService.sendMessage(this.bot, this.chatId, `List empty`, notebookUtils.getKeyboardOptions());
        }

        const promisesArr = listItems.map(item => {
            const inlineKeyboardButtons = Object.keys(NOTEBOOK_LIST_ITEM_ACTIONS).map(action => {
                return { text: NOTEBOOK_LIST_ITEM_ACTIONS[action].displayName, callback_data: generalBotService.encodeCallbackData({ itemId: item._id.toString(), action }) };
            });
            const inlineKeyboardMarkup = generalBotService.getInlineKeyboardMarkup(inlineKeyboardButtons, 2);
            return generalBotService.sendMessage(this.bot, this.chatId, item.name, inlineKeyboardMarkup);
        });
        await Promise.all(promisesArr);
        // mongoService.sendAnalyticLog(ANALYTIC_EVENT_NAMES.SHOW_ITEMS, this.chatI, text)
    }

    async handleAddListItemAction({ text }, { listId }) {
        await mongoService.createListItem(this.chatId, listId, text);
        await generalBotService.sendMessage(this.bot, this.chatId, `New item added`, notebookUtils.getKeyboardOptions());
    }

    async handleUpdateListItemAction({ text, photo }, { itemId }) {
        await mongoService.updateListItem(this.chatId, itemId, { name: text, photo });
        await generalBotService.sendMessage(this.bot, this.chatId, `Item updated`, notebookUtils.getKeyboardOptions());
    }

    async handleRemoveListItemAction({ text }, { itemId }) {
        await mongoService.removeListItem(this.chatId, itemId);
        await generalBotService.sendMessage(this.bot, this.chatId, `Item removed`, notebookUtils.getKeyboardOptions());
    }
}

module.exports = NotebookService;
