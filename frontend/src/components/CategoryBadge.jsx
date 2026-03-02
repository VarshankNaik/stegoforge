import React from 'react'

const COLOR_MAP = {
  blue:   'bg-ctp-blue/10    text-ctp-blue    border-ctp-blue/30',
  purple: 'bg-ctp-mauve/10   text-ctp-mauve   border-ctp-mauve/30',
  orange: 'bg-ctp-peach/10   text-ctp-peach   border-ctp-peach/30',
  green:  'bg-ctp-green/10   text-ctp-green   border-ctp-green/30',
  pink:   'bg-ctp-pink/10    text-ctp-pink    border-ctp-pink/30',
  yellow: 'bg-ctp-yellow/10  text-ctp-yellow  border-ctp-yellow/30',
  red:    'bg-ctp-red/10     text-ctp-red     border-ctp-red/30',
  gray:   'bg-ctp-surface1/50 text-ctp-subtext0 border-ctp-surface1',
}

export default function CategoryBadge({ label, icon, color = 'blue', className = '' }) {
  const colorClass = COLOR_MAP[color] || COLOR_MAP.blue
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5
                      text-xs font-medium rounded border
                      ${colorClass} ${className}`}>
      {icon && <span>{icon}</span>}
      {label}
    </span>
  )
}
