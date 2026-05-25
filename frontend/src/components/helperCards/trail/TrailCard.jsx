import React from "react";
import ImgBuilder from "../../../assets/ImgBuilder";
import appStyles from "../../../app.module.css";
import styles from "../common/helperCards.module.css";
import { getHelperPayload } from "../common/helperUtils";
import FullscreenImage from "../common/FullscreenImage";

const PhotoCredit = ({ photo }) => {
  if (!photo?.photographer) return null;

  return (
    <p className={styles.photoCredit}>
      Photo by{" "}
      <a href={photo.photographerUrl} target="_blank" rel="noreferrer">
        {photo.photographer}
      </a>
    </p>
  );
};

const TrailCard = ({ msg }) => {
  const payload = getHelperPayload(msg);
  const trail = Array.isArray(payload) ? payload[0] : payload;

  if (!trail || typeof trail !== "object") return null;

  const imageUrl = trail.photo?.url || ImgBuilder.mountain;

  return (
    <div className={` ${styles.helperRow}`}>
      <div className={`${styles.helperCard} ${styles.photoCard} ${styles.trailCard}`}>
        <div className={styles.helperPhoto}>
          <img alt={trail.photo?.alt || ""} src={imageUrl} className={styles.helperPhotoImage}/>
          <FullscreenImage imageUrl={imageUrl} alt={trail.photo?.alt}/>
        </div>
        <div className={styles.helperBody}>
          <p className={styles.helperLabel}>Trail match</p>
          <p className={styles.helperTitle}>{trail.name || "Recommended trail"}</p>
          {trail.location && <p className={styles.helperText}>{trail.location}</p>}
          <div className={styles.helperStats}>
            {trail.length != null && <span>{Number(trail.length).toFixed(1)} km</span>}
            {trail.elevation != null && <span>{Math.round(Number(trail.elevation))} m climb</span>}
            {trail.rating != null && <span>{Number(trail.rating).toFixed(1)} rating</span>}
            {trail.route_type && <span>{trail.route_type}</span>}
          </div>
          <PhotoCredit photo={trail.photo}/>
        </div>
      </div>
    </div>
  );
};

export default TrailCard;
