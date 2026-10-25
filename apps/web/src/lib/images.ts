// Cloudinary can resize and compress on the fly, which keeps pages light on slow connections.
export function thumbUrl(url: string, width = 480) {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url
  return url.replace('/upload/', `/upload/w_${width},c_limit,q_auto,f_auto/`)
}