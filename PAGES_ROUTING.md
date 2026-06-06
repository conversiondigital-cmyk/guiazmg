# 🗺️ RUTAS Y NAVEGACIÓN - NUEVAS PÁGINAS

## Mapa de Rutas

```
SITE ROOT
│
├── / (Home)
│   ├── [Header con navbar]
│   │   ├── Promociones → /promociones
│   │   ├── Blog → /blog
│   │   └── Contacto → /contacto
│   └── [Footer con links legales]
│       ├── SOPORTE
│       │   ├── Ayuda → /ayuda
│       │   ├── Términos y condiciones → /terminos-condiciones
│       │   ├── Política de privacidad → /politica-privacidad
│       │   ├── Aviso de privacidad → /aviso-privacidad
│       │   └── Contacto → /contacto
│       └── [Otros links de footer]
│
├── /promociones
│   ├── [Header con navbar]
│   ├── Hero: "Promociones y Ofertas"
│   ├── Ofertas Destacadas (3 cards)
│   ├── Todas las Promociones (3 cards más)
│   ├── CTA: "Registra tu negocio"
│   └── [Footer]
│
├── /blog
│   ├── [Header con navbar]
│   ├── Hero: "Blog de Guía ZMG"
│   ├── Artículos Destacados (3 cards)
│   ├── Filtro de categorías
│   ├── Todos los Artículos (listado)
│   ├── Newsletter CTA
│   └── [Footer]
│
├── /contacto
│   ├── [Header con navbar]
│   ├── Hero: "Contacto"
│   ├── Tarjetas de contacto (Email, Teléfono, Ubicación, Horarios)
│   ├── Formulario de contacto
│   ├── Sección de FAQs (4 preguntas)
│   └── [Footer]
│
├── /ayuda
│   ├── [Header con navbar]
│   ├── Hero: "Centro de Ayuda"
│   ├── Barra de búsqueda
│   ├── 6 Categorías de ayuda (grid)
│   ├── 8 FAQs expandibles
│   ├── 3 Canales de soporte (cards)
│   └── [Footer]
│
├── /terminos-condiciones
│   ├── [Header con navbar]
│   ├── Hero: "Términos y Condiciones"
│   ├── 15 Secciones de contenido legal
│   └── [Footer]
│
├── /politica-privacidad
│   ├── [Header con navbar]
│   ├── Hero: "Política de Privacidad"
│   ├── Aviso importante (LFPDPPP)
│   ├── 13 Secciones detalladas
│   └── [Footer]
│
└── /aviso-privacidad
    ├── [Header con navbar]
    ├── Hero: "Aviso de Privacidad"
    ├── Aviso legal (LFPDPPP)
    ├── 12 Secciones resume
    ├── Tabla de resumen rápido
    └── [Footer]
```

---

## 📌 Navegación en Header

**Navbar Items** (Menu Principal):
- Home (/)
- Buscar (/search)
- Categorías
- **Promociones** (/promociones) ⭐ NUEVA
- **Blog** (/blog) ⭐ NUEVA
- **Contacto** (/contacto) ⭐ NUEVA
- Registrar Negocio
- Dashboard (Auth)

---

## 📌 Navegación en Footer

**Sección SOPORTE** (Links Legales):
```
SOPORTE
├── Ayuda (/ayuda) ⭐ NUEVA
├── Términos y condiciones (/terminos-condiciones) ⭐ NUEVA
├── Política de privacidad (/politica-privacidad) ⭐ NUEVA
├── Aviso de privacidad (/aviso-privacidad) ⭐ NUEVA
└── Contacto (/contacto) ⭐ NUEVA
```

---

## 🔗 Enlaces Internos (Cross-linking)

### Desde /promociones:
- ➜ /registrar-negocio (CTA)

### Desde /blog:
- ➜ /blog/{article-slug} (Links a artículos completos)

### Desde /contacto:
- ➜ /politica-privacidad (Checkbox de acepto)
- ➜ /terminos-condiciones (Si agregamos)
- ➜ /ayuda (Para FAQs)

### Desde /ayuda:
- ➜ /contacto (Chat, Email, Teléfono)
- ➜ /politica-privacidad (GDPR/LFPDPPP)

### Desde /politica-privacidad:
- ➜ /aviso-privacidad (Link a versión simplificada)
- ➜ Formulario de solicitud ARCO

### Desde /aviso-privacidad:
- ➜ /politica-privacidad (Link a versión integral)
- ➜ https://www.gob.mx/inai (INAI - Autoridad)

---

## 📱 Responsive Breakpoints

Todas las páginas usan:
- **Mobile**: Base (< 640px)
- **Tablet**: `md:` breakpoint (768px)
- **Desktop**: `lg:` breakpoint (1024px)
- **Wide**: `xl:` breakpoint (1280px)

Layouts por página:
- `/promociones`: grid-cols-1 → md:grid-cols-2 → lg:grid-cols-3
- `/blog`: grid-cols-1 → md:grid-cols-2 → lg:grid-cols-3
- `/contacto`: flex column → md:flex row (form)
- `/ayuda`: grid-cols-1 → md:grid-cols-2 → lg:grid-cols-3
- Documentos legales: Lectura lineal (single column)

---

## 🎨 Colores por Sección

| Página | Color Primario | Uso |
|--------|----------------|-----|
| Promociones | Blue (600-800) | Hero gradient, CTA |
| Blog | Purple (600-800) | Hero gradient, Badges |
| Contacto | Emerald (600-800) | Hero gradient, Icons |
| Ayuda | Blue (600-800) | Hero gradient, Icons |
| Documentos Legales | Gray (900-800) | Hero, Professional |

---

## 🔍 SEO Metadata

Todas las páginas incluyen:

```typescript
export const metadata: Metadata = {
  title: "Page Title | Guía ZMG",
  description: "Short description for search engines"
}
```

**Títulos configurados**:
- ✅ `/promociones`: "Promociones | Guía ZMG"
- ✅ `/blog`: "Blog | Guía ZMG"
- ✅ `/contacto`: "Contacto | Guía ZMG"
- ✅ `/ayuda`: "Ayuda | Guía ZMG"
- ✅ `/terminos-condiciones`: "Términos y Condiciones | Guía ZMG"
- ✅ `/politica-privacidad`: "Política de Privacidad | Guía ZMG"
- ✅ `/aviso-privacidad`: "Aviso de Privacidad | Guía ZMG"

---

## 🧪 Testing Checklist

### Navegación
- [ ] Header links funcionan en todas las páginas
- [ ] Footer links funcionan en todas las páginas
- [ ] Back button funciona
- [ ] Links internos funcionan
- [ ] Links externos abren en tab nuevo

### Responsive
- [ ] Móvil (375px) - Todas las páginas
- [ ] Tablet (768px) - Todas las páginas
- [ ] Desktop (1024px) - Todas las páginas
- [ ] Wide (1440px) - Todas las páginas

### Funcionalidad
- [ ] Formulario de contacto valida
- [ ] Formulario envía correctamente
- [ ] FAQs expanden/contraen
- [ ] Búsqueda en ayuda funciona
- [ ] Filtros en blog funcionan

### Legal
- [ ] Términos accesibles y legibles
- [ ] Política privacidad completa
- [ ] Aviso privacidad conformidad LFPDPPP
- [ ] Links a INAI en aviso
- [ ] Datos de contacto correctos

### Performance
- [ ] Page load time < 3s
- [ ] Imágenes optimizadas
- [ ] CSS cargando correctamente
- [ ] No hay errores de consola

---

## 📊 Estadísticas de Páginas

| Página | Componentes | Líneas | Dynamic | Client |
|--------|-----------|--------|---------|--------|
| Promociones | 3 | 257 | No | No |
| Blog | 3 | 248 | No | No |
| Contacto | 5 | 254 | Form | ✅ Yes |
| Ayuda | 4 | 334 | No | No |
| Términos | 1 | 387 | No | No |
| Política | 1 | 418 | No | No |
| Aviso | 1 | 456 | No | No |
| **TOTAL** | **18** | **2,354** | - | 1/7 |

---

## 🚀 Deployment

Para deployer en producción:

1. ✅ Build verificado (npm run build)
2. ⏳ Commit de cambios (pendiente)
3. ⏳ Push a repositorio
4. ⏳ Deploy a staging
5. ⏳ Testing en staging
6. ⏳ Deploy a producción

---

**Creado por**: Claude Code  
**Fecha**: 2026-06-06  
**Actualización**: Documentación de rutas completa
