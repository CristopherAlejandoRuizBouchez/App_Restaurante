export const AUTH_CONFIG = {
  /** Rondas de bcrypt. 12 es el balance seguridad/velocidad recomendado. */
  BCRYPT_ROUNDS: 12,

  /** Duración de la sesión de un usuario del panel. */
  SESSION_TTL_HOURS: 8,

  /** Duración de la sesión de una tablet. Larga: nadie quiere reloguear cocina. */
  DEVICE_SESSION_TTL_DAYS: 30,

  SESSION_COOKIE_NAME: "smq_session",
  DEVICE_COOKIE_NAME: "smq_device",
} as const;
