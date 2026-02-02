export const OCR_LANGUAGE = [
    { langcode: "afr", lang: "Afrikaans" },
    { langcode: "amh", lang: "Amharic" },
    { langcode: "ara", lang: "Arabic" },
    { langcode: "asm", lang: "Assamese" },
    { langcode: "aze", lang: "Azerbaijani" },
    { langcode: "aze_cyrl", lang: "Azerbaijani - Cyrillic" },
    { langcode: "bel", lang: "Belarusian" },
    { langcode: "ben", lang: "Bengali" },
    { langcode: "bod", lang: "Tibetan" },
    { langcode: "bos", lang: "Bosnian" },
    { langcode: "bul", lang: "Bulgarian" },
    { langcode: "cat", lang: "Catalan; Valencian" },
    { langcode: "ceb", lang: "Cebuano" },
    { langcode: "ces", lang: "Czech" },
    { langcode: "chi_sim", lang: "Chinese - Simplified" },
    { langcode: "chi_tra", lang: "Chinese - Traditional" },
    { langcode: "chr", lang: "Cherokee" },
    { langcode: "cym", lang: "Welsh" },
    { langcode: "dan", lang: "Danish" },
    { langcode: "deu", lang: "German" },
    { langcode: "dzo", lang: "Dzongkha" },
    { langcode: "ell", lang: "Greek, Modern (1453-)" },
    { langcode: "eng", lang: "English" },
    { langcode: "enm", lang: "English, Middle (1100-1500)" },
    { langcode: "epo", lang: "Esperanto" },
    { langcode: "est", lang: "Estonian" },
    { langcode: "eus", lang: "Basque" },
    { langcode: "fas", lang: "Persian" },
    { langcode: "fin", lang: "Finnish" },
    { langcode: "fra", lang: "French" },
    { langcode: "frk", lang: "German Fraktur" },
    { langcode: "frm", lang: "French, Middle (ca. 1400-1600)" },
    { langcode: "gle", lang: "Irish" },
    { langcode: "glg", lang: "Galician" },
    { langcode: "grc", lang: "Greek, Ancient (-1453)" },
    { langcode: "guj", lang: "Gujarati" },
    { langcode: "hat", lang: "Haitian; Haitian Creole" },
    { langcode: "heb", lang: "Hebrew" },
    { langcode: "hin", lang: "Hindi" },
    { langcode: "hrv", lang: "Croatian" },
    { langcode: "hun", lang: "Hungarian" },
    { langcode: "iku", lang: "Inuktitut" },
    { langcode: "ind", lang: "Indonesian" },
    { langcode: "isl", lang: "Icelandic" },
    { langcode: "ita", lang: "Italian" },
    { langcode: "ita_old", lang: "Italian - Old" },
    { langcode: "jav", lang: "Javanese" },
    { langcode: "jpn", lang: "Japanese" },
    { langcode: "kan", lang: "Kannada" },
    { langcode: "kat", lang: "Georgian" },
    { langcode: "kat_old", lang: "Georgian - Old" },
    { langcode: "kaz", lang: "Kazakh" },
    { langcode: "khm", lang: "Central Khmer" },
    { langcode: "kir", lang: "Kirghiz; Kyrgyz" },
    { langcode: "kor", lang: "Korean" },
    { langcode: "kur", lang: "Kurdish" },
    { langcode: "lao", lang: "Lao" },
    { langcode: "lat", lang: "Latin" },
    { langcode: "lav", lang: "Latvian" },
    { langcode: "lit", lang: "Lithuanian" },
    { langcode: "mal", lang: "Malayalam" },
    { langcode: "mar", lang: "Marathi" },
    { langcode: "mkd", lang: "Macedonian" },
    { langcode: "mlt", lang: "Maltese" },
    { langcode: "msa", lang: "Malay" },
    { langcode: "mya", lang: "Burmese" },
    { langcode: "nep", lang: "Nepali" },
    { langcode: "nld", lang: "Dutch; Flemish" },
    { langcode: "nor", lang: "Norwegian" },
    { langcode: "ori", lang: "Oriya" },
    { langcode: "pan", lang: "Panjabi; Punjabi" },
    { langcode: "pol", lang: "Polish" },
    { langcode: "por", lang: "Portuguese" },
    { langcode: "pus", lang: "Pushto; Pashto" },
    { langcode: "ron", lang: "Romanian; Moldavian; Moldovan" },
    { langcode: "rus", lang: "Russian" },
    { langcode: "san", lang: "Sanskrit" },
    { langcode: "sin", lang: "Sinhala; Sinhalese" },
    { langcode: "slk", lang: "Slovak" },
    { langcode: "slv", lang: "Slovenian" },
    { langcode: "spa", lang: "Spanish; Castilian" },
    { langcode: "spa_old", lang: "Spanish; Castilian - Old" },
    { langcode: "sqi", lang: "Albanian" },
    { langcode: "srp", lang: "Serbian" },
    { langcode: "srp_latn", lang: "Serbian - Latin" },
    { langcode: "swa", lang: "Swahili" },
    { langcode: "swe", lang: "Swedish" },
    { langcode: "syr", lang: "Syriac" },
    { langcode: "tam", lang: "Tamil" },
    { langcode: "tel", lang: "Telugu" },
    { langcode: "tgk", lang: "Tajik" },
    { langcode: "tgl", lang: "Tagalog" },
    { langcode: "tha", lang: "Thai" },
    { langcode: "tir", lang: "Tigrinya" },
    { langcode: "tur", lang: "Turkish" },
    { langcode: "uig", lang: "Uighur; Uyghur" },
    { langcode: "ukr", lang: "Ukrainian" },
    { langcode: "urd", lang: "Urdu" },
    { langcode: "uzb", lang: "Uzbek" },
    { langcode: "uzb_cyrl", lang: "Uzbek - Cyrillic" },
    { langcode: "vie", lang: "Vietnamese" },
    { langcode: "yid", lang: "Yiddish" },
]

export const OCR_LANGUAGE_OPTIONS = OCR_LANGUAGE.map((item) => ({
    value: item.langcode,
    label: item.lang,
}));

// 预设不绑定快捷键，避免与浏览器等冲突；用户可在设置中自行定义
export const DEFAULT_PROMPT_OPTIONS = [
    { label: "翻译成中文", value: "请将以下文本翻译成中文，保持原文的语气和风格：\n", shortcut: "" },
    // { label: "语法检查与润色", value: "请检查并改进以下文本的语法、用词和表达，使其更清晰流畅：\n", shortcut: "" },
    // { label: "代码解释", value: "请详细解释以下代码的功能和逻辑，包括每个重要部分的作用：\n", shortcut: "" },
    // { label: "邮件回复", value: "请帮我写一封专业的邮件回复，语气礼貌得体：\n", shortcut: "" },
    // { label: "内容总结", value: "请对以下内容进行简洁的总结，提取关键信息：\n", shortcut: "" },
    // { label: "问题回答", value: "请详细准确地回答以下问题：\n", shortcut: "" },
    // { label: "创意写作", value: "请根据以下主题或材料创作创意内容：\n", shortcut: "" },
    // { label: "数据分析", value: "请分析以下数据并提供见解和建议：\n", shortcut: "" },
    // { label: "学习指导", value: "请为以下学习内容提供详细的学习指导和重点总结：\n", shortcut: "" },
]

export const DEFAULT_PROMPT_OPTIONS_VALUE = DEFAULT_PROMPT_OPTIONS[0].value;

export const TAG_COLORS = [
    "processing",
    "success",
    "error",
    "warning",
    "magenta",
    "red",
    "volcano",
    "orange",
    "gold",
    "lime",
    "green",
    "cyan",
    "blue",
    "geekblue",
    "purple",
]

// Colors for shortcut guide
export const SHORTCUT_COLORS = [
    "blue",
    "green",
    "orange",
    "purple",
    "red",
    "cyan",
    "magenta",
    "geekblue",
    "volcano",
    "gold",
    "lime",
    "processing",
    "success",
    "warning",
    "error",
];

export const RECENT_PROMPTS_KEY = "recentPrompts";
export const DEFAULT_ORC_LANG = [] //["eng", "chi_sim"];
export const DEFAULT_PROMPT = "帮我翻译成中文:\n";
export const ORC_LANG_KEY = "orcLang";
export const OPENAI_API_KEY_KEY = "openai_api_key";
export const PROMPT_LIST_KEY = "promptList";
export const DEFAULT_PROMPT_LIST = [];
export const SELECTED_PROMPT_KEY = "selectedPrompt";
export const SYSTEM_SHORTCUT_KEY = "systemShortcuts";
export const DEFAULT_SHORTCUT_LIST = [
    { label: "Open Window", value: "Open Window", shortcut: "" },
    { label: "ORC", value: "ORC", shortcut: "" },
];

export const HISTORY_LIST_KEY = "historyList";
export const DEFAULT_HISTORY_LIST = [];
export const CHAT_HISTORY_LIST_KEY = "chatHistoryList";
export const DEFAULT_CHAT_HISTORY_LIST = [];




export const IS_OPEN_RECENT_PROMPTS_KEY = 'isOpenRecentPrompts'
export const IS_OPEN_RECENT_PROMPTS_VALUE = 'open'

export const IS_SHOW_PROMPT_AREA_KEY = 'isShowPromptArea'
export const IS_SHOW_PROMPT_AREA_VALUE = true

export const HARDWARE_FINGERPRINT_KEY = 'hardwareFingerprint'

export const VALIDATION_MSGS = {
    NAME_REQUIRED: "Name is required.",
    PROMPT_CONTENT_REQUIRED: "Prompt content is required.",
    SHORTCUT_REQUIRED: "Shortcut is required.",
};

// Daily usage limit constants
export const DAILY_USAGE_COUNT_KEY = 'dailyUsageCount'
export const DAILY_USAGE_DATE_KEY = 'dailyUsageDate'
export const DEFAULT_DAILY_LIMIT = 50