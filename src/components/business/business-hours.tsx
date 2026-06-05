"use client"

import { useState } from "react"
import { Clock, ChevronDownIcon, ChevronUpIcon } from "@/lib/icons"
import { getStatus, getHoursSummary } from "@/lib/hours"
import type { BusinessHour } from "@/types"

interface BusinessHoursProps {
  hours: BusinessHour[]
}

export function BusinessHours({ hours }: BusinessHoursProps) {
  const [expanded, setExpanded] = useState(false)
  const status = getStatus(hours as any)
  const summary = getHoursSummary(hours as any)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">Horarios</span>
          <span
            className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
              status.open
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {status.open ? "Abierto" : "Cerrado"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{summary.today}</span>
          {expanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-1.5 border-t pt-4">
          {summary.full.map((line, i) => {
            const isToday = i === new Date().getDay()
            return (
              <div
                key={i}
                className={`flex justify-between text-sm ${
                  isToday ? "font-medium text-gray-900" : "text-gray-500"
                }`}
              >
                <span>{line.split(":")[0]}</span>
                <span>{line.split(":").slice(1).join(":")}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
