import React from "react";
import styles from "../../styles/ErrorBoundary.module.scss";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You could forward this to a logging service
    // logErrorToService({ error, errorInfo });
    this.setState({ errorInfo });
    // keep a console trace for local dev
    // eslint-disable-next-line no-console
    console.error("React Error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof this.props.onReset === "function") this.props.onReset();
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    if (!hasError) return this.props.children;

    return (
      <div className={styles.wrapper} role="alert" aria-live="assertive">
        <div className={styles.header}>
          <div className={styles.icon} aria-hidden="true">⚠️</div>
          <div>
            <h2 className={styles.title}>Something went wrong</h2>
            <p className={styles.subtitle}>
              The app hit an unexpected error. You can try to continue or reload the page.
            </p>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={this.handleReset}>
            Continue
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => window.location.reload()}
          >
            Reload app
          </button>
        </div>

        <details className={styles.details}>
          <summary className={styles.summary}>Show error details</summary>
          <div className={styles.detailBlock}>
            <div className={styles.detailLabel}>Error</div>
            <pre className={styles.pre}>
              {(error && (error.stack || error.toString())) || "Unknown error"}
            </pre>
          </div>

          {errorInfo?.componentStack && (
            <div className={styles.detailBlock}>
              <div className={styles.detailLabel}>Component Stack</div>
              <pre className={styles.pre}>{errorInfo.componentStack}</pre>
            </div>
          )}
        </details>
      </div>
    );
  }
}
