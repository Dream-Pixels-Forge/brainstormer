'use client'

import { WidgetShell } from '@/components/brainstormer/WidgetShell'

export default function Home() {
  // In Tauri mode, the page IS the widget.
  // The frameless window itself is the widget container.
  // In web preview mode, we simulate the same experience.
  return (
    <div className="h-screen w-screen overflow-hidden">
      <WidgetShell />
    </div>
  )
}
