const LOCAL_FILES_PATH = './assets/downloads';

const VOICE_PAL_OPTIONS = {
    TRANSCRIBE: 'Transcribe',
    TRANSLATE: 'Translate',
    TEXT_TO_SPEECH: 'Text to Speech',
    SUMMARY_YOUTUBE_VIDEO: 'Summary of a YouTube Video',
};

const INITIAL_BOT_RESPONSE = `Hi {firstName}!\n\nI'm a bot that can help you with translations, transcriptions of text, audio and video files\n\nJust send me the data and I will do my thing`;

const YOUTUBE_SUMMARY_PROMPT = `'You are a helpful assistant. you will be provided with a transcription from the user, please summarize it.'`;

const SELECTED_ACTIONS_RESPONSES = {
    [VOICE_PAL_OPTIONS.TRANSCRIBE]: 'OK, send me an audio or video file you want me to transcribe',
    [VOICE_PAL_OPTIONS.TRANSLATE]: 'OK, send me a text, audio or a video file you want me to translate',
    [VOICE_PAL_OPTIONS.TEXT_TO_SPEECH]: 'OK. Send me the text you want me to convert to speech',
    [VOICE_PAL_OPTIONS.SUMMARY_YOUTUBE_VIDEO]: 'OK. Send me a link to a youtube video and I will summarize it for you',
}

const ANALYTIC_EVENT_NAMES = {
    START: 'START',
    TRANSCRIBE: 'TRANSCRIBE',
    TRANSLATE: 'TRANSLATE',
    TEXT_TO_SPEECH: 'TEXT_TO_SPEECH',
    SUMMARY_YOUTUBE_VIDEO: 'SUMMARY_YOUTUBE_VIDEO',
};

module.exports = {
    LOCAL_FILES_PATH,
    VOICE_PAL_OPTIONS,
    INITIAL_BOT_RESPONSE,
    YOUTUBE_SUMMARY_PROMPT,
    SELECTED_ACTIONS_RESPONSES,
    ANALYTIC_EVENT_NAMES,
};
