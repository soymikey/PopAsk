
export const messageGenerator = (prompt, text) => {
    return `${prompt}
    ${text}`;
};

export const newPromptGenerator = (text) => {
    if (text.length === 0) {
        return text;
    }
    return {
        label: `${text}\n`,
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
