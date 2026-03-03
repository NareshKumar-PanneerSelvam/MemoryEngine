import { useEffect } from "react";

import { pingHealth } from "../services/api";

const HEALTH_PING_INTERVAL_MS = 14 * 60 * 1000;

export default function Health() {
  useEffect(() => {
    void pingHealth();

    const timer = window.setInterval(() => {
      void pingHealth();
    }, HEALTH_PING_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
