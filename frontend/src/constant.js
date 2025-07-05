export const RECENT_PROMPTS_KEY = "recentPrompts";
export const DEFAULT_ORC_LANG = [] //["eng", "chi_sim"];
export const DEFAULT_PROMPT = "帮我翻译成中文:\n";
export const ORC_LANG_KEY = "orcLang";
export const PROMPT_LIST_KEY = "promptList";
export const SELECTED_PROMPT_KEY = "selectedPrompt";
export const SYSTEM_SHORTCUT_KEY = "systemShortcuts";
export const DEFAULT_SHORTCUT_LIST = [
    {
        label: "Open Window",
        value: "Open Window",
        shortcut: "ctrl+shift+s",
    },
    {
        label: "ORC",
        value: "ORC",
        shortcut: "ctrl+shift+o",
    },

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

// Daily usage limit constants
export const DAILY_USAGE_COUNT_KEY = 'dailyUsageCount'
export const DAILY_USAGE_DATE_KEY = 'dailyUsageDate'
export const DEFAULT_DAILY_LIMIT = 50