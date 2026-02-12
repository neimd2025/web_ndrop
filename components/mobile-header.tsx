"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, MoreHorizontal, QrCode } from "lucide-react"

interface MobileHeaderProps {
  title?: string
  showBackButton?: boolean
  showQRButton?: boolean
  showMenuButton?: boolean
  onBack?: () => void
}

export default function MobileHeader({
  title,
  showBackButton = false,
  showQRButton = false,
  showMenuButton = false,
  onBack,
}: MobileHeaderProps) {
  return (
    <header className="bg-slate-950/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center justify-center flex-1 relative">
          {showBackButton && (
            <div className="absolute left-0">
              <Button variant="ghost" size="sm" onClick={onBack} className="p-2 -ml-2 text-white hover:text-white/80 hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
          )}
          {title && <h1 className="text-lg font-semibold text-white truncate">{title}</h1>}
        </div>

        <div className="flex items-center space-x-2 absolute right-4">
          {showQRButton && (
            <Button variant="ghost" size="sm" className="p-2 text-white hover:text-white/80 hover:bg-white/10">
              <QrCode className="h-5 w-5" />
            </Button>
          )}
          {showMenuButton && (
            <Button variant="ghost" size="sm" className="p-2 text-white hover:text-white/80 hover:bg-white/10">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
