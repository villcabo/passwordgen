"use client"

import { useEffect, useRef, useState } from "react"
import { AlertTriangle, Check, Copy, Moon, RefreshCw, Shield, Sun } from "lucide-react"
import packageJson from "@/package.json"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  viewMode: "detailed" | "export"
}

// RFC 3986 unreserved symbols: safe in connection strings, .env, YAML, SQL and shells
const SAFE_SYMBOLS = "-_.~"
const FULL_SYMBOLS = "!@#$%^&*()-_=+"

// Characters that break common contexts where passwords end up stored or pasted
const UNSAFE_CHARS: Record<string, string> = {
  "@": "connection strings (user:pass@host)",
  ":": "connection strings",
  "/": "URLs y URIs",
  "?": "URLs (query string)",
  "#": "URLs y comentarios en .env/YAML",
  "&": "URLs y shell",
  "=": "archivos .env",
  "%": "URL encoding",
  "'": "literales SQL",
  '"': "SQL, JSON y YAML",
  "\\": "secuencias de escape",
  ";": "separador de sentencias SQL",
  $: "interpolación en shell/.env",
  "`": "interpolación en shell",
  " ": "espacios rompen parsers",
  "+": "URL encoding (se decodifica como espacio)",
}

const MIN_LENGTH = 6
const MAX_LENGTH = 64

const PRESETS = [
  { label: "Débil", length: 8 },
  { label: "Fuerte", length: 16 },
  { label: "Súper fuerte", length: 24 },
  { label: "Extrema", length: 32 },
]

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
  viewMode: "detailed",
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

// macOS window chrome: traffic lights + centered title bar
function WindowBar({ title }: { title: string }) {
  return (
    <div className="relative flex items-center px-4 py-2.5 border-b border-black/[0.06] dark:border-white/[0.06]">
      <div className="flex gap-2" aria-hidden="true">
        <span className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-[inset_0_0_1px_rgba(0,0,0,0.25)]" />
        <span className="w-3 h-3 rounded-full bg-[#febc2e] shadow-[inset_0_0_1px_rgba(0,0,0,0.25)]" />
        <span className="w-3 h-3 rounded-full bg-[#28c840] shadow-[inset_0_0_1px_rgba(0,0,0,0.25)]" />
      </div>
      <span className="absolute left-1/2 -translate-x-1/2 text-xs font-medium text-muted-foreground">{title}</span>
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
  const [lengthText, setLengthText] = useState(String(defaultConfig.length))
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

  // Auto-generate passwords when config changes (if enabled)
  useEffect(() => {
    if (config.autoGenerate && mounted) {
      generatePasswords()
    }
  }, [config, mounted])

  // Keep the numeric input in sync with slider/preset changes
  useEffect(() => {
    setLengthText(String(config.length))
  }, [config.length])

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  const updateConfig = (key: keyof PasswordConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleLengthText = (raw: string) => {
    setLengthText(raw)
    const parsed = Number.parseInt(raw, 10)
    if (!Number.isNaN(parsed) && parsed >= MIN_LENGTH && parsed <= MAX_LENGTH) {
      updateConfig("length", parsed)
    }
  }

  const commitLengthText = () => {
    const parsed = Number.parseInt(lengthText, 10)
    if (Number.isNaN(parsed)) {
      setLengthText(String(config.length))
      return
    }
    const clamped = Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, parsed))
    setLengthText(String(clamped))
    updateConfig("length", clamped)
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

  const hasDuplicates = (password: string): boolean => {
    return new Set(password).size !== password.length
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

    let attempts = 0
    const maxAttempts = 1000

    while (attempts < maxAttempts) {
      let password = ""
      let remainingLength = config.length

      const requiredChars: string[] = []

      if (config.startWithLetter && letterSet) {
        requiredChars.push(letterSet[randomInt(letterSet.length)])
        remainingLength--
      }

      const lowercaseSet = config.includeLowercase ? filterSimilar("abcdefghijklmnopqrstuvwxyz") : ""
      const uppercaseSet = config.includeUppercase ? filterSimilar("ABCDEFGHIJKLMNOPQRSTUVWXYZ") : ""
      const numberSet = config.includeNumbers ? filterSimilar("0123456789") : ""
      const specialSet = config.customCharacters.trim() ? filterSimilar(config.customCharacters) : ""

      if (lowercaseSet && remainingLength > 0) {
        if (!config.startWithLetter || !/[a-z]/.test(requiredChars.join(""))) {
          requiredChars.push(lowercaseSet[randomInt(lowercaseSet.length)])
          remainingLength--
        }
      }

      if (uppercaseSet && remainingLength > 0) {
        if (!config.startWithLetter || !/[A-Z]/.test(requiredChars.join(""))) {
          requiredChars.push(uppercaseSet[randomInt(uppercaseSet.length)])
          remainingLength--
        }
      }

      if (numberSet && remainingLength > 0) {
        requiredChars.push(numberSet[randomInt(numberSet.length)])
        remainingLength--
      }

      if (specialSet && remainingLength > 0) {
        requiredChars.push(specialSet[randomInt(specialSet.length)])
        remainingLength--
      }

      const randomChars: string[] = []
      for (let i = 0; i < remainingLength; i++) {
        randomChars.push(charset[randomInt(charset.length)])
      }

      const allChars = [...requiredChars, ...randomChars]

      if (config.startWithLetter && allChars.length > 0) {
        const firstChar = allChars[0]
        const restChars = allChars.slice(1)

        for (let i = restChars.length - 1; i > 0; i--) {
          const j = randomInt(i + 1)
          ;[restChars[i], restChars[j]] = [restChars[j], restChars[i]]
        }

        password = firstChar + restChars.join("")
      } else {
        for (let i = allChars.length - 1; i > 0; i--) {
          const j = randomInt(i + 1)
          ;[allChars[i], allChars[j]] = [allChars[j], allChars[i]]
        }
        password = allChars.join("")
      }

      let isValid = true

      if (config.avoidDuplicates && hasDuplicates(password)) {
        isValid = false
      }

      if (config.avoidSequences && hasSequence(password)) {
        isValid = false
      }

      if (isValid) {
        return password
      }

      attempts++
    }

    let fallback = ""
    if (config.startWithLetter && letterSet) {
      fallback += letterSet[randomInt(letterSet.length)]
    }

    const remainingLength = config.length - fallback.length
    for (let i = 0; i < remainingLength; i++) {
      fallback += charset[randomInt(charset.length)]
    }

    return fallback
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
        title: "Error",
        description: "No se pudo copiar la contraseña",
        variant: "destructive",
      })
    }
  }

  // Entropy-based strength: length × log2(charset size)
  const charsetSize = getCharacterSet().length
  const entropy = charsetSize > 0 ? Math.round(config.length * Math.log2(charsetSize)) : 0
  // Thresholds aligned with the length presets over the full charset:
  // 8 chars ≈ 47 bits (Débil), 16 ≈ 95 (Fuerte), 24+ ≈ 142 (Excelente)
  const strength =
    entropy < 50
      ? { label: "Débil", bar: "bg-red-500", text: "text-red-600 dark:text-red-400" }
      : entropy < 80
        ? { label: "Aceptable", bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" }
        : entropy < 110
          ? { label: "Fuerte", bar: "bg-green-500", text: "text-green-600 dark:text-green-400" }
          : { label: "Excelente", bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" }

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
          <Button onClick={toggleTheme} variant="ghost" size="icon">
            {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Cambiar tema</span>
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="xl:col-span-1">
            <Card className="glass-panel rounded-2xl overflow-hidden">
              <WindowBar title="Configuración" />
              <CardHeader className="pb-4">
                <CardDescription>Personaliza tu generador de contraseñas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Length */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Longitud de contraseña</Label>
                    <span className={`text-xs font-medium ${strength.text}`}>
                      {strength.label} · {entropy} bits
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {PRESETS.map((preset) => (
                      <Button
                        key={preset.label}
                        variant={config.length === preset.length ? "default" : "outline"}
                        size="sm"
                        className={`h-7 px-2.5 text-xs ${config.length === preset.length ? "" : "glass-inset glass-hover"}`}
                        onClick={() => updateConfig("length", preset.length)}
                      >
                        {preset.label} · {preset.length}
                      </Button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <Slider
                      value={[config.length]}
                      onValueChange={(value) => updateConfig("length", value[0])}
                      max={MAX_LENGTH}
                      min={MIN_LENGTH}
                      step={1}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={MIN_LENGTH}
                      max={MAX_LENGTH}
                      value={lengthText}
                      onChange={(e) => handleLengthText(e.target.value)}
                      onBlur={commitLengthText}
                      onKeyDown={(e) => e.key === "Enter" && commitLengthText()}
                      className="w-20 h-9 text-center font-mono bg-white/50 dark:bg-white/[0.06]"
                      aria-label="Longitud de contraseña"
                    />
                  </div>

                  <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${strength.bar}`}
                      style={{ width: `${Math.min(100, (entropy / 128) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <Label className="font-medium">Cantidad de contraseñas</Label>
                  <Select
                    value={config.quantity.toString()}
                    onValueChange={(value) => updateConfig("quantity", Number.parseInt(value))}
                  >
                    <SelectTrigger className="bg-white/50 dark:bg-white/[0.06]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Character Options */}
                <div className="space-y-3">
                  <Label className="font-medium">Incluir caracteres</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: "numbers", label: "Números (0-9)", key: "includeNumbers" },
                      { id: "lowercase", label: "Minúsculas (a-z)", key: "includeLowercase" },
                      { id: "uppercase", label: "Mayúsculas (A-Z)", key: "includeUppercase" },
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
                    Caracteres especiales adicionales
                  </Label>
                  <div className="flex gap-1.5">
                    <Button
                      variant={config.customCharacters === SAFE_SYMBOLS ? "default" : "outline"}
                      size="sm"
                      className={`h-7 px-2.5 text-xs ${config.customCharacters === SAFE_SYMBOLS ? "" : "glass-inset glass-hover"}`}
                      onClick={() => updateConfig("customCharacters", SAFE_SYMBOLS)}
                    >
                      Seguro BD/URLs
                    </Button>
                    <Button
                      variant={config.customCharacters === FULL_SYMBOLS ? "default" : "outline"}
                      size="sm"
                      className={`h-7 px-2.5 text-xs ${config.customCharacters === FULL_SYMBOLS ? "" : "glass-inset glass-hover"}`}
                      onClick={() => updateConfig("customCharacters", FULL_SYMBOLS)}
                    >
                      Completo
                    </Button>
                  </div>
                  <Input
                    id="customChars"
                    value={config.customCharacters}
                    onChange={(e) => updateConfig("customCharacters", e.target.value)}
                    placeholder="Ej: -_.~"
                    className="text-center font-mono bg-white/50 dark:bg-white/[0.06]"
                  />
                  {unsafeUsed.length > 0 ? (
                    <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md p-2.5">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <div className="space-y-0.5">
                        {unsafeUsed.map((char) => (
                          <p key={char}>
                            <code className="font-mono font-semibold">{char === " " ? "espacio" : char}</code> puede
                            causar problemas en {UNSAFE_CHARS[char]}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Los caracteres seguros (-_.~) funcionan en connection strings, .env, SQL y shells
                    </p>
                  )}
                </div>

                <Separator />

                {/* Advanced Options */}
                <div className="space-y-3">
                  <Label className="font-medium">Opciones avanzadas</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: "startLetter", label: "Iniciar con letra", key: "startWithLetter" },
                      { id: "avoidSimilar", label: "Evitar similares (O,0,I,l)", key: "avoidSimilar" },
                      { id: "avoidDuplicates", label: "Evitar duplicados", key: "avoidDuplicates" },
                      { id: "avoidSequences", label: "Evitar secuencias", key: "avoidSequences" },
                      { id: "autoGenerate", label: "Generación automática", key: "autoGenerate" },
                    ].map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-3 p-2.5 rounded-lg glass-inset glass-hover transition-colors"
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
              </CardContent>
            </Card>
          </div>

          {/* Generated Passwords */}
          <div className="xl:col-span-2">
            <Card className="glass-panel rounded-2xl overflow-hidden">
              <WindowBar title="Contraseñas generadas" />
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardDescription>
                    {passwords.length} contraseña{passwords.length !== 1 ? "s" : ""} de {config.length} caracteres
                  </CardDescription>
                  <Button onClick={generatePasswords}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {passwords.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Haz clic en "Generar" para crear contraseñas</p>
                  </div>
                ) : (
                  <Tabs
                    defaultValue="detailed"
                    value={config.viewMode}
                    onValueChange={(v) => updateConfig("viewMode", v as "detailed" | "export")}
                  >
                    <TabsList className="grid w-full grid-cols-2 mb-4 glass-inset">
                      <TabsTrigger value="detailed">Vista detallada</TabsTrigger>
                      <TabsTrigger value="export">Vista para exportar</TabsTrigger>
                    </TabsList>

                    <TabsContent value="detailed" className="space-y-2">
                      {passwords.map((password, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-2 px-4 py-2 rounded-lg glass-inset glass-hover transition-colors group"
                        >
                          <code className="font-mono text-sm flex-1 break-all select-all">
                            <PasswordChars value={password} />
                          </code>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => regeneratePassword(index)}
                              className="opacity-50 group-hover:opacity-100 transition-opacity"
                              aria-label="Regenerar esta contraseña"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(password, index)}
                              className="opacity-50 group-hover:opacity-100 transition-opacity"
                              aria-label="Copiar contraseña"
                            >
                              {copied === index ? (
                                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="export">
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg glass-inset">
                          <pre className="font-mono text-sm whitespace-pre-wrap break-all max-h-[500px] overflow-y-auto">
                            {passwords.join("\n")}
                          </pre>
                        </div>
                        <Button onClick={() => copyToClipboard(passwords, "all")} className="w-full">
                          {copied === "all" ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Copiadas
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copiar todas las contraseñas
                            </>
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
