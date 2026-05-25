import React from "react";
import { createPortal } from "react-dom";
import ImgBuilder from "../../assets/ImgBuilder";
import styles from "./optionalityOverlay.module.css";

const options = [
  {
    name: "Suggestions",
    description: "Get quick tappable answers when AscendAI needs a preference or clarification.",
    icon: ImgBuilder.suggestion,
  },
  {
    name: "Hiking",
    description: "Find a trail match with distance, elevation, rating and a photo preview.",
    icon: ImgBuilder.hiking,
  },
  {
    name: "Weather",
    description: "Check destination weather with temperature, wind, humidity, UV and a city photo.",
    icon: ImgBuilder.weather,
  },
  {
    name: "Calendar",
    description: "Add a new calendar event. All we need from you is time.",
    icon: ImgBuilder.calendar,
  },
];

const OptionalityOverlay = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <button type="button" className={styles.closeButton} onClick={onClose}>Close</button>
      <div className={styles.panel} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>AscendAI</p>
            <p className={styles.title}>Optionality</p>
          </div>
        </div>

        <div className={styles.optionGrid}>
          {options.map((option) => (
            <div key={option.name} className={styles.optionCard}>
              <img alt="" src={option.icon} className={styles.optionIcon}/>
              <div>
                <p className={styles.optionName}>{option.name}</p>
                <p className={styles.optionDescription}>{option.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OptionalityOverlay;
