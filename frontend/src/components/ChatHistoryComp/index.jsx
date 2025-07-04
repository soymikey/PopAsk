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
import { MarkDownComp } from "../MarkDownComp";
import "./index.css";

const { Text, Title } = Typography;
const { Panel } = Collapse;

const ChatHistoryComp = ({
  chatHistoryList,
  setChatHistoryList,
  setActiveKey,
  setChatMessages,
}) => {
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
        style={{
          display: "flex",
          marginBottom: "12px",
          justifyContent: isUser ? "flex-end" : "flex-start",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            maxWidth: "80%",
            gap: "6px",
          }}
        >
          {!isUser && (
            <Avatar
              icon={<RobotOutlined />}
              style={{
                backgroundColor: "#1890ff",
                marginTop: "2px",
                flexShrink: 0,
                minWidth: "20px",
                minHeight: "20px",
              }}
              size="small"
            />
          )}
          <div
            style={{
              backgroundColor: isUser ? "#1890ff" : "#f5f5f5",
              color: isUser ? "white" : "black",
              padding: "8px 12px",
              borderRadius: "8px",
              maxWidth: "100%",
              wordWrap: "break-word",
              fontSize: "13px",
            }}
          >
            <div style={{ marginBottom: "2px" }}>
              <Text
                style={{
                  fontSize: "10px",
                  color: isUser ? "rgba(255,255,255,0.8)" : "#999",
                }}
              >
                {message.timestamp}
              </Text>
            </div>
            {isUser ? (
              <div style={{ whiteSpace: "pre-wrap" }}>
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
              style={{ backgroundColor: "#52c41a", marginTop: "2px" }}
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

    return (
      <Card
        key={index}
        size="small"
        style={{
          marginBottom: "12px",
          cursor: "pointer",
          transition: "all 0.2s",
          border: "1px solid #f0f0f0",
        }}
        className="history-card"
        onClick={() => handleHistoryClick(index)}
        hoverable
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <MessageOutlined style={{ color: "#1890ff" }} />
              <Text strong style={{ fontSize: "14px" }}>
                Chat #{index + 1}
              </Text>
              <Tag size="small" color="blue">
                {history.length} messages
              </Tag>
            </div>

            <div style={{ marginBottom: "8px" }}>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                <ClockCircleOutlined style={{ marginRight: "4px" }} />
                {lastMessage?.timestamp}
              </Text>
            </div>

            <div style={{ marginBottom: "8px" }}>
              <Text style={{ fontSize: "13px", color: "#666" }}>
                {firstUserMessage?.content?.length > 80
                  ? `${firstUserMessage.content.substring(0, 80)}...`
                  : firstUserMessage?.content || "Empty chat"}
              </Text>
            </div>

            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              <Tag size="small" color="green">
                {userMessages.length} user
              </Tag>
              <Tag size="small" color="blue">
                {assistantMessages.length} assistant
              </Tag>
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
                style={{ padding: "4px" }}
              />
            </Tooltip>
          </Space>
        </div>

        <Collapse
          ghost
          style={{ marginTop: "12px" }}
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
              <Text style={{ fontSize: "12px", color: "#1890ff" }}>
                {expandedKeys.includes(index.toString())
                  ? "Hide messages"
                  : "Show messages"}
              </Text>
            }
            key={index.toString()}
            style={{ padding: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                backgroundColor: "#fafafa",
                borderRadius: "6px",
                padding: "12px",
                maxHeight: "300px",
                overflowY: "auto",
                border: "1px solid #f0f0f0",
              }}
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
    <div
      style={{
        height: "calc(100vh - 46px)",
        display: "flex",
        flexDirection: "column",
        paddingTop: "12px",
        paddingBottom: "12px",
        gap: "8px",
      }}
    >
      <Card
        size="small"
        title={
          <Title
            level={4}
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <MessageOutlined />
            Chat History
          </Title>
        }
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
        bodyStyle={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "12px",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px",
          }}
        >
          {/* Search Bar */}
          <div style={{ marginBottom: "16px", padding: "0 8px" }}>
            <Input
              placeholder="Search in chat history..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ borderRadius: "6px" }}
            />
          </div>

          {filteredChatHistory.length === 0 ? (
            <Empty
              description={
                <div style={{ textAlign: "center" }}>
                  <Text type="secondary">
                    {chatHistoryList.length === 0
                      ? "No chat history yet"
                      : "No matching chat history found"}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    {chatHistoryList.length === 0
                      ? "Start a conversation in the Chat tab to see history here"
                      : "Try adjusting your search terms"}
                  </Text>
                </div>
              }
              style={{ marginTop: "60px" }}
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
