import { ErrorBoundary } from "react-error-boundary";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./index.module.css";
const markdown = `A paragraph with *emphasis* and **strong importance**.

> A block quote with ~strikethrough~ and a URL: https://reactjs.org.

* Lists
* [ ] todo
* [x] done

A table:

| a | b |
| - | - |
`;
export function MarkDownComp({ children }) {
  return (
    <ErrorBoundary
      fallback={<div className={styles.whitespacePreWrap}>{children}</div>}
    >
      <div className={styles.markdownContent}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
      </div>
    </ErrorBoundary>
  );
}
