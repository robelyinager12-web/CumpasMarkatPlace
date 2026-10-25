import { ApiClientError } from '@/lib/api-client'
import { API_URL } from '@/lib/constants'
import type { ApiFailure, ApiSuccess } from '@/types/api'
import type { ProductImage } from '@/types/product'

// XMLHttpRequest instead of fetch because fetch cannot report upload progress.
export function uploadProductImage(
  productId: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<ProductImage[]> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_URL}/products/${encodeURIComponent(productId)}/images`)
    xhr.withCredentials = true
    xhr.responseType = 'json'

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () => {
      const body = xhr.response as ApiSuccess<{ images: ProductImage[] }> | ApiFailure | null
      if (xhr.status >= 200 && xhr.status < 300 && body && body.success) {
        resolve(body.data.images)
      } else {
        const error = body && !body.success ? body.error : undefined
        reject(new ApiClientError(xhr.status, error?.code ?? 'UPLOAD_FAILED', error?.message ?? 'Upload failed. Please try again.'))
      }
    }
    xhr.onerror = () =>
      reject(new ApiClientError(0, 'NETWORK_ERROR', 'Network error while uploading. Check your connection.'))

    const form = new FormData()
    form.append('images', file)
    xhr.send(form)
  })
}