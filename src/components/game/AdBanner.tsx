import { useEffect } from 'react'
import { showBannerAd, hideBannerAd } from '../../services/AdRewardEngine'
import { useWalletStore } from '../../store/walletStore'

interface Props {
  /** When true the banner is shown; hidden otherwise. */
  visible: boolean
}

/**
 * Native AdMob bottom banner. Renders nothing in the DOM — it drives the
 * native banner overlay via Capacitor. No-op on web/PWA. Users who bought
 * "no ads" never see it.
 */
export function AdBanner({ visible }: Props) {
  const hasNoAds = useWalletStore(s => s.hasNoAds)

  useEffect(() => {
    if (visible && !hasNoAds) {
      showBannerAd()
    } else {
      hideBannerAd()
    }
    return () => { hideBannerAd() }
  }, [visible, hasNoAds])

  return null
}
