import Head from 'next/head'
import { useState } from 'react'
import styles from '../styles/Home.module.css'

export default function Home() {
  const [selectedTool, setSelectedTool] = useState<string>('')

  const agricTools = [
    { id: 'weather', name: 'Weather Forecast', description: 'Get weather updates for your crops' },
    { id: 'crop-calendar', name: 'Crop Calendar', description: 'Track planting and harvesting seasons' },
    { id: 'pest-control', name: 'Pest Control', description: 'Identify and manage crop pests' },
    { id: 'soil-health', name: 'Soil Health', description: 'Monitor and improve soil conditions' },
  ]

  return (
    <div className={styles.container}>
      <Head>
        <title>AgriAssist - Your Agricultural Companion</title>
        <meta name="description" content="Agricultural assistance web application" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <span className={styles.agriassist}>AgriAssist</span>
        </h1>

        <p className={styles.description}>
          Your comprehensive agricultural assistance platform
        </p>

        <div className={styles.grid}>
          {agricTools.map((tool) => (
            <div
              key={tool.id}
              className={`${styles.card} ${selectedTool === tool.id ? styles.selected : ''}`}
              onClick={() => setSelectedTool(tool.id)}
            >
              <h2>{tool.name} &rarr;</h2>
              <p>{tool.description}</p>
            </div>
          ))}
        </div>

        {selectedTool && (
          <div className={styles.selectedTool}>
            <h3>Selected: {agricTools.find(t => t.id === selectedTool)?.name}</h3>
            <p>Feature coming soon! This will provide detailed {selectedTool.replace('-', ' ')} functionality.</p>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2024 AgriAssist - Empowering Agriculture with Technology</p>
      </footer>
    </div>
  )
}