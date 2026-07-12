export type FieldType = "text" | "email" | "password" | "number" | "url" | "textarea" | "select" | "toggle"

export interface ConfigField {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  description?: string
  // Estado por defecto cuando no hay valor guardado (p.ej. un toggle que arranca
  // activo). Para campos de texto, el `placeholder` muestra el default en gris.
  default?: string
}

export const ADMIN_CONFIG_SECTIONS: Record<string, { title: string; description: string; fields: ConfigField[] }> = {
  general: {
    title: "General",
    description: "Nombre del sistema, dominio, soporte y mantenimiento.",
    fields: [
      { key: "site_name", label: "Nombre del sitio", type: "text", required: true, placeholder: "Guía ZMG" },
      { key: "site_domain", label: "Dominio principal", type: "url", required: true, placeholder: "https://guiizmg.com" },
      { key: "support_email", label: "Email de soporte", type: "email", required: true },
      { key: "support_phone", label: "Teléfono de soporte", type: "text", required: true },
      { key: "timezone", label: "Zona horaria", type: "select", required: true, options: [
        { value: "America/Mexico_City", label: "América/Ciudad de México (CDT)" },
        { value: "America/Denver", label: "América/Denver" },
      ]},
      { key: "maintenance_mode", label: "Modo mantenimiento", type: "toggle" },
    ],
  },
  mapas: {
    title: "Google Maps",
    description: "API key para el mapa y el selector de ubicación (pin) al registrar un negocio.",
    fields: [
      { key: "google_maps_api_key", label: "API Key de Google Maps", type: "password", placeholder: "AIza...", description: "Habilita el selector de pin en el mapa. Restringe la key por dominio en Google Cloud." },
      { key: "google_places_api_key", label: "API Key de Google Places (ratings)", type: "password", placeholder: "AIza... (sin restricción de dominio)", description: "Key de servidor con Places API habilitada, para traer el rating y reseñas de Google. Si se deja vacío se usa la de Maps." },
      { key: "google_maps_enabled", label: "Habilitar mapa en el registro", type: "toggle" },
    ],
  },
  eventos: {
    title: "Eventos (RSS)",
    description: "Feeds RSS/Atom para importar eventos automáticamente. Se importan como borrador para revisión.",
    fields: [
      { key: "events_rss_feeds", label: "Feeds RSS (uno por línea o separados por coma)", type: "textarea", placeholder: "https://ejemplo.com/eventos/rss" },
    ],
  },
  branding: {
    title: "Branding",
    description: "Logo, favicon, colores e imágenes por defecto.",
    fields: [
      { key: "logo_url", label: "URL del logo", type: "url", placeholder: "https://..." },
      { key: "favicon_url", label: "URL del favicon", type: "url", placeholder: "https://..." },
      { key: "primary_color", label: "Color primario (hex)", type: "text", placeholder: "#22c55e" },
      { key: "secondary_color", label: "Color secundario (hex)", type: "text", placeholder: "#0f172a" },
      { key: "default_og_image", label: "Imagen OG por defecto", type: "url", placeholder: "https://..." },
    ],
  },
  auth: {
    title: "Autenticación",
    description: "Registro, OAuth, sesión y reglas de password.",
    fields: [
      { key: "registration_enabled", label: "Permitir registro", type: "toggle" },
      { key: "oauth_google_enabled", label: "OAuth Google habilitado", type: "toggle" },
      { key: "session_duration_days", label: "Duración de sesión (días)", type: "number", placeholder: "30" },
      { key: "password_min_length", label: "Longitud mínima de password", type: "number", placeholder: "8" },
      { key: "require_email_verification", label: "Verificación de email requerida", type: "toggle", description: "Bloquea el inicio de sesión con correo/contraseña hasta activar la cuenta por el enlace. Google entra directo (ya verificado). IMPORTANTE: préndelo solo cuando el SMTP funcione, o nadie podrá activarse. Las cuentas ya existentes conviene marcarlas verificadas antes de prender esto." },
      { key: "two_factor_enabled", label: "2FA disponible", type: "toggle" },
    ],
  },
  correo: {
    title: "Correo SMTP",
    description: "Servidor, credenciales, TLS y pruebas.",
    fields: [
      { key: "smtp_host", label: "Host SMTP", type: "text", required: true, placeholder: "smtp.gmail.com" },
      { key: "smtp_port", label: "Puerto", type: "number", required: true, placeholder: "587" },
      { key: "smtp_username", label: "Usuario", type: "email", required: true },
      { key: "smtp_password", label: "Contraseña", type: "password", required: true },
      { key: "smtp_from_email", label: "Email remitente", type: "email", required: true },
      { key: "smtp_tls_enabled", label: "TLS habilitado", type: "toggle" },
    ],
  },
  sms: {
    title: "SMS",
    description: "Proveedor de SMS (Twilio implementado). Pega las credenciales y quedará activo; vacío = no se envían SMS.",
    fields: [
      { key: "sms_provider", label: "Proveedor", type: "select", description: "Twilio está implementado. Nexmo/AWS son puntos de extensión.", options: [
        { value: "none", label: "Ninguno (desactivado)" },
        { value: "twilio", label: "Twilio" },
        { value: "nexmo", label: "Nexmo (próximamente)" },
        { value: "aws_sns", label: "AWS SNS (próximamente)" },
      ]},
      { key: "sms_account_sid", label: "Twilio · Account SID", type: "text", description: "Empieza con AC… (Twilio Console)." },
      { key: "sms_api_key", label: "Twilio · Auth Token", type: "password", description: "El Auth Token de Twilio (o API Key secret)." },
      { key: "sms_from_number", label: "Número remitente", type: "text", placeholder: "+15005550006", description: "Número o Messaging Service en formato E.164 (+52…)." },
      { key: "sms_template_verification", label: "Plantilla verificación", type: "textarea", placeholder: "Tu código de verificación de Guía ZMG es: {code}", description: "Usa {code} donde va el código." },
    ],
  },
  pagos: {
    title: "Pagos",
    description: "Mercado Pago y Stripe. Pega las credenciales y los pagos quedan activos.",
    fields: [
      { key: "mercado_pago_access_token", label: "Mercado Pago · Access Token", type: "password", description: "Access token de producción (o de prueba). De aquí sale el checkout." },
      { key: "mercado_pago_public_key", label: "Mercado Pago · Public Key", type: "text", description: "Public key (opcional, para el checkout embebido)." },
      { key: "mercado_pago_webhook_secret", label: "Mercado Pago · Webhook Secret", type: "password", description: "Clave secreta del webhook (Mercado Pago → Webhooks). Verifica la firma de las notificaciones." },
      { key: "mercado_pago_sandbox", label: "Mercado Pago · Modo sandbox", type: "toggle", description: "Actívalo mientras pruebas con credenciales de prueba." },
      { key: "stripe_api_key", label: "Stripe · Secret Key", type: "password", description: "sk_live_… (o sk_test_…). Habilita el checkout de Stripe." },
      { key: "stripe_public_key", label: "Stripe · Publishable Key", type: "text", description: "pk_live_… (opcional, para el checkout en el navegador)." },
      { key: "stripe_webhook_secret", label: "Stripe · Webhook Secret", type: "password", description: "whsec_… del endpoint de webhook en Stripe. Verifica la firma." },
      { key: "stripe_sandbox", label: "Stripe · Modo test", type: "toggle", description: "Actívalo mientras pruebas con claves sk_test/pk_test." },
      { key: "webhook_url", label: "Webhook URL (referencia)", type: "url", placeholder: "https://guiazmg.vercel.app/api/payments/webhook", description: "Informativo: la URL que debes registrar en el panel del proveedor." },
    ],
  },
  membresias: {
    title: "Membresías",
    description: "Planes, límites y precios.",
    fields: [
      { key: "free_plan_max_listings", label: "Plan Gratuito - Máx anuncios", type: "number" },
      { key: "free_plan_enabled", label: "Plan Gratuito habilitado", type: "toggle" },
      { key: "monthly_billing_enabled", label: "Facturación mensual", type: "toggle" },
      { key: "annual_discount_percent", label: "Descuento anual (%)", type: "number" },
      { key: "allow_plan_downgrade", label: "Permitir cambio a plan inferior", type: "toggle" },
    ],
  },
  boosts: {
    title: "Boosts",
    description: "Duración, precios y targets.",
    fields: [
      { key: "boost_7_days_price", label: "Boost 7 días - Precio", type: "number" },
      { key: "boost_15_days_price", label: "Boost 15 días - Precio", type: "number" },
      { key: "boost_30_days_price", label: "Boost 30 días - Precio", type: "number" },
      { key: "boost_max_per_business", label: "Máx boosts simultáneos por negocio", type: "number" },
      { key: "boost_priority_multiplier", label: "Multiplicador de prioridad", type: "number" },
    ],
  },
  seo: {
    title: "SEO",
    description:
      "Metadatos, robots, sitemap y schema. Los campos vacíos usan valores optimizados por defecto (los que aparecen en gris); escribe algo solo si quieres sobrescribirlos.",
    fields: [
      {
        key: "meta_title",
        label: "Meta title",
        type: "text",
        placeholder: "Guía ZMG — Directorio de Negocios y Servicios en Guadalajara",
        description: "Vacío = se usa el título por defecto (el de gris). Ideal: 50-60 caracteres.",
      },
      {
        key: "meta_description",
        label: "Meta description",
        type: "textarea",
        placeholder:
          "Encuentra negocios, profesionales y servicios en Guadalajara, Zapopan, Tlaquepaque, Tonalá y toda la ZMG: teléfonos, ubicación, horarios, reseñas y promociones en un solo lugar.",
        description: "Vacío = descripción optimizada por defecto. Ideal: 150-160 caracteres.",
      },
      {
        key: "meta_keywords",
        label: "Keywords (separados por coma)",
        type: "textarea",
        placeholder:
          "negocios en Guadalajara, directorio Guadalajara, guía comercial Guadalajara, servicios en Guadalajara, negocios Zapopan, negocios Tlaquepaque, negocios Tonalá, ZMG",
        description: "Vacío = keywords por defecto. Tienen poco peso en Google, pero no estorban.",
      },
      {
        key: "robots_txt_content",
        label: "Contenido robots.txt",
        type: "textarea",
        placeholder:
          "Vacío = robots.txt por defecto (abre el sitio y bloquea /admin, /api, /editor, etc. + enlaza el sitemap).",
        description: "Solo escribe aquí si quieres un robots.txt manual. Vacío usa el default seguro.",
      },
      {
        key: "enable_sitemap",
        label: "Generar sitemap.xml",
        type: "toggle",
        default: "true",
        description: "Activo por defecto. Desactívalo solo si NO quieres que Google indexe vía sitemap.",
      },
      {
        key: "schema_org_type",
        label: "Schema.org type",
        type: "text",
        placeholder: "LocalBusiness",
        description: "Tipo de datos estructurados Schema.org. Por defecto: LocalBusiness.",
      },
      { key: "gsc_site_url", label: "Search Console: URL de la propiedad", type: "url", placeholder: "https://guiazmg.vercel.app/" },
      { key: "gsc_service_account", label: "Search Console: cuenta de servicio (JSON)", type: "textarea", description: "Pega el JSON de la cuenta de servicio con acceso a la propiedad. Activa las palabras clave reales de Google en /admin/analytics." },
    ],
  },
  seguridad: {
    title: "Seguridad",
    description: "CSP, CORS, cookies y sesiones.",
    fields: [
      { key: "csp_header", label: "Content Security Policy", type: "textarea", placeholder: "default-src 'self'" },
      { key: "cors_origins", label: "CORS Origins (separados por coma)", type: "textarea" },
      { key: "session_secure_cookie", label: "Secure cookies", type: "toggle" },
      { key: "rate_limit_per_minute", label: "Rate limit (requests/minuto)", type: "number" },
      { key: "max_login_attempts", label: "Máximos intentos de login", type: "number" },
      { key: "enable_hsts", label: "HSTS habilitado", type: "toggle" },
    ],
  },
  storage: {
    title: "Storage",
    description: "Bucket, región, límites y tipos permitidos.",
    fields: [
      { key: "s3_bucket_name", label: "Nombre del bucket S3", type: "text" },
      { key: "s3_region", label: "Región S3", type: "text", placeholder: "us-east-1" },
      { key: "s3_access_key", label: "AWS Access Key", type: "password" },
      { key: "s3_secret_key", label: "AWS Secret Key", type: "password" },
      { key: "max_upload_size_mb", label: "Tamaño máximo (MB)", type: "number", placeholder: "50" },
      { key: "allowed_file_types", label: "Tipos permitidos (separados por coma)", type: "text", placeholder: "jpg,png,pdf,doc" },
    ],
  },
  moderacion: {
    title: "Moderación",
    description: "Auto aprobación, spam y palabras bloqueadas.",
    fields: [
      { key: "auto_approve_content", label: "Auto-aprobar contenido", type: "toggle" },
      { key: "spam_detection_enabled", label: "Detección de spam habilitada", type: "toggle" },
      { key: "spam_threshold", label: "Umbral de spam (0-100)", type: "number" },
      { key: "blocked_words", label: "Palabras bloqueadas (separadas por coma)", type: "textarea" },
      { key: "max_daily_posts", label: "Máximo posts diarios por usuario", type: "number" },
      { key: "min_account_age_days", label: "Antigüedad mínima cuenta (días)", type: "number" },
    ],
  },
  legal: {
    title: "Legal",
    description: "Términos, privacidad, cookies y aviso legal.",
    fields: [
      { key: "terms_of_service_url", label: "URL Términos de Servicio", type: "url" },
      { key: "privacy_policy_url", label: "URL Política de Privacidad", type: "url" },
      { key: "cookie_policy_url", label: "URL Política de Cookies", type: "url" },
      { key: "legal_notice_url", label: "URL Aviso Legal", type: "url" },
      { key: "company_name", label: "Nombre legal empresa", type: "text" },
      { key: "company_address", label: "Dirección legal", type: "textarea" },
    ],
  },
  flags: {
    title: "Feature Flags",
    description: "Módulos globales y beta features.",
    fields: [
      { key: "feature_marketplace_enabled", label: "Marketplace habilitado", type: "toggle" },
      { key: "feature_boosts_enabled", label: "Boosts habilitado", type: "toggle" },
      { key: "feature_reviews_enabled", label: "Reviews habilitado", type: "toggle" },
      { key: "feature_leads_enabled", label: "Leads habilitado", type: "toggle" },
      { key: "feature_analytics_enabled", label: "Analytics habilitado", type: "toggle" },
      { key: "beta_features_enabled", label: "Beta features habilitado", type: "toggle" },
    ],
  },
}

// Claves cuyo valor es un secreto (API keys, tokens, contraseñas). Su valor
// NUNCA se envía al navegador: la UI solo indica si ya hay uno guardado, y al
// guardar un input vacío se conserva el existente (no se sobrescribe con "").
export const SECRET_KEYS: ReadonlySet<string> = new Set(
  Object.values(ADMIN_CONFIG_SECTIONS)
    .flatMap((section) => section.fields)
    .filter((field) => field.type === "password")
    .map((field) => field.key)
)
