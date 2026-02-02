import { Card, Tag, Typography } from "antd";
import { TAG_COLORS } from "../../constant";

const { Text } = Typography;

export function formatShortcutDisplay(str) {
  if (!str || typeof str !== "string") return str;
  return str
    .replace(/\bcmd\b/gi, "⌘")
    .replace(/\bshift\b/gi, "Shift")
    .replace(/\bctrl\b/gi, "Ctrl");
}

export default function ShortcutCards({ systemShortcuts, promptList }) {
  const shortcuts = [...(systemShortcuts || []), ...(promptList || [])].filter(
    (s) => s?.label && s?.value
  );

  return (
    <div>
      <div style={{ opacity: 0.6, textAlign: "center" }}>
        <Text style={{ color: "#999", fontSize: "14px" }}>
          Shortcuts reference
        </Text>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          padding: "20px 20px",
          textAlign: "center",
          overflow: "auto",
          gap: "4px",
        }}
      >
        {shortcuts.map((shortcut, index) => (
          <Card
            key={shortcut.key || shortcut.value}
            size="small"
            style={{
              border: "1px solid #f0f0f0",
              borderRadius: "8px",
              transition: "all 0.3s ease",
              width: "100%",
              backgroundColor: "transparent",
            }}
            bodyStyle={{
              display: "flex",
              flexDirection: "column",
              padding: "6px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1, fontSize: "12px", color: "#666" }}>
                {shortcut.label}
              </div>
              {shortcut.shortcut ? (
                <Tag
                  color={TAG_COLORS[index % TAG_COLORS.length]}
                  style={{ fontSize: "12px", borderRadius: "4px", flexShrink: 0 }}
                >
                  {formatShortcutDisplay(shortcut.shortcut)}
                </Tag>
              ) : (
                <Tag
                  style={{ fontSize: "12px", flexShrink: 0, color: "#999" }}
                >
                  Set in Settings
                </Tag>
              )}
            </div>
          </Card>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: "16px" }}>
        <Text style={{ fontSize: "14px" }}>
          Start a conversation by typing a message below...
        </Text>
      </div>
    </div>
  );
}
