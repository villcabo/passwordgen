"use client"

import { useState, useEffect } from "react"
import { Copy, RefreshCw, Settings, Shield, ShieldAlert, Moon, Sun, Laptop } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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

const defaultConfig: PasswordConfig = {
  length: 16,
  includeNumbers: true,
  includeLowercase: true,
  includeUppercase: true,
  startWithLetter: false,
  avoidSimilar: false,
  avoidDuplicates: false,
  avoidSequences: false,
  customCharacters: "!@#$%^&*()_+-=[]{}|;:,.<>?",
  autoGenerate: true,
  quantity: 5,
  viewMode: "detailed",
}

const similarCharacters = "O0Il1"
const sequences = [
  "abc",
  "bcd",
  "cde",
  "def",
  "efg",
  "fgh",
  "ghi",
  "hij",
  "ijk",
  "jkl",
  "klm",
  "lmn",
  "mno",
  "nop",
  "opq",
  "pqr",
  "qrs",
  "rst",
  "stu",
  "tuv",
  "uvw",
  "vwx",
  "wxy",
  "xyz",
  "123",
  "234",
  "345",
  "456",
  "567",
  "678",
  "789",
  "890",
  "qwe",
  "wer",
  "ert",
  "rty",
  "tyu",
  "yui",
  "uio",
  "iop",
  "asd",
  "sdf",
  "dfg",
  "fgh",
  "ghj",
  "hjk",
  "jkl",
  "zxc",
  "xcv",
  "cvb",
  "vbn",
  "bnm",
]

export default function PasswordGenerator() {
  const [config, setConfig] = useState<PasswordConfig>(defaultConfig)
  const [passwords, setPasswords] = useState<string[]>([])
  const { toast } = useToast()
  const { setTheme, theme } = useTheme()

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem("passwordGeneratorConfig")
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig)
      setConfig({ ...defaultConfig, ...parsed })
    }
  }, [])

  // Save config to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("passwordGeneratorConfig", JSON.stringify(config))
  }, [config])

  // Auto-generate passwords when config changes (if enabled)
  useEffect(() => {
    if (config.autoGenerate) {
      generatePasswords()
    }
  }, [config])

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

  const hasDuplicates = (password: string): boolean => {
    return new Set(password).size !== password.length
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
        const letterChar = letterSet[Math.floor(Math.random() * letterSet.length)]
        requiredChars.push(letterChar)
        remainingLength--
      }

      let lowercaseSet = ""
      let uppercaseSet = ""
      let numberSet = ""
      let specialSet = ""

      if (config.includeLowercase) {
        lowercaseSet = "abcdefghijklmnopqrstuvwxyz"
        if (config.avoidSimilar) {
          lowercaseSet = lowercaseSet
            .split("")
            .filter((char) => !similarCharacters.includes(char))
            .join("")
        }
      }

      if (config.includeUppercase) {
        uppercaseSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        if (config.avoidSimilar) {
          uppercaseSet = uppercaseSet
            .split("")
            .filter((char) => !similarCharacters.includes(char))
            .join("")
        }
      }

      if (config.includeNumbers) {
        numberSet = "0123456789"
        if (config.avoidSimilar) {
          numberSet = numberSet
            .split("")
            .filter((char) => !similarCharacters.includes(char))
            .join("")
        }
      }

      if (config.customCharacters.trim()) {
        specialSet = config.customCharacters
        if (config.avoidSimilar) {
          specialSet = specialSet
            .split("")
            .filter((char) => !similarCharacters.includes(char))
            .join("")
        }
      }

      if (config.includeLowercase && lowercaseSet && remainingLength > 0) {
        if (!config.startWithLetter || !/[a-z]/.test(requiredChars.join(""))) {
          const char = lowercaseSet[Math.floor(Math.random() * lowercaseSet.length)]
          requiredChars.push(char)
          remainingLength--
        }
      }

      if (config.includeUppercase && uppercaseSet && remainingLength > 0) {
        if (!config.startWithLetter || !/[A-Z]/.test(requiredChars.join(""))) {
          const char = uppercaseSet[Math.floor(Math.random() * uppercaseSet.length)]
          requiredChars.push(char)
          remainingLength--
        }
      }

      if (config.includeNumbers && numberSet && remainingLength > 0) {
        const char = numberSet[Math.floor(Math.random() * numberSet.length)]
        requiredChars.push(char)
        remainingLength--
      }

      if (config.customCharacters.trim() && specialSet && remainingLength > 0) {
        const char = specialSet[Math.floor(Math.random() * specialSet.length)]
        requiredChars.push(char)
        remainingLength--
      }

      const randomChars: string[] = []
      for (let i = 0; i < remainingLength; i++) {
        randomChars.push(charset[Math.floor(Math.random() * charset.length)])
      }

      const allChars = [...requiredChars, ...randomChars]

      if (config.startWithLetter && allChars.length > 0) {
        const firstChar = allChars[0]
        const restChars = allChars.slice(1)

        for (let i = restChars.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[restChars[i], restChars[j]] = [restChars[j], restChars[i]]
        }

        password = firstChar + restChars.join("")
      } else {
        for (let i = allChars.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
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
      fallback += letterSet[Math.floor(Math.random() * letterSet.length)]
    }

    const remainingLength = config.length - fallback.length
    for (let i = 0; i < remainingLength; i++) {
      fallback += charset[Math.floor(Math.random() * charset.length)]
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

  const copyToClipboard = async (password: string | string[]) => {
    try {
      let textToCopy = ""

      if (Array.isArray(password)) {
        textToCopy = password.join("\n")
      } else {
        textToCopy = password
      }

      await navigator.clipboard.writeText(textToCopy)
      toast({
        title: "¡Copiado!",
        description: Array.isArray(password)
          ? "Todas las contraseñas copiadas al portapapeles"
          : "Contraseña copiada al portapapeles",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo copiar la contraseña",
        variant: "destructive",
      })
    }
  }

  const getStrengthBadge = () => {
    const isStrong = config.length >= 16
    return (
      <Badge
        variant={isStrong ? "default" : "secondary"}
        className={`ml-2 transition-all duration-200 ${
          isStrong ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-amber-500 hover:bg-amber-600 text-white"
        }`}
      >
        {isStrong ? (
          <>
            <Shield className="w-3 h-3 mr-1" />
            Strong
          </>
        ) : (
          <>
            <ShieldAlert className="w-3 h-3 mr-1" />
            Weak
          </>
        )}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 backdrop-blur-sm">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Password Generator
            </h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Laptop className="mr-2 h-4 w-4" />
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Genera contraseñas seguras y personalizadas con algoritmos avanzados de seguridad
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="xl:col-span-1">
            <Card className="backdrop-blur-sm bg-card/95 border-border/50 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl">
                  <Settings className="w-5 h-5 mr-3 text-primary" />
                  Configuración
                </CardTitle>
                <CardDescription className="text-base">Personaliza tu generador de contraseñas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Length Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Longitud de contraseña</Label>
                    {getStrengthBadge()}
                  </div>
                  <div className="space-y-3">
                    <Slider
                      value={[config.length]}
                      onValueChange={(value) => updateConfig("length", value[0])}
                      max={50}
                      min={6}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>6 caracteres</span>
                      <span className="font-mono text-lg font-semibold text-foreground">{config.length}</span>
                      <span>50 caracteres</span>
                    </div>
                  </div>
                </div>

                {/* Quantity */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Cantidad de contraseñas</Label>
                  <Select
                    value={config.quantity.toString()}
                    onValueChange={(value) => updateConfig("quantity", Number.parseInt(value))}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} contraseña{num > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="my-6" />

                {/* Character Options */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Incluir caracteres</Label>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { id: "numbers", label: "Números (0-9)", key: "includeNumbers" },
                      { id: "lowercase", label: "Minúsculas (a-z)", key: "includeLowercase" },
                      { id: "uppercase", label: "Mayúsculas (A-Z)", key: "includeUppercase" },
                    ].map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={item.id}
                          checked={config[item.key as keyof PasswordConfig] as boolean}
                          onCheckedChange={(checked) => updateConfig(item.key, checked)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label htmlFor={item.id} className="text-sm font-medium cursor-pointer flex-1">
                          {item.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Advanced Options */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Opciones avanzadas</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: "startLetter", label: "Iniciar con letra", key: "startWithLetter" },
                      { id: "avoidSimilar", label: "Evitar similares (O,0,I,l)", key: "avoidSimilar" },
                      { id: "avoidDuplicates", label: "Evitar duplicados", key: "avoidDuplicates" },
                      { id: "avoidSequences", label: "Evitar secuencias", key: "avoidSequences" },
                      { id: "autoGenerate", label: "Generación automática", key: "autoGenerate" },
                    ].map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/30 transition-colors"
                      >
                        <Checkbox
                          id={item.id}
                          checked={config[item.key as keyof PasswordConfig] as boolean}
                          onCheckedChange={(checked) => updateConfig(item.key, checked)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label htmlFor={item.id} className="text-sm cursor-pointer flex-1">
                          {item.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Custom Characters */}
                <div className="space-y-3">
                  <Label htmlFor="customChars" className="text-base font-medium">
                    Caracteres especiales adicionales
                  </Label>
                  <Input
                    id="customChars"
                    value={config.customCharacters}
                    onChange={(e) => updateConfig("customCharacters", e.target.value)}
                    placeholder="Ej: !@#$%^&*()..."
                    className="h-12 font-mono"
                  />
                  <p className="text-sm text-muted-foreground">
                    Caracteres adicionales que se combinarán con las opciones seleccionadas arriba
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Generated Passwords */}
          <div className="xl:col-span-2">
            <Card className="backdrop-blur-sm bg-card/95 border-border/50 shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Contraseñas Generadas</CardTitle>
                    <CardDescription className="text-base">
                      {passwords.length} contraseña{passwords.length !== 1 ? "s" : ""} de {config.length} caracteres
                    </CardDescription>
                  </div>
                  <Button onClick={generatePasswords} size="lg" className="h-12 px-6">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {passwords.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <div className="p-4 rounded-full bg-muted/30 w-fit mx-auto mb-6">
                      <Shield className="w-16 h-16 opacity-50" />
                    </div>
                    <p className="text-lg">Haz clic en "Generar" para crear contraseñas</p>
                  </div>
                ) : (
                  <Tabs
                    defaultValue="detailed"
                    value={config.viewMode}
                    onValueChange={(v) => updateConfig("viewMode", v as "detailed" | "export")}
                  >
                    <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                      <TabsTrigger value="detailed" className="text-base">
                        Vista Detallada
                      </TabsTrigger>
                      <TabsTrigger value="export" className="text-base">
                        Vista para Exportar
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="detailed" className="space-y-4">
                      {passwords.map((password, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border hover:bg-muted/50 transition-all duration-200 group"
                        >
                          <code className="font-mono text-base flex-1 mr-4 break-all select-all">{password}</code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(password)}
                            className="shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="export">
                      <div className="space-y-6">
                        <div className="p-6 bg-muted/30 rounded-xl border">
                          <pre className="font-mono text-sm whitespace-pre-wrap break-all max-h-[500px] overflow-y-auto">
                            {passwords.join("\n")}
                          </pre>
                        </div>
                        <Button onClick={() => copyToClipboard(passwords)} className="w-full h-12 text-base">
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar todas las contraseñas
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
