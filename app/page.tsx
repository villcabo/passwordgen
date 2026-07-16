"use client"

import { useEffect, useRef, useState } from "react"
import { AlertTriangle, Check, Copy, Github, Minus, Moon, Plus, RefreshCw, Shield, Sun } from "lucide-react"
import packageJson from "@/package.json"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"

interface PasswordConfig {
  length: number
  includeNumbers: boolean
  includeLowercase: boolean
  includeUppercase: boolean
  startWithLetter: boolean
  avoidSimilar: boolean
  avoidDuplicates: boolean
  avoidSequences: boolean
  customCharacters: string
  autoGenerate: boolean
  quantity: number
}

// RFC 3986 unreserved symbols: safe in connection strings, .env, YAML, SQL and shells
const SAFE_SYMBOLS = "-_.~"
// Classic symbol set accepted by virtually every application password policy
const APP_SYMBOLS = "!@#$%^&*"
const FULL_SYMBOLS = "!@#$%^&*()-_=+"

// Characters that break common contexts where passwords end up stored or pasted
const UNSAFE_CHARS: Record<string, string> = {
  "@": "connection strings (user:pass@host)",
  ":": "connection strings",
  "/": "URLs and URIs",
  "?": "URLs (query string)",
  "#": "URLs and .env/YAML comments",
  "&": "URLs and shells",
  "=": ".env files",
  "%": "URL encoding",
  "'": "SQL literals",
  '"': "SQL, JSON and YAML",
  "\\": "escape sequences",
  ";": "SQL statement separator",
  $: "shell and .env interpolation",
  "`": "shell interpolation",
  " ": "spaces break parsers",
  "+": "URL encoding (decodes as a space)",
}

const MIN_LENGTH = 6
const MAX_LENGTH = 64

const MIN_QUANTITY = 1
const MAX_QUANTITY = 30
const QUANTITY_PRESETS = [1, 5, 10, 20]

// Long enough to swallow a slider drag, short enough to still feel like a live preview
const GENERATE_DELAY_MS = 300

const REPO_URL = "https://github.com/villcabo/passwordgen"

// Landmarks on the length axis, doubling as one-click shortcuts.
// They carry no strength label on purpose: real strength depends on the charset too,
// so only the live readout below the scale can state it truthfully.
const LENGTH_TICKS = [8, 16, 24, 32, 64]

// Thumb center travels between 10px and (100% - 10px), so ticks must follow the same inset
const tickOffset = (value: number) => {
  const percent = ((value - MIN_LENGTH) / (MAX_LENGTH - MIN_LENGTH)) * 100
  return `calc(${percent}% - ${(percent * 0.2).toFixed(2)}px + 10px)`
}

const defaultConfig: PasswordConfig = {
  length: 16,
  includeNumbers: true,
  includeLowercase: true,
  includeUppercase: true,
  startWithLetter: true,
  avoidSimilar: true,
  avoidDuplicates: true,
  avoidSequences: true,
  customCharacters: SAFE_SYMBOLS,
  autoGenerate: true,
  quantity: 5,
}

const similarCharacters = "O0Il1"
const sequences = [
  "abc", "bcd", "cde", "def", "efg", "fgh", "ghi", "hij", "ijk", "jkl",
  "klm", "lmn", "mno", "nop", "opq", "pqr", "qrs", "rst", "stu", "tuv",
  "uvw", "vwx", "wxy", "xyz",
  "123", "234", "345", "456", "567", "678", "789", "890",
  "qwe", "wer", "ert", "rty", "tyu", "yui", "uio", "iop",
  "asd", "sdf", "dfg", "ghj", "hjk",
  "zxc", "xcv", "cvb", "vbn", "bnm",
]

// Cryptographically secure random integer in [0, max) with rejection sampling
const randomInt = (max: number): number => {
  if (max <= 1) return 0
  const buf = new Uint32Array(1)
  const limit = Math.floor(0x100000000 / max) * max
  let value: number
  do {
    crypto.getRandomValues(buf)
    value = buf[0]
  } while (value >= limit)
  return value % max
}

// Panel header: title and its live count on the left, actions on the right
function PanelHeader({ title, meta, children }: { title: string; meta?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-black/[0.08] dark:border-white/[0.08]">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {meta ? <p className="text-xs text-muted-foreground mt-0.5">{meta}</p> : null}
      </div>
      {children ? <div className="flex items-center gap-2 shrink-0">{children}</div> : null}
    </div>
  )
}

/*
 * Direct numeric control: shows the value and both steps at once, and stays typeable
 * for the far ends of a range that would take dozens of clicks to step to.
 * The inner number input is natively a spinbutton, so the wrapper adds no ARIA role.
 */
function Stepper({
  value,
  min,
  max,
  label,
  onChange,
}: {
  value: number
  min: number
  max: number
  label: string
  onChange: (next: number) => void
}) {
  const [text, setText] = useState(String(value))

  // Follow slider, presets and ticks that change the value from outside
  useEffect(() => {
    setText(String(value))
  }, [value])

  const clamp = (n: number) => Math.min(max, Math.max(min, n))

  const handleText = (raw: string) => {
    setText(raw)
    const parsed = Number.parseInt(raw, 10)
    if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) {
      onChange(parsed)
    }
  }

  // Half-typed and out-of-range values only settle on blur, so typing "7" toward "47" survives
  const commit = () => {
    const parsed = Number.parseInt(text, 10)
    if (Number.isNaN(parsed)) {
      setText(String(value))
      return
    }
    const clamped = clamp(parsed)
    setText(String(clamped))
    onChange(clamped)
  }

  const buttonClass =
    "flex items-center justify-center w-8 h-8 shrink-0 text-muted-foreground transition-colors hover:text-foreground hover:bg-black/[0.06] dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"

  return (
    <div className="inline-flex items-center rounded-lg glass-inset overflow-hidden focus-within:ring-2 focus-within:ring-ring">
      <button
        type="button"
        disabled={value <= min}
        onClick={() => onChange(clamp(value - 1))}
        className={`${buttonClass} border-r border-black/[0.08] dark:border-white/10`}
        aria-label={`Decrease ${label}`}
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={text}
        onChange={(e) => handleText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        aria-label={label}
        className="w-11 h-8 bg-transparent text-center font-mono text-sm tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
        className={`${buttonClass} border-l border-black/[0.08] dark:border-white/10`}
        aria-label={`Increase ${label}`}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// Digits and symbols tinted for readability, like password managers do
function PasswordChars({ value }: { value: string }) {
  return (
    <>
      {value.split("").map((char, i) => {
        if (/\d/.test(char)) {
          return (
            <span key={i} className="text-sky-600 dark:text-sky-400">
              {char}
            </span>
          )
        }
        if (!/[a-zA-Z]/.test(char)) {
          return (
            <span key={i} className="text-rose-600 dark:text-rose-400">
              {char}
            </span>
          )
        }
        return <span key={i}>{char}</span>
      })}
    </>
  )
}

export default function PasswordGenerator() {
  const [config, setConfig] = useState<PasswordConfig>(defaultConfig)
  const [passwords, setPasswords] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState<number | "all" | null>(null)
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { toast } = useToast()
  const { setTheme, resolvedTheme } = useTheme()

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load config from localStorage on mount
  useEffect(() => {
    if (mounted) {
      const savedConfig = localStorage.getItem("passwordGeneratorConfig")
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig)
        setConfig({ ...defaultConfig, ...parsed })
      }
    }
  }, [mounted])

  // Save config to localStorage whenever it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("passwordGeneratorConfig", JSON.stringify(config))
    }
  }, [config, mounted])

  /*
   * Auto-generate on config change, debounced: dragging the slider fires a change per step,
   * and every intermediate length would otherwise generate a full batch nobody asked to see.
   * The cleanup cancels the pending run, so only the value you settle on is generated.
   */
  useEffect(() => {
    if (!config.autoGenerate || !mounted) return
    const timer = setTimeout(generatePasswords, GENERATE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [config, mounted])

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  const updateConfig = (key: keyof PasswordConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const getCharacterSet = (): string => {
    let charset = ""

    if (config.includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz"
    if (config.includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if (config.includeNumbers) charset += "0123456789"

    if (config.customCharacters.trim()) {
      charset += config.customCharacters
    }

    if (!config.includeLowercase && !config.includeUppercase && !config.includeNumbers) {
      charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      if (config.customCharacters.trim()) {
        charset += config.customCharacters
      }
    }

    if (config.avoidSimilar) {
      charset = charset
        .split("")
        .filter((char) => !similarCharacters.includes(char))
        .join("")
    }

    charset = [...new Set(charset.split(""))].join("")
    return charset
  }

  const getLetterSet = (): string => {
    let letters = ""
    if (config.includeLowercase) letters += "abcdefghijklmnopqrstuvwxyz"
    if (config.includeUppercase) letters += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

    if (!letters && config.customCharacters.trim()) {
      letters = config.customCharacters
        .split("")
        .filter((char) => /[a-zA-Z]/.test(char))
        .join("")
    }

    if (config.avoidSimilar) {
      letters = letters
        .split("")
        .filter((char) => !similarCharacters.includes(char))
        .join("")
    }

    return letters || "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  }

  const hasSequence = (password: string): boolean => {
    const lower = password.toLowerCase()
    return sequences.some((seq) => lower.includes(seq))
  }

  const filterSimilar = (set: string): string => {
    if (!config.avoidSimilar) return set
    return set
      .split("")
      .filter((char) => !similarCharacters.includes(char))
      .join("")
  }

  const generateSinglePassword = (): string => {
    const charset = getCharacterSet()
    const letterSet = getLetterSet()

    if (!charset) return ""

    const lowercaseSet = config.includeLowercase ? filterSimilar("abcdefghijklmnopqrstuvwxyz") : ""
    const uppercaseSet = config.includeUppercase ? filterSimilar("ABCDEFGHIJKLMNOPQRSTUVWXYZ") : ""
    const numberSet = config.includeNumbers ? filterSimilar("0123456789") : ""
    const specialSet = config.customCharacters.trim() ? filterSimilar(config.customCharacters) : ""

    /*
     * Distinct characters are drawn without replacement — each pick leaves the pool — so a
     * candidate satisfies "no duplicates" by construction, in one pass. Rejecting whole
     * passwords until one happened to have no repeats needed ~1000 tries at length 32 and
     * still failed, because 32 distinct draws out of 61 almost never happen by chance.
     * Beyond charset.length it is impossible outright (pigeonhole), so the option is off.
     */
    const drawDistinct = config.avoidDuplicates && config.length <= charset.length

    const buildCandidate = (): string => {
      const pool = charset.split("")

      const draw = (from: string): string => {
        const options = drawDistinct ? from.split("").filter((char) => pool.includes(char)) : from.split("")
        if (options.length === 0) return ""
        const pick = options[randomInt(options.length)]
        if (drawDistinct) pool.splice(pool.indexOf(pick), 1)
        return pick
      }

      const head = config.startWithLetter && letterSet ? draw(letterSet) : ""

      // One guaranteed character per enabled class, unless the head already covers that class
      const required: string[] = []
      for (const set of [lowercaseSet, uppercaseSet, numberSet, specialSet]) {
        if (!set) continue
        if (head && set.includes(head)) continue
        if (head.length + required.length >= config.length) break
        const char = draw(set)
        if (char) required.push(char)
      }

      const rest: string[] = []
      for (let i = head.length + required.length; i < config.length; i++) {
        const char = draw(charset)
        if (!char) break
        rest.push(char)
      }

      // Shuffle everything after the head, so the guaranteed classes are not in a fixed order
      const body = [...required, ...rest]
      for (let i = body.length - 1; i > 0; i--) {
        const j = randomInt(i + 1)
        ;[body[i], body[j]] = [body[j], body[i]]
      }

      return head + body.join("")
    }

    // Sequences are the only rule left that a candidate cannot satisfy by construction
    let password = buildCandidate()
    for (let attempts = 0; config.avoidSequences && hasSequence(password) && attempts < 200; attempts++) {
      password = buildCandidate()
    }

    return password
  }

  const generatePasswords = () => {
    const newPasswords: string[] = []
    for (let i = 0; i < config.quantity; i++) {
      newPasswords.push(generateSinglePassword())
    }
    setPasswords(newPasswords)
  }

  const regeneratePassword = (index: number) => {
    setPasswords((prev) => prev.map((p, i) => (i === index ? generateSinglePassword() : p)))
  }

  const copyToClipboard = async (password: string | string[], index: number | "all") => {
    try {
      const textToCopy = Array.isArray(password) ? password.join("\n") : password
      await navigator.clipboard.writeText(textToCopy)
      if (copyTimeout.current) clearTimeout(copyTimeout.current)
      setCopied(index)
      copyTimeout.current = setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Your browser blocked clipboard access. Select the password and copy it manually.",
        variant: "destructive",
      })
    }
  }

  const charsetSize = getCharacterSet().length
  // Pigeonhole: distinct characters cannot outnumber the character set
  const canAvoidDuplicates = config.avoidDuplicates && config.length <= charsetSize && charsetSize > 0
  const duplicatesImpossible = config.avoidDuplicates && charsetSize > 0 && config.length > charsetSize

  /*
   * Entropy must describe how the password is actually drawn. With replacement every position
   * has the full charset, so it is length × log2(size). Drawing distinct characters shrinks the
   * pool by one each time, so it is the sum of log2 over the shrinking pool — always lower.
   */
  const entropy =
    charsetSize === 0
      ? 0
      : Math.round(
          canAvoidDuplicates
            ? Array.from({ length: config.length }, (_, i) => Math.log2(charsetSize - i)).reduce((a, b) => a + b, 0)
            : config.length * Math.log2(charsetSize)
        )
  // Thresholds aligned with the length presets over the full charset:
  // 8 chars ≈ 47 bits (Weak), 16 ≈ 95 (Strong), 24+ ≈ 142 (Excellent)
  const strength =
    entropy < 50
      ? { label: "Weak", bar: "bg-red-500", text: "text-red-600 dark:text-red-400" }
      : entropy < 80
        ? { label: "Fair", bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" }
        : entropy < 110
          ? { label: "Strong", bar: "bg-green-500", text: "text-green-600 dark:text-green-400" }
          : { label: "Excellent", bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" }

  const unsafeUsed = [...new Set(config.customCharacters.split(""))].filter((char) => char in UNSAFE_CHARS)

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 glass-chrome">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold tracking-tight">Password Generator</h1>
            <span className="glass-inset rounded-full px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              v{packageJson.version}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="icon">
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
                <span className="sr-only">View the code on GitHub</span>
              </a>
            </Button>
            <Button onClick={toggleTheme} variant="ghost" size="icon">
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="sr-only">Switch theme</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="xl:col-span-1">
            <Card className="glass-panel rounded-2xl overflow-hidden">
              <PanelHeader title="Settings" />
              <CardContent className="p-4 space-y-6">
                {/* Length: one scale that carries the number, the shortcuts and the strength */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="font-medium">Length</Label>
                    <Stepper
                      value={config.length}
                      min={MIN_LENGTH}
                      max={MAX_LENGTH}
                      label="Password length"
                      onChange={(next) => updateConfig("length", next)}
                    />
                  </div>

                  <div className="relative pb-8">
                    <Slider
                      value={[config.length]}
                      onValueChange={(value) => updateConfig("length", value[0])}
                      max={MAX_LENGTH}
                      min={MIN_LENGTH}
                      step={1}
                      rangeClassName={strength.bar}
                      aria-label="Password length"
                    />
                    {LENGTH_TICKS.map((tick) => (
                      <button
                        key={tick}
                        type="button"
                        onClick={() => updateConfig("length", tick)}
                        style={{ left: tickOffset(tick) }}
                        className="absolute top-4 -translate-x-1/2 flex flex-col items-center gap-1 group focus-visible:outline-none"
                        aria-label={`Length ${tick} characters`}
                      >
                        <span
                          className={`w-px h-1.5 transition-colors ${
                            config.length === tick ? "bg-foreground/50" : "bg-foreground/20"
                          }`}
                        />
                        <span
                          className={`text-[10px] font-mono tabular-nums transition-colors group-hover:text-foreground group-focus-visible:text-foreground group-focus-visible:underline ${
                            config.length === tick ? "text-foreground font-semibold" : "text-muted-foreground"
                          }`}
                        >
                          {tick}
                        </span>
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground" aria-live="polite">
                    <span className={`font-medium ${strength.text}`}>{strength.label}</span> · {entropy} bits of entropy
                  </p>
                </div>

                {/* Quantity */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="font-medium">Amount</Label>
                    <Stepper
                      value={config.quantity}
                      min={MIN_QUANTITY}
                      max={MAX_QUANTITY}
                      label="Number of passwords"
                      onChange={(next) => updateConfig("quantity", next)}
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {QUANTITY_PRESETS.map((quantity) => (
                      <Button
                        key={quantity}
                        variant={config.quantity === quantity ? "default" : "outline"}
                        size="sm"
                        className={`h-7 px-3 text-xs font-mono ${config.quantity === quantity ? "" : "glass-inset glass-hover"}`}
                        onClick={() => updateConfig("quantity", quantity)}
                      >
                        {quantity}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Character Options */}
                <div className="space-y-3">
                  <Label className="font-medium">Include characters</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: "numbers", label: "Numbers (0-9)", key: "includeNumbers" },
                      { id: "lowercase", label: "Lowercase (a-z)", key: "includeLowercase" },
                      { id: "uppercase", label: "Uppercase (A-Z)", key: "includeUppercase" },
                    ].map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-3 p-3 rounded-lg glass-inset glass-hover transition-colors"
                      >
                        <Checkbox
                          id={item.id}
                          checked={config[item.key as keyof PasswordConfig] as boolean}
                          onCheckedChange={(checked) => updateConfig(item.key as keyof PasswordConfig, checked)}
                        />
                        <Label htmlFor={item.id} className="text-sm cursor-pointer flex-1">
                          {item.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Characters */}
                <div className="space-y-2">
                  <Label htmlFor="customChars" className="font-medium">
                    Symbols
                  </Label>
                  <div className="flex gap-1.5">
                    <Button
                      variant={config.customCharacters === SAFE_SYMBOLS ? "default" : "outline"}
                      size="sm"
                      className={`h-7 px-2.5 text-xs ${config.customCharacters === SAFE_SYMBOLS ? "" : "glass-inset glass-hover"}`}
                      onClick={() => updateConfig("customCharacters", SAFE_SYMBOLS)}
                    >
                      Database-safe
                    </Button>
                    <Button
                      variant={config.customCharacters === APP_SYMBOLS ? "default" : "outline"}
                      size="sm"
                      className={`h-7 px-2.5 text-xs ${config.customCharacters === APP_SYMBOLS ? "" : "glass-inset glass-hover"}`}
                      onClick={() => updateConfig("customCharacters", APP_SYMBOLS)}
                    >
                      Apps
                    </Button>
                    <Button
                      variant={config.customCharacters === FULL_SYMBOLS ? "default" : "outline"}
                      size="sm"
                      className={`h-7 px-2.5 text-xs ${config.customCharacters === FULL_SYMBOLS ? "" : "glass-inset glass-hover"}`}
                      onClick={() => updateConfig("customCharacters", FULL_SYMBOLS)}
                    >
                      Full
                    </Button>
                  </div>
                  <Input
                    id="customChars"
                    value={config.customCharacters}
                    onChange={(e) => updateConfig("customCharacters", e.target.value)}
                    placeholder="e.g. -_.~"
                    className="text-center font-mono glass-field"
                  />
                  {config.customCharacters === APP_SYMBOLS || config.customCharacters === FULL_SYMBOLS ? (
                    <p className="text-xs text-muted-foreground">
                      Accepted by most apps. Avoid them for database, connection string and .env passwords.
                    </p>
                  ) : unsafeUsed.length > 0 ? (
                    <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md p-2.5">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <div className="space-y-0.5">
                        {unsafeUsed.map((char) => (
                          <p key={char}>
                            <code className="font-mono font-semibold">{char === " " ? "space" : char}</code> breaks{" "}
                            {UNSAFE_CHARS[char]}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      These symbols (-_.~) survive connection strings, .env files, SQL and shells.
                    </p>
                  )}
                </div>

                <Separator />

                {/* Advanced Options */}
                <div className="space-y-3">
                  <Label className="font-medium">Advanced options</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: "startLetter", label: "Start with a letter", key: "startWithLetter" },
                      { id: "avoidSimilar", label: "Avoid look-alikes (O,0,I,l)", key: "avoidSimilar" },
                      {
                        id: "avoidDuplicates",
                        label: "Avoid duplicate characters",
                        key: "avoidDuplicates",
                        // Saying so beats silently generating repeats with the box still ticked
                        hint: duplicatesImpossible
                          ? `No effect: ${config.length} distinct characters do not fit in a set of ${charsetSize}. Shorten the password or add characters.`
                          : undefined,
                      },
                      { id: "avoidSequences", label: "Avoid sequences", key: "avoidSequences" },
                      { id: "autoGenerate", label: "Generate automatically", key: "autoGenerate" },
                    ].map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-2.5 rounded-lg glass-inset glass-hover transition-colors"
                      >
                        <Checkbox
                          id={item.id}
                          checked={config[item.key as keyof PasswordConfig] as boolean}
                          onCheckedChange={(checked) => updateConfig(item.key as keyof PasswordConfig, checked)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={item.id} className="text-sm cursor-pointer">
                            {item.label}
                          </Label>
                          {item.hint ? (
                            <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400 mt-1">
                              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                              <span>{item.hint}</span>
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Generated Passwords */}
          <div className="xl:col-span-2">
            <Card className="glass-panel rounded-2xl overflow-hidden">
              <PanelHeader
                title="Generated passwords"
                meta={`${passwords.length} × ${config.length} characters`}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="glass-inset glass-hover"
                  onClick={() => copyToClipboard(passwords, "all")}
                  disabled={passwords.length === 0}
                >
                  {copied === "all" ? (
                    <Check className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {copied === "all" ? "Copied" : "Copy all"}
                </Button>
                <Button size="sm" onClick={generatePasswords}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </PanelHeader>
              <CardContent className="p-4">
                {passwords.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-sm">Select Generate to create passwords</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {passwords.map((password, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-2 pl-3 pr-1.5 py-1.5 rounded-lg glass-inset glass-hover transition-colors"
                      >
                        <code className="font-mono text-sm flex-1 break-all select-all">
                          <PasswordChars value={password} />
                        </code>
                        <div className="flex gap-0.5 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => regeneratePassword(index)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            aria-label="Regenerate this password"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyToClipboard(password, index)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            aria-label="Copy password"
                          >
                            {copied === index ? (
                              <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
