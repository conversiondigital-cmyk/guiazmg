"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface FormFieldOption {
  value: string
  label: string
}

interface FormFieldProps {
  label: string
  name: string
  type?: "text" | "email" | "password" | "number" | "textarea" | "select" | "checkbox" | "date" | "datetime"
  value: unknown
  onChange: (value: unknown) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options?: FormFieldOption[]
  help?: string
  error?: string
  className?: string
}

export function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  options = [],
  help,
  error,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name} className="font-medium text-gray-700">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </Label>

      {type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          value={String(value || "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500"
          )}
        />
      ) : type === "select" ? (
        <Select value={String(value || "")} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className={error ? "border-red-500" : ""}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : type === "checkbox" ? (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            id={name}
            name={name}
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="w-4 h-4 rounded border-gray-300 cursor-pointer"
          />
          <span className="text-sm text-gray-700">{placeholder || label}</span>
        </label>
      ) : (
        <Input
          id={name}
          name={name}
          type={type}
          value={String(value || "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={cn(
            error && "border-red-500 focus-visible:ring-red-500"
          )}
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {help && !error && <p className="text-sm text-gray-500">{help}</p>}
    </div>
  )
}
