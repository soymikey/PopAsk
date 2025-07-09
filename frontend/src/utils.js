import { IsMac, GetUniqueHardwareID } from "../wailsjs/go/main/App";

export const initEnv = async () => {
    return {
        isMac: await IsMac(),
        uniqueHardwareID: await GetUniqueHardwareID(),

    }

};

export const messageGenerator = (prompt, text) => {
    return `${prompt}${text}`;
};



export const newPromptGenerator = (title, text) => {
    if (title.trim().length === 0) {
        return null;
    }
    if (text.trim().length === 0) {
        return {
            label: `${title}`,
            value: `${title}\n`,
            shortcut: "",
        };;
    }
    return {
        label: `${title}`,
        value: `${text}\n`,
        shortcut: "",
    };
};

export const languageFormate = (text) => {
    if (text.length === 0) {
        return text;
    }
    // 去除中文,日文,韩文之间的空格
    const formatResult = text.replace(
        /(?<=[\u4e00-\u9fa5\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF])\s+(?=[\u4e00-\u9fa5\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF])/g,
        ""
    );

    return formatResult;
};

export const getLocalStorage = (key, defaultValue) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        return DEFAULT_ORC_LANG;
    }
};

export const historyGenerator = (message, response) => {
    return {
        message: message,
        response: response,
        timestamp: new Date().toLocaleString(),
    };
};



export const userMessageGenerator = (message) => {
    const timestamp = Date.now();
    return {
        id: timestamp,
        type: "user",
        content: message,
        timestamp: timestamp,
    };
};

export const assistantMessageGenerator = (message) => {
    const timestamp = Date.now();
    return {
        id: timestamp,
        type: "assistant",
        content: message,
        timestamp: timestamp,
    };
};

// Daily usage management functions
export const getDailyUsageCount = () => {
    try {
        const today = new Date().toDateString();
        const storedDate = localStorage.getItem('dailyUsageDate');
        const storedCount = localStorage.getItem('dailyUsageCount');

        // Reset count if it's a new day
        if (storedDate !== today) {
            localStorage.setItem('dailyUsageDate', today);
            localStorage.setItem('dailyUsageCount', '0');
            return 0;
        }

        return parseInt(storedCount || '0', 10);
    } catch (error) {
        console.error('Error getting daily usage count:', error);
        return 0;
    }
};

export const incrementDailyUsageCount = () => {
    try {
        const currentCount = getDailyUsageCount();
        const newCount = currentCount + 1;
        localStorage.setItem('dailyUsageCount', newCount.toString());
        return newCount;
    } catch (error) {
        console.error('Error incrementing daily usage count:', error);
        return 0;
    }
};

export const checkDailyUsageLimit = (limit = 5) => {
    const currentCount = getDailyUsageCount();
    return {
        canUse: currentCount < limit,
        remaining: Math.max(0, limit - currentCount),
        used: currentCount,
        limit: limit
    };
};

export const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};