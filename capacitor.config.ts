import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.517ad19e81ee4c3f8bc2399c7e94180f',
  appName: 'fleet-harmony-alert',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: "https://517ad19e-81ee-4c3f-8bc2-399c7e94180f.lovableproject.com?forceHideBadge=true",
    cleartext: true
  }
};

export default config;