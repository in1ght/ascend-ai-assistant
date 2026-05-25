import React from "react";
import { createPortal } from "react-dom";
import styles from "./loggedOutOverlay.module.css";

const LoggedOutOverlay = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <p className={styles.title}>You are logged out</p>
        <p className={styles.text}>Your session expired. Sign in again to continue with AscendAI.</p>
        <button type="button" className={styles.button} onClick={onClose}>Ok</button>
      </div>
    </div>,
    document.body
  );
};

export default LoggedOutOverlay;
