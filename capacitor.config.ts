import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ca5e6ad90815453cb8feca7faca99c8d',
  appName: 'dexa-ai-body-sync',
  webDir: 'dist',
  server: {
    url: 'http://192.168.1.245:8080',
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav"
    }
  },
  ios: {
    entitlements: {
      'com.apple.developer.healthkit': true,
      'com.apple.developer.healthkit.access': []
    }
  }
};

export default config;