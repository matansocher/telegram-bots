const LOCAL_FILES_PATH = './assets/downloads';

const VOICE_PAL_OPTIONS = {
    TRANSCRIBE: 'Transcribe',
    TRANSLATE: 'Translate',
    TEXT_TO_SPEECH: 'Text to Speech',
};

const INITIAL_BOT_RESPONSE = `Hi {firstName}!\n\nI'm a bot that can help you with translations, transcriptions of text, audio and video files\n\nJust send me the data and I will do my thing`;

const SELECTED_ACTIONS_RESPONSES = {
    [VOICE_PAL_OPTIONS.TRANSCRIBE]: 'OK, send me an audio or video file you want me to transcribe',
    [VOICE_PAL_OPTIONS.TRANSLATE]: 'OK, send me a text, audio or a video file you want me to translate',
    [VOICE_PAL_OPTIONS.TEXT_TO_SPEECH]: 'OK. Send me the text you want me to convert to speech',
}

const ANALYTIC_EVENT_NAMES = {
    START: 'START',
    TRANSCRIBE: 'TRANSCRIBE',
    TRANSLATE: 'TRANSLATE',
    TEXT_TO_SPEECH: 'TEXT_TO_SPEECH',
};

module.exports = {
    LOCAL_FILES_PATH,
    VOICE_PAL_OPTIONS,
    INITIAL_BOT_RESPONSE,
    SELECTED_ACTIONS_RESPONSES,
    ANALYTIC_EVENT_NAMES,
};
