"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Building2, Eye, EyeOff, Loader2, ArrowLeft, Mail } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  PasswordStrengthIndicator,
  getPasswordStrength,
} from "@/components/tashyeed/password-strength"

interface AuthUser {
  id: string
  name: string
  email: string
}

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (user: AuthUser, token: string) => void
}

type AuthView = "signin" | "signup" | "forgot-password"

const viewVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

export function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const [view, setView] = React.useState<AuthView>("signin")
  const [activeTab, setActiveTab] = React.useState<string>("signin")

  // Sign In state
  const [signInEmail, setSignInEmail] = React.useState("")
  const [signInPassword, setSignInPassword] = React.useState("")
  const [signInShowPassword, setSignInShowPassword] = React.useState(false)
  const [signInLoading, setSignInLoading] = React.useState(false)
  const [signInError, setSignInError] = React.useState("")

  // Sign Up state
  const [signUpName, setSignUpName] = React.useState("")
  const [signUpEmail, setSignUpEmail] = React.useState("")
  const [signUpPassword, setSignUpPassword] = React.useState("")
  const [signUpConfirmPassword, setSignUpConfirmPassword] = React.useState("")
  const [signUpShowPassword, setSignUpShowPassword] = React.useState(false)
  const [signUpShowConfirm, setSignUpShowConfirm] = React.useState(false)
  const [signUpAgreedToTerms, setSignUpAgreedToTerms] = React.useState(false)
  const [signUpLoading, setSignUpLoading] = React.useState(false)
  const [signUpError, setSignUpError] = React.useState("")

  // Forgot Password state
  const [forgotEmail, setForgotEmail] = React.useState("")
  const [forgotLoading, setForgotLoading] = React.useState(false)
  const [forgotError, setForgotError] = React.useState("")
  const [forgotSuccess, setForgotSuccess] = React.useState(false)

  // Reset all state when modal closes
  React.useEffect(() => {
    if (!open) {
      setView("signin")
      setActiveTab("signin")
      setSignInEmail("")
      setSignInPassword("")
      setSignInShowPassword(false)
      setSignInLoading(false)
      setSignInError("")
      setSignUpName("")
      setSignUpEmail("")
      setSignUpPassword("")
      setSignUpConfirmPassword("")
      setSignUpShowPassword(false)
      setSignUpShowConfirm(false)
      setSignUpAgreedToTerms(false)
      setSignUpLoading(false)
      setSignUpError("")
      setForgotEmail("")
      setForgotLoading(false)
      setForgotError("")
      setForgotSuccess(false)
    }
  }, [open])

  const switchToSignIn = React.useCallback(() => {
    setView("signin")
    setActiveTab("signin")
    setSignInError("")
    setSignUpError("")
    setForgotError("")
    setForgotSuccess(false)
  }, [])

  const switchToSignUp = React.useCallback(() => {
    setView("signup")
    setActiveTab("signup")
    setSignInError("")
    setSignUpError("")
    setForgotError("")
    setForgotSuccess(false)
  }, [])

  const switchToForgotPassword = React.useCallback(() => {
    setView("forgot-password")
    setSignInError("")
    setForgotError("")
    setForgotSuccess(false)
  }, [])

  const handleSignIn = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSignInError("")

      if (!signInEmail.trim() || !signInPassword) {
        setSignInError("Please enter your email and password.")
        return
      }

      setSignInLoading(true)

      try {
        const res = await fetch("/api/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: signInEmail, password: signInPassword }),
        })

        const data = await res.json()

        if (!res.ok) {
          setSignInError(data.error || "Sign in failed. Please try again.")
          return
        }

        localStorage.setItem("tashyeed_token", data.token)
        onSuccess(data.user, data.token)
        onOpenChange(false)
      } catch {
        setSignInError("An unexpected error occurred. Please try again.")
      } finally {
        setSignInLoading(false)
      }
    },
    [signInEmail, signInPassword, onSuccess, onOpenChange]
  )

  const handleSignUp = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSignUpError("")

      if (!signUpName.trim() || !signUpEmail.trim() || !signUpPassword) {
        setSignUpError("Please fill in all required fields.")
        return
      }

      if (signUpPassword !== signUpConfirmPassword) {
        setSignUpError("Passwords do not match.")
        return
      }

      if (getPasswordStrength(signUpPassword) === "weak") {
        setSignUpError(
          "Password is too weak. Use at least 8 characters with uppercase, lowercase, and a number."
        )
        return
      }

      if (!signUpAgreedToTerms) {
        setSignUpError("You must agree to the Terms of Service and Privacy Policy.")
        return
      }

      setSignUpLoading(true)

      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: signUpName,
            email: signUpEmail,
            password: signUpPassword,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          setSignUpError(data.error || "Account creation failed. Please try again.")
          return
        }

        localStorage.setItem("tashyeed_token", data.token)
        onSuccess(data.user, data.token)
        onOpenChange(false)
      } catch {
        setSignUpError("An unexpected error occurred. Please try again.")
      } finally {
        setSignUpLoading(false)
      }
    },
    [
      signUpName,
      signUpEmail,
      signUpPassword,
      signUpConfirmPassword,
      signUpAgreedToTerms,
      onSuccess,
      onOpenChange,
    ]
  )

  const handleForgotPassword = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setForgotError("")

      if (!forgotEmail.trim()) {
        setForgotError("Please enter your email address.")
        return
      }

      setForgotLoading(true)

      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotEmail }),
        })

        const data = await res.json()

        if (!res.ok) {
          setForgotError(data.error || "Failed to send reset link. Please try again.")
          return
        }

        setForgotSuccess(true)
      } catch {
        setForgotError("An unexpected error occurred. Please try again.")
      } finally {
        setForgotLoading(false)
      }
    },
    [forgotEmail]
  )

  const handleTabChange = React.useCallback(
    (value: string) => {
      setActiveTab(value)
      if (value === "signin") {
        setView("signin")
      } else if (value === "signup") {
        setView("signup")
      }
      setSignInError("")
      setSignUpError("")
    },
    []
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 gap-0 overflow-hidden border-border/60">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-background to-background -z-10" />

        {/* Branding Header */}
        <div className="flex flex-col items-center pt-8 pb-2 px-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground">
              Tashyeed
            </span>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {view === "forgot-password" ? (
            <motion.div
              key="forgot-password"
              variants={viewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="px-6 pb-8 pt-4"
            >
              <DialogHeader className="items-center text-center mb-4">
                <DialogTitle className="text-lg">Reset your password</DialogTitle>
                <DialogDescription>
                  Enter your email and we&apos;ll send you a reset link.
                </DialogDescription>
              </DialogHeader>

              {forgotSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4 py-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-center space-y-1.5">
                    <p className="text-sm font-medium text-foreground">
                      Check your email
                    </p>
                    <p className="text-xs text-muted-foreground">
                      We&apos;ve sent a password reset link to{" "}
                      <span className="font-medium text-foreground">
                        {forgotEmail}
                      </span>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={switchToSignIn}
                    className="mt-2 text-muted-foreground"
                  >
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Back to Sign In
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      autoComplete="email"
                      autoFocus
                    />
                  </div>

                  {forgotError && (
                    <Alert variant="destructive">
                      <AlertDescription>{forgotError}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>

                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={switchToSignIn}
                      className="text-muted-foreground"
                    >
                      <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                      Back to Sign In
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="auth-tabs"
              variants={viewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="w-full"
              >
                <div className="px-6">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Create Account</TabsTrigger>
                  </TabsList>
                </div>

                {/* Sign In Tab */}
                <TabsContent value="signin" className="px-6 pb-8 pt-4 mt-0">
                  <DialogHeader className="items-center text-center mb-4 sr-only">
                    <DialogTitle>Sign in to your account</DialogTitle>
                    <DialogDescription>
                      Enter your credentials below to access your account.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        autoComplete="email"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="signin-password">Password</Label>
                        <button
                          type="button"
                          onClick={switchToForgotPassword}
                          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={signInShowPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                          autoComplete="current-password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setSignInShowPassword(!signInShowPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                          aria-label={
                            signInShowPassword ? "Hide password" : "Show password"
                          }
                        >
                          {signInShowPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {signInError && (
                      <Alert variant="destructive">
                        <AlertDescription>{signInError}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={signInLoading}
                    >
                      {signInLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                      Don&apos;t have an account?{" "}
                      <button
                        type="button"
                        onClick={switchToSignUp}
                        className="font-medium text-foreground hover:underline transition-all"
                      >
                        Create one
                      </button>
                    </p>
                  </form>
                </TabsContent>

                {/* Sign Up Tab */}
                <TabsContent value="signup" className="px-6 pb-8 pt-4 mt-0">
                  <DialogHeader className="items-center text-center mb-4 sr-only">
                    <DialogTitle>Create your account</DialogTitle>
                    <DialogDescription>
                      Fill in the details below to get started.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Your full name"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        autoComplete="name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={signUpShowPassword ? "text" : "password"}
                          placeholder="Create a password"
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          autoComplete="new-password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setSignUpShowPassword(!signUpShowPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                          aria-label={
                            signUpShowPassword ? "Hide password" : "Show password"
                          }
                        >
                          {signUpShowPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <PasswordStrengthIndicator password={signUpPassword} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-confirm-password"
                          type={signUpShowConfirm ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={signUpConfirmPassword}
                          onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                          autoComplete="new-password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setSignUpShowConfirm(!signUpShowConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                          aria-label={
                            signUpShowConfirm ? "Hide password" : "Show password"
                          }
                        >
                          {signUpShowConfirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {signUpConfirmPassword &&
                        signUpPassword !== signUpConfirmPassword && (
                          <p className="text-xs text-red-500 dark:text-red-400">
                            Passwords do not match
                          </p>
                        )}
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Checkbox
                        id="signup-terms"
                        checked={signUpAgreedToTerms}
                        onCheckedChange={(checked) =>
                          setSignUpAgreedToTerms(checked === true)
                        }
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor="signup-terms"
                        className="text-xs font-normal leading-relaxed text-muted-foreground cursor-pointer"
                      >
                        I agree to the{" "}
                        <span className="font-medium text-foreground hover:underline cursor-pointer">
                          Terms of Service
                        </span>{" "}
                        and{" "}
                        <span className="font-medium text-foreground hover:underline cursor-pointer">
                          Privacy Policy
                        </span>
                      </Label>
                    </div>

                    {signUpError && (
                      <Alert variant="destructive">
                        <AlertDescription>{signUpError}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={signUpLoading}
                    >
                      {signUpLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={switchToSignIn}
                        className="font-medium text-foreground hover:underline transition-all"
                      >
                        Sign in
                      </button>
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
