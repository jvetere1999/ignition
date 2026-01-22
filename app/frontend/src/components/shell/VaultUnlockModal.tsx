import React from 'react';
import { useVaultLock } from '@/lib/auth/VaultLockContext';
import styles from './VaultUnlockModal.module.css';

export const VaultUnlockModal: React.FC = () => {
  const { isLocked, unlockVault, isUnlocking, unlockError } = useVaultLock();

  if (!isLocked) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await unlockVault();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.icon}>🔐</span>
          <h2 className={styles.title}>Vault Locked</h2>
        </div>

        <p className={styles.message}>
          Your vault is locked. Re-authenticate with your passkey to continue.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {unlockError && (
            <p className={styles.error}>{unlockError}</p>
          )}

          <button
            type="submit"
            disabled={isUnlocking}
            className={styles.submitButton}
          >
            {isUnlocking ? 'Verifying...' : 'Continue with passkey'}
          </button>
        </form>
      </div>
    </div>
  );
};
