import React, { useState } from "react";
import styles from "./accountHeader.module.css";

const AccountHeader = ({
  userProfile,
  userInitials,
  onClearChat,
  onLogout,
  onOpenOptionality,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const runAction = (action) => {
    setIsMenuOpen(false);
    action();
  };

  return (
    <div className={styles.accountHeader}>
      <div className={styles.profile}>
        {userProfile?.picture ?
          <img alt="" src={userProfile.picture} className={styles.profileImage}/> :
          <div className={styles.profileImageFallback}>{userInitials}</div>
        }
        <div className={styles.profileText}>
          <p className={styles.profileName}>{userProfile?.name || "AscendAI explorer"}</p>
          <p className={styles.profilePrompt}>What can we help you explore today?</p>
        </div>
      </div>

      <div className={styles.menuWrap}>
        <button
          type="button"
          aria-label="Open account settings"
          className={`${styles.menuButton} ${isMenuOpen ? styles.menuButtonOpen : ""}`}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <span/>
          <span/>
          <span/>
        </button>

        <div className={`${styles.menu} ${isMenuOpen ? styles.menuOpen : ""}`}>
          <button type="button" onClick={() => runAction(onClearChat)}>Clear current chat</button>
          <button type="button" onClick={() => runAction(onLogout)}>Log out</button>
          <button type="button" onClick={() => runAction(onOpenOptionality)}>See optionality</button>
        </div>
      </div>
    </div>
  );
};

export default AccountHeader;
