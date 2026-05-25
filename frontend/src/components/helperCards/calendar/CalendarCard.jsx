import React from "react";
import ImgBuilder from "../../../assets/ImgBuilder";
import appStyles from "../../../app.module.css";
import styles from "../common/helperCards.module.css";
import { getHelperPayload } from "../common/helperUtils";

const CalendarCard = ({ msg }) => {
  const event = getHelperPayload(msg) || {};
  const isSuccess = event.status === "success";

  return (
    <div className={`${appStyles.messageRow} ${styles.helperRow}`}>

      <div className={`${styles.helperCard} ${styles.calendarCard}`}>
        <div className={styles.calendarIconWrapper}>
          <img alt="" src={ImgBuilder.calendar} className={styles.calendarIcon}/>
        </div>
        <p className={styles.helperLabel}>Calendar</p>
        <div className={styles.helperBody}>
          
          <p className={styles.helperTitle}>{isSuccess ? event.summary || "Event created" : "Calendar update"}</p>
          {event.location && <p className={styles.helperText}>{event.location}</p>}
          {event.timeZone && <p className={styles.helperText}>{event.timeZone}</p>}
          {event.eventLink && 
            <a className={styles.helperLink} href={event.eventLink} target="_blank" rel="noreferrer">Open event</a>
          }
        </div>
      </div>

    </div>
  );
};

export default CalendarCard;
