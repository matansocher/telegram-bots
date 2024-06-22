const { BOT_BROADCAST_ACTIONS } = require('../../telegram-bots/general-bot.config');

const LOCAL_FILES_PATH = './assets/downloads';

const INITIAL_BOT_RESPONSE = `Hi {firstName}!\n\nI'm a bot that can help you with translations, transcriptions of text, audio and video files\n\nJust send me the data and I will do my thing`;

const POSSIBLE_INPUTS = {
    TEXT: 'text',
    AUDIO: 'audio',
    VIDEO: 'video',
    PHOTO: 'photo',
};

const VOICE_PAL_OPTIONS = {
    TRANSCRIBE: {
        displayName: 'Transcribe',
        selectedActionResponse: 'OK, send me an audio or video file you want me to transcribe',
        handler: 'handleTranscribeAction',
        analyticsEventName: 'TRANSCRIBE',
        possibleInputs: [POSSIBLE_INPUTS.VIDEO, POSSIBLE_INPUTS.AUDIO],
        showLoader: true,
    },
    TRANSLATE: {
        displayName: 'Translate',
        selectedActionResponse: 'OK, send me a text, audio or a video file you want me to translate',
        handler: 'handleTranslateAction',
        analyticsEventName: 'TRANSLATE',
        possibleInputs: [POSSIBLE_INPUTS.TEXT, POSSIBLE_INPUTS.VIDEO, POSSIBLE_INPUTS.AUDIO],
        showLoader: false,
    },
    TEXT_TO_SPEECH: {
        displayName: 'Text to Speech',
        selectedActionResponse: 'OK, Send me the text you want me to convert to speech',
        handler: 'handleTextToSpeechAction',
        analyticsEventName: 'TEXT_TO_SPEECH',
        possibleInputs: [POSSIBLE_INPUTS.TEXT],
        showLoader: true,
        loaderType: BOT_BROADCAST_ACTIONS.UPLOADING_VOICE,
    },
    SUMMARY_TEXT: {
        displayName: 'Summarize Text',
        selectedActionResponse: 'OK, Send me the text, and I will summarize it for you',
        handler: 'handleSummarizeTextAction',
        analyticsEventName: 'SUMMARY_TEXT',
        possibleInputs: [POSSIBLE_INPUTS.TEXT],
        showLoader: true,
    },
    SUMMARY_YOUTUBE_VIDEO: {
        displayName: 'Summary of a YouTube Video',
        selectedActionResponse: 'OK, Send me a link to a youtube video and I will summarize it for you',
        handler: 'handleSummarizeYoutubeVideoAction',
        analyticsEventName: 'SUMMARY_YOUTUBE_VIDEO',
        possibleInputs: [POSSIBLE_INPUTS.TEXT],
        showLoader: true,
    },
    SUMMARY_TIKTOK_VIDEO: {
        displayName: 'Summary of a Tiktok Video',
        selectedActionResponse: 'OK, Send me a link to a tiktok video and I will summarize it for you',
        handler: 'handleSummarizeTiktokVideoAction',
        analyticsEventName: 'SUMMARY_TIKTOK_VIDEO',
        possibleInputs: [POSSIBLE_INPUTS.TEXT],
        showLoader: true,
    },
    SUMMARY_INSTAGRAM_VIDEO: {
        displayName: 'Summary of a Instagram Video',
        selectedActionResponse: 'OK, Send me a link to an instagram video and I will summarize it for you',
        handler: 'handleSummarizeMetaVideoAction',
        analyticsEventName: 'SUMMARY_INSTAGRAM_VIDEO',
        possibleInputs: [POSSIBLE_INPUTS.TEXT],
        showLoader: true,
    },
    SUMMARY_FACEBOOK_VIDEO: {
        displayName: 'Summary of a Facebook Video',
        selectedActionResponse: 'OK, Send me a link to an facebook video and I will summarize it for you',
        handler: 'handleSummarizeMetaVideoAction',
        analyticsEventName: 'SUMMARY_FACEBOOK_VIDEO',
        possibleInputs: [POSSIBLE_INPUTS.TEXT],
        showLoader: true,
    },
    // IMAGE_GENERATION: {
    //     displayName: 'Image Generation',
    //     selectedActionResponse: 'OK, Send me the description of the image and I will create it for you',
    //     handler: 'handleImageGenerationAction',
    //     analyticsEventName: 'IMAGE_GENERATION',
    //     possibleInputs: [POSSIBLE_INPUTS.TEXT],
    //     showLoader: true,
    // },
    IMAGE_ANALYZER: {
        displayName: 'Image Analyzer',
        selectedActionResponse: 'OK, Send me an image and I will analyze it for you',
        handler: 'handleImageAnalyzerAction',
        analyticsEventName: 'IMAGE_ANALYZER',
        possibleInputs: [POSSIBLE_INPUTS.PHOTO],
        showLoader: true,
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

const SUMMARY_PROMPT = 'You are a helpful assistant. You will be provided with a text from the user.' +
    'Please summarize the transcript. You can also split the summary into section, and add to each section its header.';

const NOT_FOUND_VIDEO_MESSAGES = {
    YOUTUBE: 'I am having trouble finding the youtube video you shared. please send me a link in this format - https://www.youtube.com/watch?v=xxxxxxxxxxxx',
    TIKTOK: 'I am having trouble finding the tiktok video you shared. please send me a link in this format - https://www.tiktok.com/@{username}/video/xxxxxxxxxxxx',
    META: 'I am having trouble finding the instagram video you shared',
};

module.exports = {
    LOCAL_FILES_PATH,
    VOICE_PAL_OPTIONS,
    POSSIBLE_INPUTS,
    INITIAL_BOT_RESPONSE,
    SUMMARY_PROMPT,
    NOT_FOUND_VIDEO_MESSAGES,
    ANALYTIC_EVENT_NAMES,
};
