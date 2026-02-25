import Link from "next/link";

import styles from "./page.module.css";

export default function NotFoundPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <p className={styles.badge}>404</p>
        <h1 className={styles.title}>Siden finnes ikke</h1>
        <p className={styles.list}>Kontroller URL-en eller gå tilbake til forsiden.</p>
        <Link href="/">Gå til start</Link>
      </main>
    </div>
  );
}
