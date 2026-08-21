# Instalar Guía ZMG en tu celular

Tres formas, de la más rápida a la más parecida a la app final.

---

## 1. APK directo (lo que se generó aquí) — Android

El servidor compila un `.apk` que se instala como cualquier app y **funciona sin depender
de la computadora**: el código JavaScript va empaquetado dentro.

**Dónde queda el archivo:**

```
/home/manager/guiazmg/mobile/android/app/build/outputs/apk/release/app-release.apk
```

**Cómo lo pasas al teléfono** (cualquiera sirve):
- Copiarlo a una carpeta compartida y abrirlo desde el celular.
- Subirlo a Drive/WhatsApp y descargarlo desde el teléfono.
- Por cable con `adb install app-release.apk` (necesita depuración USB activada).

**Al instalar**, Android va a advertir *"por seguridad, tu teléfono no permite instalar
apps de origen desconocido"*. Es normal en cualquier APK que no venga de Play Store:
toca **Configuración → Permitir de esta fuente** y vuelve a intentar.

### Cómo volver a compilarlo tras un cambio

```bash
cd /home/manager/guiazmg/mobile/android
export JAVA_HOME=~/toolchain/jdk17
export ANDROID_HOME=~/android-sdk
export PATH="$JAVA_HOME/bin:$PATH"
./gradlew assembleRelease --no-daemon
```

> La primera compilación tarda bastante (descarga Gradle y las dependencias nativas).
> Las siguientes son mucho más rápidas porque reutiliza la caché.

### ⚠️ Este APK NO sirve para Google Play

Está firmado con la **llave de depuración** que genera Expo por defecto. Es perfecto para
probar, pero Play rechaza apps firmadas así. Para publicar hace falta una llave de release
propia — y ahí hay una trampa que cuesta caro: **si pierdes esa llave, no puedes volver a
actualizar la app nunca**, hay que publicarla de cero con otro identificador.

Por eso conviene que **EAS administre la llave** cuando llegue el momento (la guarda y
respalda por ti), en vez de generarla a mano aquí.

---

## 2. Expo Go — la más rápida para ver cambios

Instala **Expo Go** de Play Store, conecta el teléfono al mismo Wi-Fi que el servidor y abre:

```
exp://192.168.100.54:8081
```

Para levantar el servidor:

```bash
cd /home/manager/guiazmg/mobile
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.100.54 npx expo start --lan
```

Para detenerlo, **siempre por puerto** (nunca `pkill -f`, que puede matar el propio shell):

```bash
fuser -k 8081/tcp
```

**Su límite:** Expo Go no soporta módulos nativos propios. En cuanto entren el mapa de
Google, los deep links o las notificaciones push, deja de servir y hay que usar el APK.

---

## 3. EAS Build en la nube — el camino a Google Play

Cuando tengas cuenta de Expo (gratis) y de Play Console (25 USD, pago único):

```bash
cd /home/manager/guiazmg/mobile
npx eas login
npx eas build:configure

# APK de prueba, compilado en la nube
npx eas build --profile preview --platform android

# App Bundle firmado para Play
npx eas build --profile production --platform android
npx eas submit --platform android          # sube al canal de pruebas internas
```

Los perfiles ya están definidos en `eas.json`:

| Perfil | Qué produce | Para qué |
|---|---|---|
| `development` | APK con cliente de desarrollo | iterar con módulos nativos |
| `preview` | APK autónomo | mandarlo a 3-5 personas por WhatsApp |
| `production` | AAB firmado | subir a Google Play |

> **Recordatorio del que se olvida siempre:** abre la cuenta de Play Console **como
> organización, no personal**. Las cuentas personales nuevas exigen una prueba cerrada con
> ~12 probadores durante 14 días antes de poder publicar, y la verificación de organización
> tarda días — conviene empezarla mucho antes de necesitarla.

---

## iPhone

Hoy **no es posible** todavía, y no es un problema técnico que se pueda rodear:

- Instalar en un iPhone físico exige **Apple Developer Program, 99 USD al año**.
- El simulador de iOS **solo corre en macOS**, no en este servidor Linux.

Todo el desarrollo de Android avanza igual sin esto. El código es el mismo para las dos
plataformas: cuando se pague la cuenta, iOS es configuración y pruebas, no reescribir la app.
