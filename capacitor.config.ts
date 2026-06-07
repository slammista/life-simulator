import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.lifesim2d.app',
  appName: 'Life Simulator 2D',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Allow navigation to Supabase for auth — remove if using only localStorage
    allowNavigation: ['joxlweyrhopeqllkftrm.supabase.co'],
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      splashFullScreen: true,
      splashImmersive: true,
      backgroundColor: '#1a1a2e',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a1a2e',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
  },
  android: {
    buildOptions: {
      releaseType: 'AAB',
    },
  },
  ios: {
    contentInset: 'always',
    scrollEnabled: false,
  },
}

export default config
