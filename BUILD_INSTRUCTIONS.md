# 🔨 BUILD INSTRUCTIONS - GUÍA ZMG

## Instrucciones para compilación y deployment

### Requisitos Previos
- Node.js 18+
- npm 9+
- PostgreSQL 17
- Redis (opcional, para production)

---

## 📋 PASOS DE BUILD

### 1. Limpieza (si hay errores previos)
```bash
rm -rf .next node_modules .turbo
npm install
```

### 2. Build de Producción
```bash
npm run build
```

**Salida esperada:**
```
✓ Compiled successfully
✓ TypeScript check completed
✓ All routes validated
```

### 3. Verificación
```bash
npm run build && echo "✅ BUILD SUCCESSFUL"
```

---

## 🚀 DEPLOYMENT

### Development
```bash
npm run dev
# Acceso: http://localhost:3000
```

### Production
```bash
npm run build
npm start
# Acceso: http://localhost:3000 (o dominio configurado)
```

### Docker (Recomendado)
```bash
docker build -t guiazmg .
docker run -p 3000:3000 -e DATABASE_URL=... guiazmg
```

---

## 📊 BUILD VALIDATION CHECKLIST

- [ ] `npm run build` completa sin errores
- [ ] TypeScript check pasa (`npm run typecheck`)
- [ ] Linting pasa (`npm run lint`)
- [ ] Todas las nuevas páginas compiladas
- [ ] `next/image` warnings resueltos
- [ ] `.next` directorio creado exitosamente

---

## 🔍 TROUBLESHOOTING

### Error: "cache-life.d.ts not found"
**Solución:**
```bash
rm -rf .next
npm run build
```

### Error: "Port 3000 already in use"
**Solución:**
```bash
lsof -i :3000  # Linux/Mac
netstat -ano | findstr :3000  # Windows
kill -9 <PID>  # Kill process
```

### Build muy lento
**Solución:**
- Limpiar `node_modules` y reinstalar
- Usar `npm ci` en lugar de `npm install`
- Verificar espacio en disco disponible

---

## 📝 VARIABLES DE ENTORNO REQUERIDAS

**Crear `.env.local`:**
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
REDIS_URL="redis://localhost:6379" (opcional)
```

---

## 🎯 RUTAS INCLUIDAS EN BUILD

Todas las siguientes rutas se compilan:

**Públicas:**
- `/` (home)
- `/promociones` ✅ NUEVA
- `/blog` ✅ NUEVA
- `/contacto` ✅ NUEVA
- `/ayuda` ✅ NUEVA
- `/terminos-condiciones` ✅ NUEVA
- `/politica-privacidad` ✅ NUEVA
- `/aviso-privacidad` ✅ NUEVA
- `/search`
- `/[municipio]/[categoria]`
- `/perfil/[slug]`

**Dinámicas:**
- `/dashboard/*` (requiere auth)
- `/admin/*` (requiere auth + admin role)
- `/editor/*` (requiere auth + editor role)

---

## ✅ BUILD SUCCESS INDICATORS

Líneas a buscar en output:
```
✓ Compiled successfully          ← TypeScript compiled
✓ Prerendered X routes          ← Pages compiled
✓ Collected 0 unused files      ← No warnings
```

**Archivo de éxito:**
```
.next/BUILD_ID  ← Archivo generado = BUILD OK
```

---

## 📊 TAMAÑOS TÍPICOS

Después de un build exitoso:

```
.next/                      ~200-300 MB
  ├── cache/                ~150-200 MB
  ├── static/               ~50-100 MB
  └── server/               ~50-100 MB
```

---

## 🔐 PRE-DEPLOYMENT CHECKS

Antes de deployer a producción:

- [ ] npm run build ✅
- [ ] npm run typecheck ✅
- [ ] npm run lint ✅
- [ ] git status clean ✅
- [ ] DATABASE_URL configurada ✅
- [ ] NEXTAUTH_SECRET configurada ✅
- [ ] SSL certificado válido ✅
- [ ] Database backups actualizados ✅

---

## 🎯 ÓRDENES DE BUILD DISPONIBLES

```bash
npm run build          # Build de producción
npm run dev           # Development server
npm run start         # Producción (local)
npm run typecheck     # TypeScript check
npm run lint          # ESLint check
npm run format        # Prettier format
```

---

## 📞 SOPORTE

Para problemas de build:
1. Limpieza: `rm -rf .next node_modules`
2. Reinstalar: `npm install`
3. Build: `npm run build`
4. Si persiste: revisar AUDIT_REPORT.md

---

**Última actualización**: 2026-06-06  
**Estado**: LISTO PARA DEPLOYMENT ✅
