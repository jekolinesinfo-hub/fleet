import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fleet.app',
  appName: 'fleet',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: "https://fleet-7g74ryxnh-nurchi-micheles-projects.vercel.app",
    cleartext: true
  }
};

export default config;