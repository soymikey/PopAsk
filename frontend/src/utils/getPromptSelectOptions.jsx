import React from "react";
import { Tag } from "antd";

/**
 * Returns Ant Design Select options for prompt list.
 * @param {Array} promptList - list of { value, label, shortcut?, ... }
 * @param {Object} opts - { formatShortcut?: (item) => string, renderExtra?: (item, items) => ReactNode }
 */
export function getPromptSelectOptions(promptList, opts = {}) {
  const { formatShortcut = (item) => item?.shortcut, renderExtra = null } = opts;
  return (promptList || []).map((item) => ({
    label: (
      <div key={item.value} className="prompt-select-option" title={item.value}>
        <div className="prompt-select-option-content">
          <div className="prompt-select-option-label">{item.label}</div>
          <div className="prompt-select-option-value">{item.value}</div>
          {item?.shortcut && (
            <Tag size="small" color="blue">
              {typeof formatShortcut === "function"
                ? formatShortcut(item?.shortcut)
                : item?.shortcut}
            </Tag>
          )}
        </div>
        {renderExtra?.(item, promptList)}
      </div>
    ),
    value: item.value,
    name: item.value,
  }));
}
