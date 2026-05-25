import React, { useState } from "react";
import { createPortal } from "react-dom";
import ImgBuilder from "../../../assets/ImgBuilder";
import styles from "./fullscreenImage.module.css";

const FullscreenImage = ({ imageUrl, alt }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!imageUrl) return null;

  return (
    <>
      <button
        type="button"
        className={styles.fullscreenButton}
        onClick={() => setIsOpen(true)}
        aria-label="Open image fullscreen"
      >
        <img alt="" src={ImgBuilder.fullScreen}/>
      </button>

      {isOpen && createPortal(
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => setIsOpen(false)}
            aria-label="Close fullscreen image"
          >
            Close
          </button>
          <img
            alt={alt || ""}
            src={imageUrl}
            className={styles.fullscreenImage}
            onClick={(event) => event.stopPropagation()}
          />
        </div>,
        document.body
      )}
    </>
  );
};

export default FullscreenImage;
