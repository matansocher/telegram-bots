import { NOTEBOOK_BOT_OPTIONS} from './notebook.config';

export function getKeyboardOptions() {
    return {
        reply_markup: {
            keyboard: Object.keys(NOTEBOOK_BOT_OPTIONS).map(option => {
                return [{ text: NOTEBOOK_BOT_OPTIONS[option] }];
            }),
            resize_keyboard: true,
        },
    }
}
