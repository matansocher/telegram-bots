import { VOICE_PAL_OPTIONS, POSSIBLE_INPUTS } from './voice-pal.config';

export function getKeyboardOptions() {
    const options = {};
    for (const key in VOICE_PAL_OPTIONS) {
        if (VOICE_PAL_OPTIONS[key].hideFromKeyboard !== true) {
            options[key] = VOICE_PAL_OPTIONS[key];
        }
    }

    return {
        reply_markup: {
            keyboard: Object.keys(options).map(option => {
                return [{ text: options[option].displayName }];
            }),
            resize_keyboard: true,
        },
    }
}

export function validateActionWithMessage(userAction, messageParams) {
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
