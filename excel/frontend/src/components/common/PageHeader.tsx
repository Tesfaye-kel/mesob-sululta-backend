import { Link } from 'react-router-dom'
import styles from './PageHeader.module.css'

interface PageHeaderProps {
  breadcrumbs: { label: string; href?: string }[]
  title: string
  subtitle?: string
}

export default function PageHeader({ breadcrumbs, title, subtitle }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      {/* Inner wrapper: centered block, left-aligned text */}
      <div className={styles.inner}>

        {/* Breadcrumb nav */}
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb">
            <ol className={styles.breadcrumbs}>
              {breadcrumbs.map((crumb, i) => {
                const isLast = i === breadcrumbs.length - 1
                return (
                  <li key={i} style={{ display: 'flex', alignItems: 'center' }}>
                    {i > 0 && (
                      <span className={styles.breadcrumbSeparator} aria-hidden="true">›</span>
                    )}
                    {isLast || !crumb.href ? (
                      <span
                        className={styles.breadcrumbCurrent}
                        aria-current={isLast ? 'page' : undefined}
                      >
                        {crumb.label}
                      </span>
                    ) : (
                      <Link to={crumb.href} className={styles.breadcrumbLink}>
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        )}

        <h1 className={styles.title}>{title}</h1>

        {subtitle && (
          <p className={styles.subtitle}>{subtitle}</p>
        )}

      </div>
    </header>
  )
}

/*
Usage example — "About MESOB Center" page:

<PageHeader
  breadcrumbs={[
    { label: 'Home', href: '/' },
    { label: 'About' },
  ]}
  title="About MESOB Center"
  subtitle="Seenaa Keenya, mission, and vision for public service excellence."
/>
*/
