"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // 서버사이드 렌더링 중에는 아무것도 렌더링하지 않음
  if (!isClient) {
    return null
  }

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-black/90 group-[.toaster]:text-white group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur-sm",
          description: "group-[.toast]:text-white/90",
          actionButton:
            "group-[.toast]:bg-white/20 group-[.toast]:text-white group-[.toast]:border-white/30",
          cancelButton:
            "group-[.toast]:bg-white/10 group-[.toast]:text-white/80 group-[.toast]:border-white/20",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
