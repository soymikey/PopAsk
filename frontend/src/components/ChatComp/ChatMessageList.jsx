import { Avatar, Spin, Typography } from "antd";
import { RobotOutlined } from "@ant-design/icons";
import ChatMessageItem from "./ChatMessageItem";
import styles from "./index.module.css";

const { Text } = Typography;

export default function ChatMessageList({
  messages,
  editingMessageId,
  editingContent,
  setEditingContent,
  onSaveEdit,
  onCancelEdit,
  onEditMessage,
  onRegenerateResponse,
  isAskLoading,
  messagesEndRef,
}) {
  return (
    <div>
      {messages.map((message) => (
        <ChatMessageItem
          key={message.id}
          message={message}
          isEditing={editingMessageId === message.id}
          editingContent={editingContent}
          onEditingContentChange={setEditingContent}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onEditMessage={onEditMessage}
          onRegenerateResponse={onRegenerateResponse}
        />
      ))}
      {isAskLoading && (
        <div className={styles.typingRow}>
          <div className={styles.typingInner}>
            <Avatar
              icon={<RobotOutlined />}
              className={styles.typingAvatar}
              size="small"
            />
            <div className={styles.typingBubble}>
              <Spin size="small" />
              <Text>Thinking...</Text>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
