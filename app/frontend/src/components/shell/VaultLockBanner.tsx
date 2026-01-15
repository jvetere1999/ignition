import React from 'react';
import { useVaultLock } from '@/lib/auth/VaultLockContext';
import styles from './VaultLockBanner.module.css';

export const VaultLockBanner: React.FC = () => {
  const { isLocked, lockReason } = useVaultLock();

  if (!isLocked) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <span className={styles.icon}>🔒</span>
        <div className={styles.text}>
          <p className={styles.title}>Vault Locked</p>
          <p className={styles.message}>
            {lockReason === 'idle' && 'Locked due to inactivity'}
            {lockReason === 'backgrounded' && 'Locked — App backgrounded'}
            {lockReason === 'logout' && 'Locked — Session ended'}
            {lockReason === 'rotation' && 'Locked — Session rotated'}
            {lockReason === 'force' && 'Locked — Admin action'}
            {!lockReason && 'Sensitive content unavailable'}
          </p>
        </div>
      </div>
    </div>
  );
};
