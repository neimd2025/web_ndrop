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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center justify-center flex-1">
          {showBackButton && (
            <Button variant="ghost" size="sm" onClick={onBack} className="mr-3 p-2 -ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {title && <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>}
        </div>

        <div className="flex items-center space-x-2">
          {showQRButton && (
            <Button variant="ghost" size="sm" className="p-2">
              <QrCode className="h-5 w-5" />
            </Button>
          )}
          {showMenuButton && (
            <Button variant="ghost" size="sm" className="p-2">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
