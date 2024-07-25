export const INITIAL_BOT_RESPONSE = `Hi {firstName}!\n\nI'm a bot that can be used as a notebook, and help save stuff and organize it`;

// action that the bot need to save the current action so the next message will be treated with that action
export const NOTEBOOK_BOT_ACTIONS_TO_SAVE = {
    NEW_LIST: {
        displayName: 'New List',
        selectedActionResponse: 'OK, send me the name and I will create the list',
        handler: 'handleNewListAction',
    },
    UPDATE_LIST: {
        displayName: 'Update List',
        selectedActionResponse: 'OK, send me a new name or a new photo and I will update the list',
        handler: 'handleUpdateListAction',
    },
    ADD_LIST_ITEM: {
        displayName: 'Add Item',
        selectedActionResponse: 'OK, send me the item and I will add it to the list',
        handler: 'handleAddListItemAction',
    },
    UPDATE_LIST_ITEM: {
        displayName: 'Update Item',
        selectedActionResponse: 'OK, send me a new name or a new photo and I will update the item',
        handler: 'handleUpdateListItemAction',
    },
};

// action that the bot handles immediately
export const NOTEBOOK_BOT_ACTIONS_TO_HANDLE = {
    SHOW_LIST_ITEMS: {
        displayName: 'List Items',
        // selectedActionResponse: 'OK, send me an audio or video file you want me to transcribe',
        handler: 'handleShowListItemsAction',
    },
    SHOW_LISTS: {
        displayName: 'Show Lists',
        // selectedActionResponse: 'OK, send me an audio or video file you want me to transcribe',
        handler: 'handleShowListsAction',
    },
    REMOVE_LIST: {
        displayName: 'Remove',
        // selectedActionResponse: 'OK, send me an audio or video file you want me to transcribe',
        handler: 'handleRemoveListAction',
    },
    REMOVE_LIST_ITEM: {
        displayName: 'Remove',
        // selectedActionResponse: 'OK, send me an audio or video file you want me to transcribe',
        handler: 'handleRemoveListItemAction',
    },
};

export const NOTEBOOK_BOT_ACTIONS = {
    // START: {
    //     displayName: 'Start',
    //     // selectedActionResponse: 'OK, send me an audio or video file you want me to transcribe',
    //     handler: 'handleStartAction',
    // },
    ...NOTEBOOK_BOT_ACTIONS_TO_SAVE,
    ...NOTEBOOK_BOT_ACTIONS_TO_HANDLE,
};

export const NOTEBOOK_BOT_OPTIONS = {
    // START: '/start',
    SHOW_LISTS: NOTEBOOK_BOT_ACTIONS_TO_HANDLE.SHOW_LISTS.displayName,
    NEW_LIST: NOTEBOOK_BOT_ACTIONS_TO_SAVE.NEW_LIST.displayName,
};

export const NOTEBOOK_LIST_ACTIONS = {
    SHOW_LIST_ITEMS: NOTEBOOK_BOT_ACTIONS_TO_HANDLE.SHOW_LIST_ITEMS,
    UPDATE_LIST: NOTEBOOK_BOT_ACTIONS_TO_SAVE.UPDATE_LIST,
    ADD_LIST_ITEM: NOTEBOOK_BOT_ACTIONS_TO_SAVE.ADD_LIST_ITEM,
    REMOVE_LIST: NOTEBOOK_BOT_ACTIONS_TO_HANDLE.REMOVE_LIST,
};

export const NOTEBOOK_LIST_ITEM_ACTIONS = {
    UPDATE_LIST_ITEM: NOTEBOOK_BOT_ACTIONS_TO_SAVE.UPDATE_LIST_ITEM,
    REMOVE_LIST_ITEM: NOTEBOOK_BOT_ACTIONS_TO_HANDLE.REMOVE_LIST_ITEM,
};

export const ANALYTIC_EVENT_NAMES = {
    START: 'START',
    SHOW: 'SHOW',
    ERROR: 'ERROR',
};
