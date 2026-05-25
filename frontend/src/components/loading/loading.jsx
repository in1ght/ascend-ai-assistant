import React from "react";
import styles from "./loading.module.css";
import ImgBuilder from "../../assets/ImgBuilder";

const Loading = () => {
  return (
    <div className={`${styles.messageRow} ${styles.left}`}>
      <img alt="" src={ImgBuilder.chatBotPic} className={styles.chatBotPic}/>
      <div className={styles.typingContainer}>
        <span className={styles.dot}></span>
        <span className={styles.dot}></span>
        <span className={styles.dot}></span>
        <span className={styles.dot}></span>
        <span className={styles.dot}></span>
      </div>
    </div>
  );
};

export default Loading;
