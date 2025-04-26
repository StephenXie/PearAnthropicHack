"use client"

import { MapConfigProvider } from "./components/map-config"

export default function QuestMasterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MapConfigProvider>
      {children}
    </MapConfigProvider>
  )
} 