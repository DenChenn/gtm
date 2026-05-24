import { Skeleton } from '@/components/ui/skeleton'

type Props = {
  imageUrl: string | null
  loading?: boolean
  alt?: string
  className?: string
}

export function MediaPlaceholder({ imageUrl, loading, alt = '', className }: Props) {
  if (loading) {
    return <Skeleton className={`aspect-[3/2] w-full ${className ?? ''}`} />
  }
  if (!imageUrl) {
    return (
      <div
        className={`flex aspect-[3/2] w-full items-center justify-center rounded bg-muted text-sm text-muted-foreground ${className ?? ''}`}
      >
        無圖片
      </div>
    )
  }
  return (
    <img
      src={imageUrl}
      alt={alt}
      className={`aspect-[3/2] w-full rounded object-cover ${className ?? ''}`}
    />
  )
}
