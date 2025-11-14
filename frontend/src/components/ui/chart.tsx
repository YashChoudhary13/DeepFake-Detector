"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: RechartsPrimitive.ResponsiveContainerProps["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  // Build styles without inlined optional chaining that confuses the parser
  const css = Object.entries(THEMES)
    .map(([theme, prefix]) => {
      const rules = colorConfig
        .map(([key, itemConfig]) => {
          const itemAny = itemConfig as any
          const themeColor =
            itemAny.theme && (itemAny.theme as Record<string, string>)[theme]
          const color = themeColor || itemAny.color
          return color ? `  --color-${key}: ${color};` : null
        })
        .filter(Boolean)
        .join("\n")

      return `${prefix} [data-chart=${id}] {\n${rules}\n}`
    })
    .join("\n")

  return <style dangerouslySetInnerHTML={{ __html: css }} />
}

/* Recharts components exported as-is for convenience */
const ChartTooltip = RechartsPrimitive.Tooltip

type ChartTooltipContentProps = RechartsPrimitive.TooltipProps<any, any> &
  React.ComponentProps<"div"> & {
    // runtime fields from Recharts tooltip items — treat as flexible runtime shapes
    payload?: any[] | undefined
    label?: React.ReactNode | undefined

    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "line" | "dot" | "dashed"
    nameKey?: string
    labelKey?: string
  }


const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    // Recharts payloads are dynamic; normalize to an array of any
    const payloadArr: any[] = Array.isArray(payload) ? (payload as any[]) : []

    // --- inside ChartTooltipContent, replace usage around payloadArr with this block ---
    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payloadArr.length) return null

      const [item] = payloadArr
      const itemAny = item as any
      const key = `${labelKey || (itemAny?.dataKey ?? itemAny?.name) || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, itemAny, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value as any, payloadArr)}
          </div>
        )
      }

      if (!value) return null
      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey])


    if (!active || !payloadArr.length) {
      return null
    }

    const nestLabel = payloadArr.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payloadArr.map((item: any, index: number) => {
            const itemAny = item as any
            const key = `${nameKey || itemAny.name || itemAny.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, itemAny, key)
            const indicatorColor = color || itemAny.payload?.fill || itemAny.color

            // produce indicator classes without passing an object to `cn`
            const indicatorClass =
              indicator === "dot"
                ? "h-2.5 w-2.5"
                : indicator === "line"
                ? "w-1"
                : "w-0 border-[1.5px] border-dashed bg-transparent"
            const extraClass = nestLabel && indicator === "dashed" ? "my-0.5" : ""

            return (
              <div key={itemAny.dataKey ?? index} className={cn(/* ... */)}>
                {formatter && itemAny?.value !== undefined && itemAny.name ? (
                  formatter(itemAny.value, itemAny.name, itemAny, index, itemAny.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn("shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]", indicatorClass, extraClass)}
                          style={{ "--color-bg": indicatorColor, "--color-border": indicatorColor } as React.CSSProperties}
                        />
                      )
                    )}
                    <div className={cn("flex flex-1 justify-between leading-none", nestLabel ? "items-end" : "items-center")}>
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || itemAny.name}
                        </span>
                      </div>
                      {itemAny.value !== undefined && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {typeof itemAny.value === "number" ? itemAny.value.toLocaleString() : String(itemAny.value)}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend = RechartsPrimitive.Legend

// --- Replace the old ChartLegendContentProps and ChartLegendContent with this ---

type ChartLegendContentProps = React.ComponentProps<"div"> & {
  // Recharts' legend `payload` is dynamic — treat as any[] at runtime
  payload?: any[] | undefined
  // verticalAlign exists on LegendProps; reuse its type if available
  verticalAlign?: RechartsPrimitive.LegendProps["verticalAlign"]
  hideIcon?: boolean
  nameKey?: string
}

const ChartLegendContent = React.forwardRef<HTMLDivElement, ChartLegendContentProps>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart()

    const payloadArr: any[] = Array.isArray(payload) ? payload : []

    if (!payloadArr.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payloadArr.map((item: any) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegend"


// Helper to extract item config from a payload.
// Note: payload shapes from Recharts are dynamic; we accept `any` here and
// safely attempt to read properties. This prevents TS errors while still
// allowing `ChartConfig` lookups by name/dataKey.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: any, // <- change here
  key: string
) {
  if (typeof payload !== "object" || payload === null) return undefined

  const p = payload as any
  const payloadPayload =
    p && typeof p.payload === "object" && p.payload !== null ? p.payload : undefined

  let configLabelKey: string = key

  if (p && key in p && typeof p[key] === "string") {
    configLabelKey = p[key] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key] === "string"
  ) {
    configLabelKey = payloadPayload[key] as string
  }

  return (config as any)[configLabelKey] ?? (config as any)[key]
}


export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
