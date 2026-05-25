import React from "react";
import ImgBuilder from "../../../assets/ImgBuilder";
import appStyles from "../../../app.module.css";
import styles from "../common/helperCards.module.css";
import { getHelperPayload, weatherIconUrl } from "../common/helperUtils";
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

const WeatherCard = ({ msg }) => {
  const weather = getHelperPayload(msg) || {};
  const photo = weather.photo;
  const imageUrl = photo?.url || ImgBuilder.fields;
  const temperature = weather.temperature ?? weather.average_temperature;
  const highLow = weather.max_temperature != null && weather.min_temperature != null
    ? `${Math.round(weather.min_temperature)}-${Math.round(weather.max_temperature)} C`
    : null;
  const wind = weather.wind_kph ?? weather.max_wind;
  const humidity = weather.humidity ?? weather.average_humidity;

  return (
    <div className={`${appStyles.messageRow} ${styles.helperRow}`}>
      <div className={`${styles.helperCard} ${styles.photoCard}`}>
        <div className={styles.helperPhoto}>
          <img alt={photo?.alt || ""} src={imageUrl} className={styles.helperPhotoImage}/>
          <FullscreenImage imageUrl={imageUrl} alt={photo?.alt}/>
          {weatherIconUrl(weather.icon) && <img alt="" src={weatherIconUrl(weather.icon)} className={styles.weatherIcon}/>}
        </div>
        <div className={styles.helperBody}>
          <p className={styles.helperLabel}>{weather.city || (weather.type === "current" ? "Current weather" : "Weather forecast")}</p>
          <p className={styles.weatherTemp}>{temperature != null ? `${Math.round(temperature)} C` : highLow}</p>
          <p className={styles.helperTitle}>{weather.condition || "Weather update"}</p>
          <div className={styles.helperStats}>
            {wind != null && <span>Wind {Math.round(wind)} kph</span>}
            {humidity != null && <span>Humidity {Math.round(humidity)}%</span>}
            {weather.uv != null && <span>UV {weather.uv}</span>}
          </div>
          <PhotoCredit photo={photo}/>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
