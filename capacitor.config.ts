import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ca5e6ad90815453cb8feca7faca99c8d',
  appName: 'dexa-ai-body-sync',
  webDir: 'dist',
  server: {
    url: 'https://ca5e6ad9-0815-453c-b8fe-ca7faca99c8d.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;