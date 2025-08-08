import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.boltdiy.app',
  appName: 'Bolt.diy',
  webDir: 'build/client',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#1a1a1a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a1a1a',
    },
    Haptics: {},
    Filesystem: {
      iosPaths: {
        data: 'DOCUMENTS',
        cache: 'CACHES',
        external: 'DOCUMENTS'
      },
      androidPaths: {
        data: 'FILES',
        cache: 'CACHE',
        external: 'EXTERNAL_STORAGE'
      }
    },
    CapacitorHttp: {
      enabled: true
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    minWebViewVersion: 80,
    flavor: 'main',
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK',
      signingType: 'apksigner'
    }
  }
};

export default config;