
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