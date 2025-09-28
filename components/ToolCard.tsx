import React from 'react'
import styles from '../styles/Home.module.css'

interface ToolCardProps {
  id: string
  name: string
  description: string
  isSelected: boolean
  onClick: (id: string) => void
}

const ToolCard: React.FC<ToolCardProps> = ({ id, name, description, isSelected, onClick }) => {
  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ''}`}
      onClick={() => onClick(id)}
    >
      <h2>{name} &rarr;</h2>
      <p>{description}</p>
    </div>
  )
}

export default ToolCard