import React from "react";
import ReactMarkdown from "react-markdown";
import appStyles from "../../../app.module.css";
import styles from "../common/helperCards.module.css";
import { getHelperPayload } from "../common/helperUtils";

const SuggestAnswers = ({ msg, onSelect }) => {
  const options = Array.isArray(getHelperPayload(msg)) ? getHelperPayload(msg) : [];

  if (!options.length) return null;

  return (
    <div className={`${appStyles.messageRow} ${styles.answerSuggestions}`}>
      {options.map((item, idx) => (
        <div key={idx} className={styles.answerSuggestionButton} onClick={() => onSelect(item)}>
          <ReactMarkdown>
            {item}
          </ReactMarkdown>
        </div>
      ))}
    </div>
  );
};

export default SuggestAnswers;
