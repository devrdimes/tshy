"use client"

import { cn } from "@/lib/utils"

export type PasswordStrength = "weak" | "medium" | "strong"

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return "weak"

  const hasLength8 = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  if (hasLength8 && hasUppercase && hasLowercase && hasNumber) {
    return "strong"
  }

  if (hasLength8 && (hasUppercase || hasLowercase) && hasNumber) {
    return "medium"
  }

  return "weak"
}

export function getStrengthScore(password: string): number {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  return score
}

const strengthConfig: Record<
  PasswordStrength,
  { label: string; color: string; barColor: string; segments: number }
> = {
  weak: {
    label: "Weak",
    color: "text-red-500 dark:text-red-400",
    barColor: "bg-red-500 dark:bg-red-400",
    segments: 1,
  },
  medium: {
    label: "Medium",
    color: "text-amber-500 dark:text-amber-400",
    barColor: "bg-amber-500 dark:bg-amber-400",
    segments: 2,
  },
  strong: {
    label: "Strong",
    color: "text-emerald-500 dark:text-emerald-400",
    barColor: "bg-emerald-500 dark:bg-emerald-400",
    segments: 3,
  },
}

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
}

export function PasswordStrengthIndicator({
  password,
  className,
}: PasswordStrengthIndicatorProps) {
  const strength = getPasswordStrength(password)
  const config = strengthConfig[strength]

  if (!password) return null

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex gap-1">
        {[1, 2, 3].map((segment) => (
          <div
            key={segment}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              segment <= config.segments
                ? config.barColor
                : "bg-muted-foreground/20"
            )}
          />
        ))}
      </div>
      <p className={cn("text-xs font-medium", config.color)}>
        {config.label}
      </p>
    </div>
  )
}
