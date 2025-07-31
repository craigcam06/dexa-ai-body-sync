import { cn } from "@/lib/utils"

interface SmartLoadingProps {
  className?: string
  size?: "sm" | "md" | "lg"
  text?: string
  progress?: number
}

export function SmartLoading({ className, size = "md", text, progress }: SmartLoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative">
        <div className={cn(
          "animate-spin rounded-full border-2 border-current border-t-transparent opacity-25",
          sizeClasses[size]
        )} />
        {progress !== undefined && (
          <div 
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-current transition-all duration-300"
            style={{ 
              transform: `rotate(${(progress / 100) * 360}deg)`,
              opacity: 0.8
            }}
          />
        )}
      </div>
      {text && (
        <div className="space-y-1">
          <p className="text-sm font-medium">{text}</p>
          {progress !== undefined && (
            <div className="text-xs text-muted-foreground">
              {progress}% complete
            </div>
          )}
        </div>
      )}
    </div>
  )
}