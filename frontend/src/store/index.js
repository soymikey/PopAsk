import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import {
  PROMPT_LIST_KEY,
  SYSTEM_SHORTCUT_KEY,
  HISTORY_LIST_KEY,
  CHAT_HISTORY_LIST_KEY,
  SELECTED_PROMPT_KEY,
  OCR_LANG_KEY,
  OPENAI_API_KEY_KEY,
  RECENT_PROMPTS_KEY,
  IS_SHOW_PROMPT_AREA_KEY,
  IS_OPEN_RECENT_PROMPTS_KEY,
  DEFAULT_PROMPT_OPTIONS,
  DEFAULT_PROMPT_OPTIONS_VALUE,
  DEFAULT_SHORTCUT_LIST,
  DEFAULT_HISTORY_LIST,
  DEFAULT_CHAT_HISTORY_LIST,
  DEFAULT_OCR_LANG,
  IS_SHOW_PROMPT_AREA_VALUE,
  IS_OPEN_RECENT_PROMPTS_VALUE,
} from "../constant";

const SHOW_SHORTCUT_GUIDE_KEY = "showShortcutGuide";

const STORAGE_KEYS = {
  promptList: PROMPT_LIST_KEY,
  systemShortcuts: SYSTEM_SHORTCUT_KEY,
  historyList: HISTORY_LIST_KEY,
  chatHistoryList: CHAT_HISTORY_LIST_KEY,
  selectedPrompt: SELECTED_PROMPT_KEY,
  showShortcutGuide: SHOW_SHORTCUT_GUIDE_KEY,
  OCRLang: OCR_LANG_KEY,
  openAIKey: OPENAI_API_KEY_KEY,
  recentPrompts: RECENT_PROMPTS_KEY,
  showPromptArea: IS_SHOW_PROMPT_AREA_KEY,
  recentPromptsActiveKey: IS_OPEN_RECENT_PROMPTS_KEY,
};

const DEFAULT_PLATFORM = {
  isMac: false,
  isUserInChina: false,
  uniqueHardwareID: "",
};

const DEFAULT_STATE = {
  promptList: DEFAULT_PROMPT_OPTIONS,
  systemShortcuts: DEFAULT_SHORTCUT_LIST,
  historyList: DEFAULT_HISTORY_LIST,
  chatHistoryList: DEFAULT_CHAT_HISTORY_LIST,
  selectedPrompt: DEFAULT_PROMPT_OPTIONS_VALUE,
  showShortcutGuide: true,
  OCRLang: DEFAULT_OCR_LANG,
  openAIKey: "",
  recentPrompts: [],
  showPromptArea: IS_SHOW_PROMPT_AREA_VALUE,
  recentPromptsActiveKey: IS_OPEN_RECENT_PROMPTS_VALUE,
  platform: DEFAULT_PLATFORM,
};

// Zustand persist v5: getItem returns { state, version? }, setItem receives that object (not a string).
const multiKeyStorage = {
  getItem: () => {
    if (typeof window === "undefined") return null;
    const state = {};
    for (const [stateKey, storageKey] of Object.entries(STORAGE_KEYS)) {
      try {
        const raw = window.localStorage.getItem(storageKey);
        state[stateKey] = raw != null ? JSON.parse(raw) : DEFAULT_STATE[stateKey];
      } catch {
        state[stateKey] = DEFAULT_STATE[stateKey];
      }
    }
    return { state };
  },
  setItem: (_, value) => {
    if (typeof window === "undefined") return;
    const state = value?.state ?? value;
    if (!state || typeof state !== "object") return;
    for (const [stateKey, storageKey] of Object.entries(STORAGE_KEYS)) {
      if (stateKey in state) {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(state[stateKey]));
        } catch (e) {
          console.error(`store persist ${stateKey}:`, e);
        }
      }
    }
  },
  removeItem: () => {
    if (typeof window === "undefined") return;
    Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key));
  },
};

export const useAppStore = create(
  persist(
    immer((set) => {
      // Factory for setters that accept value or updater function (immer state)
      const createSetter = (key) => (fnOrValue) =>
        set((state) => {
          state[key] =
            typeof fnOrValue === "function" ? fnOrValue(state[key]) : fnOrValue;
        });

      return {
        ...DEFAULT_STATE,

        setPromptList: createSetter("promptList"),
        setSystemShortcuts: createSetter("systemShortcuts"),
        setHistoryList: createSetter("historyList"),
        setChatHistoryList: createSetter("chatHistoryList"),
        setSelectedPrompt: createSetter("selectedPrompt"),
        setShowShortcutGuide: createSetter("showShortcutGuide"),
        setOCRLang: createSetter("OCRLang"),
        setOpenAIKey: createSetter("openAIKey"),
        setRecentPrompts: createSetter("recentPrompts"),
        setShowPromptArea: createSetter("showPromptArea"),
        setRecentPromptsActiveKey: createSetter("recentPromptsActiveKey"),
        setPlatform: (partial) =>
          set((state) => {
            if (partial && typeof partial === "object" && !Array.isArray(partial)) {
              state.platform = { ...state.platform, ...partial };
            }
          }),
      };
    }),
    {
      name: "popask-store",
      storage: multiKeyStorage,
      partialize: (state) => ({
        promptList: state.promptList,
        systemShortcuts: state.systemShortcuts,
        historyList: state.historyList,
        chatHistoryList: state.chatHistoryList,
        selectedPrompt: state.selectedPrompt,
        showShortcutGuide: state.showShortcutGuide,
        OCRLang: state.OCRLang,
        openAIKey: state.openAIKey,
        recentPrompts: state.recentPrompts,
        showPromptArea: state.showPromptArea,
        recentPromptsActiveKey: state.recentPromptsActiveKey,
        // platform is not persisted (runtime only)
      }),
    }
  )
);
