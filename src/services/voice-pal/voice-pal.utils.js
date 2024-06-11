const { VOICE_PAL_OPTIONS, POSSIBLE_INPUTS} = require('./voice-pal.config');

function getKeyboardOptions() {
    return {
        reply_markup: {
            keyboard: Object.keys(VOICE_PAL_OPTIONS).map(option => {
                return [{ text: VOICE_PAL_OPTIONS[option].displayName }];
            }),
            resize_keyboard: true,
        },
    }
}

function validateActionWithMessage(userAction, messageParams) {
    const { possibleInputs } = userAction;

    const messageParamsExistenceMap = {};
    Object.keys(POSSIBLE_INPUTS).forEach(possibleInputKey => {
        messageParamsExistenceMap[possibleInputKey.toLowerCase()] = !!messageParams[POSSIBLE_INPUTS[possibleInputKey]];
    });

    let isValid = false;
    for (const possibleInput of possibleInputs) {
        isValid = isValid || messageParamsExistenceMap[possibleInput];
    }

    if (!isValid) {
        return `For this action you must pass one of these types of input: [${possibleInputs.join(', ')}]`;
    }
}

module.exports = {
    getKeyboardOptions,
    validateActionWithMessage,
};
