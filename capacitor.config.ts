import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "br.com.engvi.operacaomanutencao",
  appName: "ENGVI Operacao e Manutencao",
  webDir: "dist",
  server: {
    androidScheme: "https",
    cleartext: true,
  },
};

export default config;
