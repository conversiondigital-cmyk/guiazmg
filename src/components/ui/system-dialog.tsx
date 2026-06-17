"use client"

import { useEffect, useRef, useState } from "react"
import {
  AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription,
  AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/**
 * Diálogos del sistema (no del navegador). Reemplazan a window.confirm /
 * window.prompt con componentes propios. Uso imperativo:
 *
 *   if (!(await confirmDialog("¿Eliminar?"))) return
 *   const url = await promptDialog({ title: "URL", defaultValue: "https://" })
 *
 * Requiere <SystemDialogHost /> montado una vez en el layout raíz.
 */

type ConfirmOptions = {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
}
type PromptOptions = {
  title?: string
  label?: string
  placeholder?: string
  defaultValue?: string
  confirmText?: string
  cancelText?: string
}

type ConfirmReq = Required<Omit<ConfirmOptions, "description">> & {
  kind: "confirm"
  description?: string
  resolve: (v: boolean) => void
}
type PromptReq = Required<Omit<PromptOptions, "label" | "placeholder">> & {
  kind: "prompt"
  label?: string
  placeholder?: string
  resolve: (v: string | null) => void
}
type Req = ConfirmReq | PromptReq

let emit: ((req: Req) => void) | null = null

export function confirmDialog(options: string | ConfirmOptions): Promise<boolean> {
  const o = typeof options === "string" ? { description: options } : options
  return new Promise<boolean>((resolve) => {
    const req: ConfirmReq = {
      kind: "confirm",
      title: o.title ?? "¿Confirmar acción?",
      description: o.description,
      confirmText: o.confirmText ?? "Confirmar",
      cancelText: o.cancelText ?? "Cancelar",
      destructive: o.destructive ?? false,
      resolve,
    }
    if (emit) emit(req)
    else resolve(false)
  })
}

export function promptDialog(options: string | PromptOptions): Promise<string | null> {
  const o = typeof options === "string" ? { title: options } : options
  return new Promise<string | null>((resolve) => {
    const req: PromptReq = {
      kind: "prompt",
      title: o.title ?? "Introduce un valor",
      label: o.label,
      placeholder: o.placeholder,
      defaultValue: o.defaultValue ?? "",
      confirmText: o.confirmText ?? "Aceptar",
      cancelText: o.cancelText ?? "Cancelar",
      resolve,
    }
    if (emit) emit(req)
    else resolve(null)
  })
}

export function SystemDialogHost() {
  const [req, setReq] = useState<Req | null>(null)
  const [value, setValue] = useState("")
  const resolverRef = useRef<((v: boolean | string | null) => void) | null>(null)

  useEffect(() => {
    emit = (r) => {
      resolverRef.current = r.resolve as (v: boolean | string | null) => void
      if (r.kind === "prompt") setValue(r.defaultValue)
      setReq(r)
    }
    return () => {
      emit = null
    }
  }, [])

  // El resolve es idempotente (la promesa solo se cumple una vez), así que es
  // seguro llamar finish() desde onClick y desde onOpenChange.
  const finish = (result: boolean | string | null) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setReq(null)
  }

  const confirmReq = req?.kind === "confirm" ? req : null
  const promptReq = req?.kind === "prompt" ? req : null

  return (
    <>
      <AlertDialog open={!!confirmReq} onOpenChange={(o) => { if (!o) finish(false) }}>
        <AlertDialogContent>
          <AlertDialogTitle>{confirmReq?.title ?? ""}</AlertDialogTitle>
          {confirmReq?.description ? (
            <AlertDialogDescription>{confirmReq.description}</AlertDialogDescription>
          ) : null}
          <div className="flex justify-end gap-3">
            <AlertDialogCancel onClick={() => finish(false)}>
              {confirmReq?.cancelText ?? "Cancelar"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => finish(true)}
              className={confirmReq?.destructive ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {confirmReq?.confirmText ?? "Confirmar"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!promptReq} onOpenChange={(o) => { if (!o) finish(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{promptReq?.title ?? ""}</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="grid gap-2 py-2">
            {promptReq?.label ? <Label htmlFor="system-prompt-input">{promptReq.label}</Label> : null}
            <Input
              id="system-prompt-input"
              value={value}
              placeholder={promptReq?.placeholder}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") finish(value) }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => finish(null)}>
              {promptReq?.cancelText ?? "Cancelar"}
            </Button>
            <Button onClick={() => finish(value)}>{promptReq?.confirmText ?? "Aceptar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
