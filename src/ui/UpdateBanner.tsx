import { useRegisterSW } from "virtual:pwa-register/react"

export default function UpdateBanner() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()
  if (!needRefresh) return null
  return (
    <div className="banner banner-info update-banner">
      Update available
      <button className="link-btn" onClick={() => updateServiceWorker(true)}>Reload</button>
    </div>
  )
}
