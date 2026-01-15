import React, { useState } from 'react';
import { useVaultLock } from '@/lib/auth/VaultLockContext';
import styles from './VaultUnlockModal.module.css';

export const VaultUnlockModal: React.FC = () => {
  const { isLocked, unlockVault, isUnlocking, unlockError } = useVaultLock();
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);

  if (!isLocked) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await unlockVault(passphrase);
    if (!unlockError) {
      setPassphrase('');
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.icon}>🔐</span>
          <h2 className={styles.title}>Vault Locked</h2>
        </div>

        <p className={styles.message}>
          Your vault is locked. Enter your passphrase to unlock it.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type={showPassphrase ? 'text' : 'password'}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter your passphrase"
              disabled={isUnlocking}
              autoFocus
              className={styles.input}
            />
            <button
              type="button"
              onClick={() => setShowPassphrase(!showPassphrase)}
              className={styles.toggleButton}
              disabled={isUnlocking}
              title={showPassphrase ? 'Hide passphrase' : 'Show passphrase'}
            >
              {showPassphrase ? '◐' : '◑'}
            </button>
          </div>

          {unlockError && (
            <p className={styles.error}>{unlockError}</p>
          )}

          <button
            type="submit"
            disabled={isUnlocking || !passphrase.trim()}
            className={styles.submitButton}
          >
            {isUnlocking ? 'Unlocking...' : 'Unlock Vault'}
          </button>
        </form>

        <details className={styles.details}>
          <summary className={styles.summary}>Forgot passphrase?</summary>
          <p className={styles.recoveryText}>
            Use a recovery code to reset your vault. Recovery codes are securely stored in your email.
          </p>
        </details>
      </div>
    </div>
  );
};
