export type FieldType = "text" | "email" | "password" | "number" | "url" | "textarea" | "select" | "toggle"

export interface ConfigField {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  description?: string
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
      { key: "google_maps_api_key", label: "API Key de Google Maps", type: "text", placeholder: "AIza...", description: "Habilita el selector de pin en el mapa. Restringe la key por dominio en Google Cloud." },
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
      { key: "require_email_verification", label: "Verificación de email requerida", type: "toggle" },
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
    description: "Proveedor y plantillas.",
    fields: [
      { key: "sms_provider", label: "Proveedor", type: "select", options: [
        { value: "twilio", label: "Twilio" },
        { value: "nexmo", label: "Nexmo" },
        { value: "aws_sns", label: "AWS SNS" },
      ]},
      { key: "sms_api_key", label: "API Key", type: "password", required: true },
      { key: "sms_from_number", label: "Número remitente", type: "text", required: true },
      { key: "sms_template_verification", label: "Plantilla verificación", type: "textarea" },
    ],
  },
  pagos: {
    title: "Pagos",
    description: "Mercado Pago, Stripe, sandbox y webhook.",
    fields: [
      { key: "mercado_pago_access_token", label: "Mercado Pago Access Token", type: "password" },
      { key: "mercado_pago_sandbox", label: "Mercado Pago Sandbox", type: "toggle" },
      { key: "stripe_api_key", label: "Stripe API Key", type: "password" },
      { key: "stripe_sandbox", label: "Stripe Sandbox", type: "toggle" },
      { key: "webhook_url", label: "Webhook URL", type: "url", placeholder: "https://api.guia-zmg.com/webhooks/payment" },
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
    description: "Metadatos, robots, sitemap y schema.",
    fields: [
      { key: "meta_title", label: "Meta title", type: "text", placeholder: "Guía Comercial ZMG" },
      { key: "meta_description", label: "Meta description", type: "textarea" },
      { key: "meta_keywords", label: "Keywords (separados por coma)", type: "textarea" },
      { key: "robots_txt_content", label: "Contenido robots.txt", type: "textarea" },
      { key: "enable_sitemap", label: "Generar sitemap.xml", type: "toggle" },
      { key: "schema_org_type", label: "Schema.org type", type: "text", placeholder: "LocalBusiness" },
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
