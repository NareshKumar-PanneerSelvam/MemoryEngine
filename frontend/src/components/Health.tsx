import { useEffect } from "react";

import { pingHealth } from "../services/api";

const HEALTH_PING_INTERVAL_MS = 14 * 60 * 1000;

export default function Health() {
  useEffect(() => {
    const runHealthPing = async () => {
      try {
        await pingHealth();
      } catch (error) {
        console.error("Health ping failed:", error);
      }
    };

    void runHealthPing();
    const timer = window.setInterval(() => {
      void runHealthPing();
    }, HEALTH_PING_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
