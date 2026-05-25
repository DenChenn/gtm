import { Link, isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'
import { ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppSelector } from '@/store'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const error = useRouteError() as unknown
  const role = useAppSelector((s) => s.auth.role)
  const status = useAppSelector((s) => s.auth.status)

  const homePath =
    status === 'authenticated' ? (role === 'merchant' ? '/merchant' : '/influencer') : '/login'

  const is404 = !error || (isRouteErrorResponse(error) && error.status === 404)
  const title = is404 ? '頁面不存在' : '發生了一些問題'
  const description = is404
    ? '你嘗試前往的網址沒有對應的頁面，可能是連結錯了或頁面已被移除。'
    : '頁面載入時發生未預期的錯誤，請回到首頁再試試。'

  const detail =
    error instanceof Error
      ? error.message
      : isRouteErrorResponse(error)
        ? `${error.status} ${error.statusText}`
        : null

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {detail && (
            <pre className="overflow-auto rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
              {detail}
            </pre>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> 返回上一頁
            </Button>
            <Button asChild>
              <Link to={homePath}>
                <Home className="mr-1.5 h-4 w-4" /> 回首頁
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
