import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export type TrendPoint = { date: string; value: number }

type Props = {
  title: string
  data: TrendPoint[]
  emptyMessage?: string
  height?: number
  accent?: 'purple' | 'blue' | 'green'
}

const ACCENT_TO_VAR: Record<NonNullable<Props['accent']>, string> = {
  purple: 'var(--chart-1)',
  blue: 'var(--chart-2)',
  green: 'var(--chart-3)',
}

export function TrendChart({
  title,
  data,
  emptyMessage = '尚無資料',
  height = 260,
  accent = 'purple',
}: Props) {
  const stroke = `hsl(${ACCENT_TO_VAR[accent]})`
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div
            className="empty-glow flex items-center justify-center rounded-xl text-sm text-muted-foreground"
            style={{ height }}
          >
            {emptyMessage}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`trend-gradient-${accent}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 12,
                  fontSize: 12,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                }}
                labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                strokeWidth={2.5}
                dot={false}
                stroke={stroke}
                fill={`url(#trend-gradient-${accent})`}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
