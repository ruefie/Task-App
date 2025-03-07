import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Key, Edit2, Save, X } from 'lucide-react';
import { profilesService } from '../lib/profiles';
import styles from '../styles/Profile.module.scss';

function Profile() {
  const { user, profile, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
    }
  }, [profile]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      console.log('Updating profile with:', { first_name: firstName, last_name: lastName });
      
      await updateProfile({
        first_name: firstName,
        last_name: lastName
      });
      
      setSuccess('Profile updated successfully');
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      setIsEditing(false);
    } catch (error) {
      setError('Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      await profilesService.updatePassword(currentPassword, newPassword);
      
      setSuccess('Password updated successfully');
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError('Failed to update password: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Profile</h1>
      
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
      
      {success && (
        <div className={styles.success}>
          {success}
        </div>
      )}
      
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>User Information</h2>
          <p className={styles.cardSubtitle}>Personal details and account settings</p>
          
          {!isEditing && !isChangingPassword && (
            <button
              onClick={() => setIsEditing(true)}
              className={styles.editButton}
            >
              <Edit2 className={styles.buttonIcon} />
              Edit Profile
            </button>
          )}
        </div>
        
        {isEditing ? (
          <div className={styles.formSection}>
            <form onSubmit={handleProfileSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="first-name" className={styles.label}>
                    First name
                  </label>
                  <input
                    type="text"
                    name="first-name"
                    id="first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="last-name" className={styles.label}>
                    Last name
                  </label>
                  <input
                    type="text"
                    name="last-name"
                    id="last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className={`${styles.input} ${styles.disabled}`}
                />
                <p className={styles.helperText}>Email cannot be changed</p>
              </div>
              
              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className={styles.cancelButton}
                  disabled={loading}
                >
                  <X className={styles.buttonIcon} />
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={loading}
                >
                  <Save className={styles.buttonIcon} />
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        ) : isChangingPassword ? (
          <div className={styles.formSection}>
            <form onSubmit={handlePasswordSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="current-password" className={styles.label}>
                  Current Password
                </label>
                <input
                  type="password"
                  name="current-password"
                  id="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="new-password" className={styles.label}>
                  New Password
                </label>
                <input
                  type="password"
                  name="new-password"
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirm-password" className={styles.label}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirm-password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={styles.input}
                />
              </div>
              
              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className={styles.cancelButton}
                  disabled={loading}
                >
                  <X className={styles.buttonIcon} />
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={loading}
                >
                  <Save className={styles.buttonIcon} />
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className={styles.infoSection}>
              <dl className={styles.infoList}>
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Full name</dt>
                  <dd className={styles.infoValue}>
                    {profile?.first_name || ''} {profile?.last_name || ''}
                  </dd>
                </div>
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Email address</dt>
                  <dd className={styles.infoValue}>
                    {user?.email || ''}
                  </dd>
                </div>
                <div className={styles.infoItem}>
                  <dt className={styles.infoLabel}>Account type</dt>
                  <dd className={styles.infoValue}>
                    {profile?.is_admin ? (
                      <span className={styles.adminBadge}>
                        Administrator
                      </span>
                    ) : (
                      <span className={styles.userBadge}>
                        Regular User
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
            <div className={styles.passwordSection}>
              <button
                onClick={() => setIsChangingPassword(true)}
                className={styles.passwordButton}
              >
                <Key className={styles.buttonIcon} />
                Change Password
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;