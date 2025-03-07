import react from "react";
import styles from "../../styles/PageNotFound.module.scss";

const PageNotFound = () => (
  <div className={styles.container}>
    <h2>Page Not Found</h2>
    <p>The page you're looking for doesn't exist.</p>
    <a href="/" className={styles.link}>
      Go Home
    </a>
  </div>
);

export default PageNotFound;
