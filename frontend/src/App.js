import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from './app.module.css'; 
import theme from "./theme/theme.module.css";
import ImgBuilder from "./assets/ImgBuilder";

import ReactMarkdown from "react-markdown";
import Loading from "./components/loading/loading";
import GoogleButton from "./components/googleButton/googleButton";
// import { GoogleLogin } from "@react-oauth/google";
// import { googleLogout } from '@react-oauth/google'; // googleLogout();

const API_BASE = `http://localhost:5000`;

function App() {
  // sssssssssssssssssssssssssssssssssssssssss
  const textRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();

    // 🎯 center-based anchor
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const offsetX = e.clientX - rect.left - centerX;
    const offsetY = e.clientY - rect.top - centerY;

    // 🧊 ultra soft follow (even less extreme than before)
    pos.current.x = lerp(pos.current.x, offsetX, 0.02);
    pos.current.y = lerp(pos.current.y, offsetY, 0.02);

    // 🪶 very small movement
    const moveX = pos.current.x * 0.02;
    const moveY = pos.current.y * 0.02;

    // 🔄 subtle rotation (tiny angle only)
    const rotateY = offsetX * 0.02;  // left/right tilt
    const rotateX = -offsetY * 0.02; // up/down tilt

    textRef.current.style.transform =
      `translate(${moveX}px, ${moveY}px) 
       rotateX(${rotateX}deg) 
       rotateY(${rotateY}deg)`;
  }

  //sss ssssssssssssssssssssssssssssssssssssssssssssssss   s
  const [messages, setMessages] = useState([]);
  const [messageUser, setMessageUser] = useState('');
  const [themeName, setThemeName] = useState("default");
  const [isWaiting, setIsWaiting] = useState(false);
  const chatEndRef = useRef(null);
  const preventDoubleApiCall = useRef(false);
  const [token, setToken] = useState(null);
  const [openMessanger, setOpenMessanger] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    pushMessage(messageUser);
  };

  const pushMessage  = async (content) => {
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
            Authorization: `Bearer ${token}`
          }
        }
      );

      const { assistant, suggestions } = data;
      await setMessages(prev => [...prev, assistant, suggestions?.content?.length ?
        { ...suggestions, content: JSON.parse(suggestions.content) } : null].filter(Boolean));
    } catch (err) {
      setMessageUser('ERROR');
    } finally {
      preventDoubleApiCall.current = false
      setIsWaiting(false)
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, setMessages]);

  useEffect(() => {
    fetchMessages();
  }, [token, setToken]);

  const fetchMessages = async () => {
    if (!token){
      console.log("Not registered");
      return
    }
    const res = await axios.get(`${API_BASE}/message`, {headers: {
        Authorization: `Bearer ${token}`}
    });
    setMessages(res.data);
  };

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

        <img src={ImgBuilder.chatBotPic} className={styles.chatBotPic}/>
        <div className={styles.message}>
          <ReactMarkdown>
            {msg.content}
          </ReactMarkdown>
        </div>
      </div>
    ),
    3: (msg, idx) => (
      <div key={msg.id} className={`${styles.messageRow} ${styles.answerSuggestions}`}>
        {(msg.content).map((item, idx) => (
          <div key={idx} className={styles.answerSuggestionButton} onClick={() => pushMessage(item)}> 
            <ReactMarkdown>
              {item}
            </ReactMarkdown>
          </div>
        ))}
      </div>
    ),
    default: (msg, idx) => (
      <p key={idx} ><b>Error:</b> The type of message given is non-existent, the message is: {msg.content}</p>
    ),
  };

  return (
    <div className={`${theme[themeName]} ${styles.container}`}  onMouseMove={handleMouseMove}>

      <div className={styles.imageContainer}>
        <img src={ImgBuilder.mountain} className={`${styles.imageBG} ${styles.imageBGz1}`} />
        <img src={ImgBuilder.mountainPNG} className={`${styles.imageBG} ${styles.imageBGz2}`} />
        <p ref={textRef} className={styles.bgText}> Mountlyn</p>
      </div>
      

      <div className={`${styles.screen} ${openMessanger ?  "" : styles.closed}`}> 

        {messages.length < 1 &&
        <div className={styles.userPage}>
          <div className={styles.userPageTextCon}>
            <p className={`${styles.userPageTextGreetings} ${styles.userPageText}`}>
              Hi There!
            </p>
            <p className={`${styles.userPageTextSummary} ${styles.userPageText}`}>
              We are happy to see you in our application, this bot can do the following:
            </p>
            <ul className={`${styles.userPageTextUl} ${styles.userPageText}`}>
              <li>Change the Theme and Settings</li>
              <li>Perform RAG search</li>
              <li>Propose auto-filled choices</li>
              <li>Tell the weather in a specific location</li>
              <li>Propose the hike based on the input</li>
              <li>Add events to the callendar</li>
            </ul>
          </div>
          {!token ?
            <GoogleButton setToken={setToken}/> :
            <p>HI, YOU ARE REGISTERED, WRITE A MESSAGE</p>
          }
          
        </div>
        }
        
        
        <div className={styles.chatContainer}>
          <div className={styles.chatWrapper}>
            {messages.map((msg, idx) => (
              (renderHistory[msg.speaker] || renderHistory.default)(msg, idx)
            ))}
            {isWaiting && <Loading />}
          </div>
        </div>
        
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
          <img src={ImgBuilder.chatting} className={styles.iconOpenMessanger}/>
        </div>
      </footer>

    </div>
  );
  }

export default App;