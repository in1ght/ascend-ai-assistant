import React from "react";
import { createPortal } from "react-dom";
import styles from "./confirmClearOverlay.module.css";

const ConfirmClearOverlay = ({ isOpen, onCancel, onConfirm }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.panel} onClick={(event) => event.stopPropagation()}>
        <p className={styles.title}>Are you sure you want to delete everything?</p>
        <p className={styles.text}>This clears the current chat history for your account.</p>
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={styles.primaryButton} onClick={onConfirm}>
            I am sure
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmClearOverlay;
