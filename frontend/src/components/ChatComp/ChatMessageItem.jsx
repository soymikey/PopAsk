import { Button, Input, Typography, Avatar } from "antd";
import {
  UserOutlined,
  RobotOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { MarkDownComp } from "../MarkDownComp";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import styles from "./index.module.css";

dayjs.extend(relativeTime);

const { TextArea } = Input;
const { Text } = Typography;

export default function ChatMessageItem({
  message,
  isEditing,
  editingContent,
  onEditingContentChange,
  onSaveEdit,
  onCancelEdit,
  onEditMessage,
  onRegenerateResponse,
}) {
  const isUser = message.type === "user";

  return (
    <div
      className={`${styles.chatMessage} ${isUser ? styles.chatMessageUser : styles.chatMessageAssistant}`}
    >
      <div className={styles.messageRow}>
        {!isUser && (
          <Avatar
            icon={<RobotOutlined />}
            className={`${styles.messageAvatar} ${styles.messageAvatarAssistant}`}
            size="small"
          />
        )}
        <div
          className={`${styles.messageContainer} ${isUser ? styles.messageBubbleUser : styles.messageBubbleAssistant}`}
        >
          <div className={styles.messageTimestampWrap}>
            <Text
              className={`${styles.messageTimestamp} ${isUser ? styles.messageTimestampUser : styles.messageTimestampAssistant}`}
            >
              {dayjs(message.timestamp).fromNow()}
            </Text>
          </div>

          {isEditing ? (
            <div className={styles.messageEditArea}>
              <TextArea
                value={editingContent}
                onChange={(e) => onEditingContentChange(e.target.value)}
                autoSize={{ minRows: 2, maxRows: 8 }}
                className={styles.messageEditTextarea}
                placeholder="Edit your message here..."
                onPressEnter={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    onSaveEdit();
                  }
                }}
              />
              <div className={styles.messageEditActions}>
                <Button
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={onCancelEdit}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={onSaveEdit}
                >
                  Save & Send
                </Button>
              </div>
            </div>
          ) : (
            <>
              {isUser ? (
                <div className={styles.messageContentPre}>{message.content}</div>
              ) : (
                <MarkDownComp>{message.content}</MarkDownComp>
              )}

              <div className={styles.messageActions}>
                {isUser && (
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => onEditMessage(message.id, message.content)}
                    className={styles.messageActionBtn}
                  />
                )}
                {!isUser && (
                  <Button
                    type="text"
                    size="small"
                    icon={<SendOutlined />}
                    onClick={() => onRegenerateResponse(message.id)}
                    className={styles.messageActionBtn}
                    title="Regenerate response"
                  />
                )}
              </div>
            </>
          )}
        </div>
        {isUser && (
          <Avatar
            icon={<UserOutlined />}
            size="small"
            className={`${styles.messageAvatar} ${styles.messageAvatarUser}`}
          />
        )}
      </div>
    </div>
  );
}
