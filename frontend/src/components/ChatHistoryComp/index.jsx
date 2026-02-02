import {
  Card,
  Typography,
  List,
  Avatar,
  Button,
  Space,
  Empty,
  Collapse,
  Tag,
  Tooltip,
  Input,
} from "antd";
import {
  UserOutlined,
  RobotOutlined,
  MessageOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useState, useMemo } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { MarkDownComp } from "../MarkDownComp";
import { useAppStore } from "../../store";
import styles from "./index.module.css";
dayjs.extend(relativeTime);

const { Text, Title } = Typography;
const { Panel } = Collapse;

const ChatHistoryComp = ({ setActiveKey, setChatMessages }) => {
  const chatHistoryList = useAppStore((s) => s.chatHistoryList);
  const setChatHistoryList = useAppStore((s) => s.setChatHistoryList);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [searchText, setSearchText] = useState("");

  const handleHistoryClick = (historyIndex) => {
    const chatMessages = chatHistoryList[historyIndex];
    setChatMessages(chatMessages);
    setActiveKey("chat");
  };

  const handleDeleteHistory = (historyIndex, e) => {
    e.stopPropagation();
    const newHistoryList = chatHistoryList.filter(
      (_, index) => index !== historyIndex
    );
    setChatHistoryList(newHistoryList);
  };

  // Filter chat history based on search text
  const filteredChatHistory = useMemo(() => {
    if (!searchText.trim()) {
      return chatHistoryList;
    }

    const searchLower = searchText.toLowerCase();
    return chatHistoryList.filter((history, index) => {
      // Search in chat number
      if (`chat #${index + 1}`.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search in all messages
      return history.some((message) => {
        // Search in message content
        if (message.content.toLowerCase().includes(searchLower)) {
          return true;
        }
        // Search in timestamp
        if (message.timestamp.toLowerCase().includes(searchLower)) {
          return true;
        }
        // Search in message type
        if (message.type.toLowerCase().includes(searchLower)) {
          return true;
        }
        return false;
      });
    });
  }, [chatHistoryList, searchText]);

  const renderMessage = (message) => {
    const isUser = message.type === "user";
    return (
      <div
        key={message.id}
        className={`${styles.msgRow} ${isUser ? styles.msgRowUser : styles.msgRowAssistant}`}
      >
        <div className={styles.msgInner}>
          {!isUser && (
            <Avatar
              icon={<RobotOutlined />}
              className={`${styles.msgAvatar} ${styles.msgAvatarAssistant}`}
              size="small"
            />
          )}
          <div
            className={`${styles.msgBubble} ${isUser ? styles.msgBubbleUser : styles.msgBubbleAssistant}`}
          >
            <div className={styles.msgTimestamp}>
              <Text
                className={`${styles.msgTimestampText} ${isUser ? styles.msgTimestampUser : styles.msgTimestampAssistant}`}
              >
                {message.timestamp}
              </Text>
            </div>
            {isUser ? (
              <div className={styles.msgContentPre}>
                {message.content.length > 100
                  ? `${message.content.substring(0, 100)}...`
                  : message.content}
              </div>
            ) : (
              <MarkDownComp>
                {message.content.length > 150
                  ? `${message.content.substring(0, 150)}...`
                  : message.content}
              </MarkDownComp>
            )}
          </div>
          {isUser && (
            <Avatar
              icon={<UserOutlined />}
              className={`${styles.msgAvatar} ${styles.msgAvatarUser}`}
              size="small"
            />
          )}
        </div>
      </div>
    );
  };

  const renderHistoryItem = (history, index) => {
    const userMessages = history.filter((msg) => msg.type === "user");
    const assistantMessages = history.filter((msg) => msg.type === "assistant");
    const firstUserMessage = userMessages[0];
    const lastMessage = history[history.length - 1];

    const formatTime = (timestamp) => {
      return dayjs(timestamp).fromNow();
    };

    return (
      <Card
        key={index}
        size="small"
        className={styles.historyCard}
        onClick={() => handleHistoryClick(index)}
        hoverable
      >
        <div className={styles.historyCardHeader}>
          <div className={styles.historyCardContent}>
            <div className={styles.historyCardHeaderRow}>
              <MessageOutlined className={styles.historyCardIcon} />
              <Text strong className={styles.historyCardTitle}>
                Chat #{index + 1}
              </Text>
              <Tag size="small" color="blue">
                {history.length} messages
              </Tag>
            </div>

            <div className={styles.historyCardTime}>
              <Text type="secondary" className={styles.historyCardTimeText}>
                <ClockCircleOutlined className={styles.historyCardTimeIcon} />
                {formatTime(lastMessage?.timestamp)}
              </Text>
            </div>

            <div className={styles.historyCardPreview}>
              <Text className={styles.historyCardPreviewText}>
                {firstUserMessage?.content?.length > 80
                  ? `${firstUserMessage.content.substring(0, 80)}...`
                  : firstUserMessage?.content || "Empty chat"}
              </Text>
            </div>
          </div>

          <Space direction="vertical" size="small">
            <Tooltip title="Delete this chat history">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                danger
                onClick={(e) => handleDeleteHistory(index, e)}
                className={styles.historyCardDeleteBtn}
              />
            </Tooltip>
          </Space>
        </div>

        <Collapse
          ghost
          className={styles.historyCardCollapse}
          onChange={(keys) => {
            if (keys.includes(index.toString())) {
              setExpandedKeys([...expandedKeys, index.toString()]);
            } else {
              setExpandedKeys(
                expandedKeys.filter((key) => key !== index.toString())
              );
            }
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Panel
            header={
              <Text className={styles.historyCardLink}>
                {expandedKeys.includes(index.toString())
                  ? "Hide messages"
                  : "Show messages"}
              </Text>
            }
            key={index.toString()}
            className={styles.historyCardPanel}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={styles.historyCardMessages}
              onClick={(e) => e.stopPropagation()}
            >
              {history.map(renderMessage)}
            </div>
          </Panel>
        </Collapse>
      </Card>
    );
  };

  return (
    <div className={styles.root}>
      <Card
        size="small"
        className={styles.card}
        title={
          <Title level={4} className={styles.cardTitle}>
            <MessageOutlined />
            Chat History
          </Title>
        }
      >
        <div className={styles.cardInner}>
          {/* Search Bar */}
          <div className={styles.searchWrap}>
            <Input
              placeholder="Search in chat history..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              className={styles.searchInput}
            />
          </div>

          {filteredChatHistory.length === 0 ? (
            <Empty
              description={
                <div className={styles.emptyWrap}>
                  <Text type="secondary">
                    {chatHistoryList.length === 0
                      ? "No chat history yet"
                      : "No matching chat history found"}
                  </Text>
                  <br />
                  <Text type="secondary" className={styles.emptyText}>
                    {chatHistoryList.length === 0
                      ? "Start a conversation in the Chat tab to see history here"
                      : "Try adjusting your search terms"}
                  </Text>
                </div>
              }
              className={styles.emptyRoot}
            />
          ) : (
            <div>
              {filteredChatHistory.map((history, index) => {
                // Find the original index in chatHistoryList
                const originalIndex = chatHistoryList.findIndex(
                  (h) => h === history
                );
                return renderHistoryItem(history, originalIndex);
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ChatHistoryComp;
