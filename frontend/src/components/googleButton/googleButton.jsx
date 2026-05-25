import React from "react";
import styles from "../../app.module.css";
import ImgBuilder from "../../assets/ImgBuilder";
import { useGoogleLogin } from "@react-oauth/google";
import axios from 'axios';
const API_BASE = `http://localhost:5000`;

const GoogleButton = ({setToken, setCalendarAccessToken}) => {
  const login = useGoogleLogin({
    flow: "auth-code",
    scope: "openid profile email https://www.googleapis.com/auth/calendar.app.created",
    onSuccess: async (res) => {
      try {
        const response = await axios.post(`${API_BASE}/message/login`, {
          code: res.code,
        });

        setToken(response.data.id_token);
        setCalendarAccessToken(response.data.access_token);
      } catch (err) {
        console.error("Login error", err);
      }
    },
    onError: () => console.log("Login failed"),
  });
  return (
    <button className={`${styles.iconOpenMessangerContainer} ${styles.whiteConButton}`} onClick={() => login()}>

      <img alt="" src={ImgBuilder.googleIamge} className={`${styles.iconOpenMessanger} ${styles.whiteConButtonImage}`}/>
      <div className={styles.whiteConButtonText}>
        Continue with Google.
      </div>
    </button>
  );
};

export default GoogleButton;

