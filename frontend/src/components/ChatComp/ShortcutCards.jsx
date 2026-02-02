import { Card, Tag, Typography } from "antd";
import { TAG_COLORS } from "../../constant";
import { formatShortcutDisplay } from "../../utils";
import styles from "./ShortcutCards.module.css";

const { Text } = Typography;

export default function ShortcutCards({ systemShortcuts, promptList }) {
  const shortcuts = [...(systemShortcuts || []), ...(promptList || [])].filter(
    (s) => s?.label && s?.value,
  );

  return (
    <div>
      <div className={styles.shortcutCardsHeader}>
        <Text className={styles.shortcutCardsHeaderText}>
          Shortcuts reference
        </Text>
      </div>
      <div className={styles.shortcutCardsGrid}>
        {shortcuts.map((shortcut, index) => (
          <Card
            key={shortcut.key || shortcut.value}
            size="small"
            className={styles.shortcutCardsCard}
          >
            <div className={`${styles.shortcutCardsRow} flex-between`}>
              <div className={styles.shortcutCardsLabel}>{shortcut.label}</div>
              {shortcut.shortcut ? (
                <Tag
                  color={TAG_COLORS[index % TAG_COLORS.length]}
                  className={styles.shortcutCardsTag}
                >
                  {formatShortcutDisplay(shortcut.shortcut)}
                </Tag>
              ) : (
                <Tag className={`${styles.shortcutCardsTag} ${styles.shortcutCardsTagEmpty}`}>
                  Set in Settings
                </Tag>
              )}
            </div>
          </Card>
        ))}
      </div>
      <div className={styles.shortcutCardsFooter}>
        <Text className={styles.shortcutCardsFooterText}>
          Start a conversation by typing a message below...
        </Text>
      </div>
    </div>
  );
}
