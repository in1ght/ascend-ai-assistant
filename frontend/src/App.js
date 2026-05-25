import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import styles from './app.module.css'; 
import theme from "./theme/theme.module.css";
import ImgBuilder from "./assets/ImgBuilder";

import ReactMarkdown from "react-markdown";
import Loading from "./components/loading/loading";
import GoogleButton from "./components/googleButton/googleButton";
import HelperCard, { normalizeHelperMessage } from "./components/helperCards/helperCards";
import AccountHeader from "./components/account/AccountHeader";
import OptionalityOverlay from "./components/optionality/OptionalityOverlay";
import LoggedOutOverlay from "./components/authNotice/LoggedOutOverlay";
import ConfirmClearOverlay from "./components/confirmClear/ConfirmClearOverlay";

const API_BASE = `http://localhost:5000`;

const normalizeMessages = (items = []) => items
  .filter(Boolean)
  .map(normalizeHelperMessage);

const getClientTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (err) {
    return null;
  }
};

const welcomeOptions = [
  {
    name: "Suggestions",
    description: "Quick answer choices when AscendAI needs a preference.",
    icon: ImgBuilder.suggestion,
  },
  {
    name: "Weather",
    description: "Weather, wind, humidity and UV for a destination.",
    icon: ImgBuilder.weather,
  },
  {
    name: "Hiking",
    description: "Trail recommendations with key route details.",
    icon: ImgBuilder.hiking,
  },
  {
    name: "Calendar",
    description: "Add hiking plans when you provide the time.",
    icon: ImgBuilder.calendar,
  },
];

function App() {
  const textRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!textRef.current) return;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const offsetX = e.clientX - rect.left - centerX;
    const offsetY = e.clientY - rect.top - centerY;

    pos.current.x = lerp(pos.current.x, offsetX, 0.02);
    pos.current.y = lerp(pos.current.y, offsetY, 0.02);

    const moveX = pos.current.x * 0.02;
    const moveY = pos.current.y * 0.02;

    const rotateY = offsetX * 0.02;  // left/right tilt
    const rotateX = -offsetY * 0.02; // up/down tilt

    textRef.current.style.transform =
      `translate(${moveX}px, ${moveY}px) 
       rotateX(${rotateX}deg) 
       rotateY(${rotateY}deg)`;
  }

  const [messages, setMessages] = useState([]);
  const [messageUser, setMessageUser] = useState('');
  const [themeName] = useState("default");
  const [isWaiting, setIsWaiting] = useState(false);
  const chatEndRef = useRef(null);
  const preventDoubleApiCall = useRef(false);
  const [token, setTokenState] = useState(() => localStorage.getItem("mountlyn_id_token"));
  const [calendarAccessToken, setCalendarAccessTokenState] = useState(() => localStorage.getItem("mountlyn_calendar_access_token"));
  const [openMessanger, setOpenMessanger] = useState(false);
  const [isOptionalityOpen, setIsOptionalityOpen] = useState(false);
  const [isLoggedOutNoticeOpen, setIsLoggedOutNoticeOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const setToken = useCallback((nextToken) => {
    setTokenState(nextToken);
    if (nextToken) {
      localStorage.setItem("mountlyn_id_token", nextToken);
    } else {
      localStorage.removeItem("mountlyn_id_token");
    }
  }, []);

  const setCalendarAccessToken = useCallback((nextToken) => {
    setCalendarAccessTokenState(nextToken);
    if (nextToken) {
      localStorage.setItem("mountlyn_calendar_access_token", nextToken);
    } else {
      localStorage.removeItem("mountlyn_calendar_access_token");
    }
  }, []);

  const userProfile = useMemo(() => {
    if (!token) return null;

    try {
      return jwtDecode(token);
    } catch (err) {
      console.error("Could not decode user profile", err);
      return null;
    }
  }, [token]);

  const userInitials = useMemo(() => {
    const name = userProfile?.name || "";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U";
  }, [userProfile]);

  const fetchMessages = useCallback(async () => {
    if (!token){
      console.log("Not registered");
      return
    }
    try {
      const res = await axios.get(`${API_BASE}/message`, {headers: {
          Authorization: `Bearer ${token}`}
      });
      setMessages(normalizeMessages(res.data));
    } catch (err) {
      if (err.response?.status === 401) {
        setToken(null);
        setCalendarAccessToken(null);
        setIsLoggedOutNoticeOpen(true);
      }
      console.error("Could not fetch messages", err);
    }
  }, [token, setToken, setCalendarAccessToken]);

  const pushMessage = useCallback(async (content) => {
    if (preventDoubleApiCall.current || !token) return;
    try{
      setIsWaiting(true);
      setMessageUser('');
      setMessages(prev => [...prev, { id: Date.now(), content: content, speaker: 1 }]);
      preventDoubleApiCall.current = true
      const { data } = await axios.post(`${API_BASE}/message`, {
          speaker: 1,
          content: content
        },{
          headers: {
            Authorization: `Bearer ${token}`,
            ...(calendarAccessToken ? { "X-Calendar-Access-Token": calendarAccessToken } : {}),
            ...(getClientTimeZone() ? { "X-Client-Time-Zone": getClientTimeZone() } : {})
          }
        }
      );

      const newItems = data.items?.length
        ? data.items
        : [data.assistant, ...(data.helpers || []), data.suggestions].filter(Boolean);

      setMessages(prev => [...prev, ...normalizeMessages(newItems)]);
    } catch (err) {
      if (err.response?.status === 401) {
        setToken(null);
        setCalendarAccessToken(null);
        setIsLoggedOutNoticeOpen(true);
      }
      setMessageUser('ERROR');
    } finally {
      preventDoubleApiCall.current = false
      setIsWaiting(false)
    }
  }, [token, calendarAccessToken, setToken, setCalendarAccessToken]);

  const confirmClearCurrentChat = useCallback(async () => {
    if (!token) return;

    await axios.delete(`${API_BASE}/message`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setMessages([]);
    setIsClearConfirmOpen(false);
  }, [token]);

  const logout = useCallback(() => {
    setToken(null);
    setCalendarAccessToken(null);
    setMessages([]);
    setMessageUser("");
  }, [setToken, setCalendarAccessToken]);

  const handleSubmit = (e) => {
    e.preventDefault();
    pushMessage(messageUser);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    console.log(messages);
  }, [messages]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const renderHistory = {
    1: (msg, idx) => (
      <div key={msg.id} className={`${styles.messageRow} ${styles.right}`}>
        <div className={styles.message}>
          <ReactMarkdown>
            {msg.content}
          </ReactMarkdown>
        </div>
      </div>
    ),
    2: (msg, idx) => (
      <div key={msg.id} className={`${styles.messageRow} ${styles.left}`}>

        <img alt="" src={ImgBuilder.chatBotPic} className={styles.chatBotPic}/>
        <div className={styles.message}>
          <ReactMarkdown>
            {msg.content}
          </ReactMarkdown>
        </div>
      </div>
    ),
    3: (msg, idx) => <HelperCard key={msg.id || idx} msg={msg} onSuggestionSelect={pushMessage}/>,
    default: (msg, idx) => (
      <p key={idx} ><b>Error:</b> The type of message given is non-existent, the message is: {msg.content}</p>
    ),
  };

  return (
    <div className={`${theme[themeName]} ${styles.container}`}  onMouseMove={handleMouseMove}>

      <div className={styles.imageContainer}>
        <img alt="" src={ImgBuilder.mountain} className={`${styles.imageBG} ${styles.imageBGz1}`} decoding="async"/>
        <img alt="" src={ImgBuilder.mountainPNG} className={`${styles.imageBG} ${styles.imageBGz2}`} decoding="async"/>
        <p ref={textRef} className={styles.bgText}> AscendAI</p>
      </div>
      

      <div className={`${styles.screen} ${openMessanger ? styles.open : ""}`}> 

        {!token && messages.length < 1 &&
        <div className={styles.userPage}>
          <div className={styles.userPageTextCon}>
            <p className={`${styles.userPageTextGreetings} ${styles.userPageText}`}>
              Hi There!
            </p>
            <p className={`${styles.userPageTextSummary} ${styles.userPageText}`}>
              AscendAI can help with:
            </p>
            <div className={styles.userPageOptions}>
              {welcomeOptions.map((option) => (
                <div key={option.name} className={styles.userPageOptionCard}>
                  <img alt="" src={option.icon} className={styles.userPageOptionIcon}/>
                  <div>
                    <p className={styles.userPageOptionName}>{option.name}</p>
                    <p className={styles.userPageOptionDescription}>{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {!token && <GoogleButton setToken={setToken} setCalendarAccessToken={setCalendarAccessToken}/>}
          
        </div>
        }
        
        
        {token &&
          <AccountHeader
            userProfile={userProfile}
            userInitials={userInitials}
            onClearChat={() => setIsClearConfirmOpen(true)}
            onLogout={logout}
            onOpenOptionality={() => setIsOptionalityOpen(true)}
          />
        }

        <div className={styles.chatContainer}>
          <div className={styles.chatWrapper}>
            {messages.map((msg, idx) => (
              (renderHistory[msg.speaker] || renderHistory.default)(msg, idx)
            ))}
            {isWaiting && <Loading />}
            <div ref={chatEndRef} />
          </div>
        </div>
        <OptionalityOverlay isOpen={isOptionalityOpen} onClose={() => setIsOptionalityOpen(false)}/>
        <LoggedOutOverlay isOpen={isLoggedOutNoticeOpen} onClose={() => setIsLoggedOutNoticeOpen(false)}/>
        <ConfirmClearOverlay
          isOpen={isClearConfirmOpen}
          onCancel={() => setIsClearConfirmOpen(false)}
          onConfirm={confirmClearCurrentChat}
        />
        
        <div className={styles.inputContainer}>
          <form className={styles.inputBox} onSubmit={handleSubmit} >
            <input placeholder='Enter your request here' value={messageUser} onChange={(e) => setMessageUser(e.target.value)} className={styles.input} disabled={isWaiting || !token}/>
            <button className={`${styles.button} ${isWaiting ? styles.buttonDisabled : ''}`} disabled={isWaiting || !token}>
              <img alt="send" className={styles.send} src={ImgBuilder.sendImage}/>
            </button>
          </form>
        </div>
        

      </div>

      <footer className={styles.footer}>
        <div className={`${styles.iconOpenMessangerContainer} ${openMessanger ? styles.iconOpenMessangerContainerOpen : ''}`} onClick={() => setOpenMessanger(prev => !prev)}>
          <img alt="Open messenger" src={ImgBuilder.chatting} className={styles.iconOpenMessanger}/>
        </div>
      </footer>

    </div>
  );
}

export default App;
