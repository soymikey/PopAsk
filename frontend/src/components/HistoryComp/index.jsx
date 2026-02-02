import React from "react";
import {
  Card,
  Typography,
  Button,
  message,
  Empty,
  Tooltip,
  Input,
  Badge,
} from "antd";
import { ClearOutlined } from "@ant-design/icons";
import { useHistorySearch } from "./hooks/useHistorySearch";
import { useHistoryActions } from "./hooks/useHistoryActions";
import HistoryItem from "./HistoryItem";
import styles from "./index.module.css";

const { Title } = Typography;
const { Search } = Input;

function HistoryComp({ historyList, setHistoryList }) {
  const [messageApi, contextHolder] = message.useMessage();

  const { searchKeyword, setSearchKeyword, filteredHistory } =
    useHistorySearch(historyList);

  const { handleDeleteHistory, handleClearAll, handleCopyToClipboard } =
    useHistoryActions({
      historyList,
      setHistoryList,
      messageApi,
    });

  return (
    <div className={styles.historyCompRoot}>
      {contextHolder}

      <Card size="small" className={styles.historyCompCard}>
        <div className={styles.historyCompHeader}>
          <div className={styles.historyCompHeaderLeft}>
            <Title level={4} className={styles.historyCompTitle}>
              Chat History
            </Title>
            {historyList.length > 0 && (
              <Badge
                count={historyList.length}
                size="small"
                className={styles.historyCompBadge}
              />
            )}
          </div>
          <div className={styles.historyCompHeaderRight}>
            {historyList.length > 0 && (
              <Tooltip title="Clear all history">
                <Button
                  type="text"
                  danger
                  icon={<ClearOutlined />}
                  onClick={handleClearAll}
                  size="small"
                  className={styles.historyCompClearBtn}
                >
                  Clear All
                </Button>
              </Tooltip>
            )}
          </div>
        </div>

        <div className={styles.historyCompSearchWrap}>
          <Search
            placeholder="Search messages or responses..."
            allowClear
            className={styles.historyCompSearch}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onSearch={setSearchKeyword}
          />
        </div>

        {historyList.length === 0 ? (
          <Empty
            description={
              <div className={styles.historyCompEmptyDesc}>
                <div className={styles.historyCompEmptyDescTitle}>
                  No chat history yet
                </div>
                <div className={styles.historyCompEmptyDescSub}>
                  Start a conversation to see it here
                </div>
              </div>
            }
            className={styles.historyCompEmpty}
          />
        ) : filteredHistory.length === 0 ? (
          <Empty
            description={
              <div className={styles.historyCompEmptyDesc}>
                <div className={styles.historyCompEmptyDescTitle}>
                  No results found
                </div>
                <div className={styles.historyCompEmptyDescSub}>
                  Try a different search term
                </div>
              </div>
            }
            className={styles.historyCompEmpty}
          />
        ) : (
          <div className={styles.historyCompList}>
            {filteredHistory.map((item, i) => {
              const realIndex = historyList.indexOf(item);
              return (
                <div key={`${realIndex}-${i}-${item?.timestamp}`}>
                  <HistoryItem
                    item={item}
                    index={realIndex}
                    onDelete={handleDeleteHistory}
                    onCopy={handleCopyToClipboard}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

export default HistoryComp;
