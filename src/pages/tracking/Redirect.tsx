import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertCircle, Loader2 } from 'lucide-react'
import {
  recordClickWithTimeout,
  resolveLinkByCode,
  setLastClick,
} from '@/api/tracking'

export default function RedirectPage() {
  const { code } = useParams<{ code: string }>()
  const [error, setError] = useState<string | null>(null)
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    if (!code) {
      setError('連結缺少短碼')
      return
    }

    async function run() {
      try {
        const link = await resolveLinkByCode(code!)
        if (!link) {
          setError('找不到對應的推廣連結')
          return
        }
        setLastClick({
          code: link.code,
          affiliate_link_id: link.id,
          product_id: link.product_id,
          at: Date.now(),
        })
        await recordClickWithTimeout(link, 1000)
        window.location.replace(link.target_url)
      } catch (e) {
        setError((e as Error).message || '發生未知錯誤')
      }
    }

    void run()
  }, [code])

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        {error ? (
          <>
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-lg font-medium">無法導向連結</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <h1 className="text-lg font-medium">正在前往商品頁...</h1>
            <p className="text-sm text-muted-foreground">短碼 {code}</p>
          </>
        )}
      </div>
    </div>
  )
}
