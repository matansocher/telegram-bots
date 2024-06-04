const LOCAL_FILES_PATH = './assets/downloads';

const INITIAL_BOT_RESPONSE = `Hi {firstName}!\n\nI'm a bot that can help you with translations, transcriptions of text, audio and video files\n\nJust send me the data and I will do my thing`;

const VOICE_PAL_OPTIONS = {
    TRANSCRIBE: {
        displayName: 'Transcribe',
        selectedActionResponse: 'OK, send me an audio or video file you want me to transcribe',
        handler: 'handleTranscribeAction',
        analyticsEventName: 'TRANSCRIBE',
    },
    TRANSLATE: {
        displayName: 'Translate',
        selectedActionResponse: 'OK, send me a text, audio or a video file you want me to translate',
        handler: 'handleTranslateAction',
        analyticsEventName: 'TRANSLATE',
    },
    TEXT_TO_SPEECH: {
        displayName: 'Text to Speech',
        selectedActionResponse: 'OK, Send me the text you want me to convert to speech',
        handler: 'handleTextToSpeechAction',
        analyticsEventName: 'TEXT_TO_SPEECH',
    },
    SUMMARY_YOUTUBE_VIDEO: {
        displayName: 'Summary of a YouTube Video',
        selectedActionResponse: 'OK, Send me a link to a youtube video and I will summarize it for you',
        handler: 'handleSummarizeYoutubeVideoAction',
        analyticsEventName: 'SUMMARY_YOUTUBE_VIDEO',
    },
    SUMMARY_TIKTOK_VIDEO: {
        displayName: 'Summary of a Tiktok Video',
        selectedActionResponse: 'OK, Send me a link to a tiktok video and I will summarize it for you',
        handler: 'handleSummarizeTiktokVideoAction',
        analyticsEventName: 'SUMMARY_TIKTOK_VIDEO',
    },
};

const ANALYTIC_EVENT_NAMES = {
    Start: 'START',
    ...Object.fromEntries(
        Object.keys(VOICE_PAL_OPTIONS).map(option => [
            VOICE_PAL_OPTIONS[option].displayName,
            VOICE_PAL_OPTIONS[option].analyticsEventName,
        ])
    ),
};

const SUMMARY_PROMPTS = {
    YOUTUBE: 'You are a helpful assistant. You will be provided with a transcription of a youtube video from the user, the includes all the sentences in the video and the timestamp.' +
        'Please summarize the transcript. You can also split the summary into section, and add to each section its header and also the time frame the content of the section.',
    TIKTOK: 'You are a helpful assistant. You will be provided with a transcription of a video from the user, the includes all the sentences in the video and the timestamp.' +
        'Please summarize the transcript. You can also split the summary into section, and add to each section its header',
};

const NOT_FOUND_VIDEO_MESSAGES = {
    YOUTUBE: 'I am having trouble finding the youtube video you shared. please send me a link in this format - https://www.youtube.com/watch?v=xxxxxxxxxxxx',
    TIKTOK: 'I am having trouble finding the tiktok video you shared. please send me a link in this format - https://www.tiktok.com/@{username}/video/xxxxxxxxxxxx',
};

module.exports = {
    LOCAL_FILES_PATH,
    VOICE_PAL_OPTIONS,
    INITIAL_BOT_RESPONSE,
    SUMMARY_PROMPTS,
    NOT_FOUND_VIDEO_MESSAGES,
    ANALYTIC_EVENT_NAMES,
};
