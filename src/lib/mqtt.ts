// Usa el bundle ESM/min para browser
import mqtt from "mqtt";
// Importa SOLO EL TIPO (no se emite en runtime)
import type { MqttClient } from "mqtt";

const WS_URL = "ws://localhost:9001"; // broker local en Docker

let client: MqttClient | null = null;

export function getMqtt(): MqttClient {
  if (client) return client;
  client = mqtt.connect(WS_URL, {
    keepalive: 30,
    reconnectPeriod: 2000,
  });
  client.on("connect", () => console.log("[MQTT] conectado"));
  client.on("reconnect", () => console.log("[MQTT] reconectando..."));
  client.on("error", (e) => console.error("[MQTT] error", e));
  return client;
}

export function sendLed(on: boolean) {
  const c = getMqtt();
  c.publish("devices/esp/led", on ? "1" : "0");
}

export function sendServo(dir: "adelante" | "atras") {
  const c = getMqtt();
  c.publish("devices/esp/servo", dir);
}
