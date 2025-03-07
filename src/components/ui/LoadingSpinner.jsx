import React from 'react';
import styles from "../../styles/LoadingSpinner.module.scss";


const LoadingSpinner = () => (
  <div className={styles.spinnerContainer}>
    <div className={styles.spinner}></div>
  </div>
);

export default LoadingSpinner;
