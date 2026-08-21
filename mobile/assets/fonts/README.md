# Fuentes — Manrope

Esta carpeta debe contener los siguientes 5 archivos `.ttf` de la fuente
**Manrope** (la tipografía del sistema de diseño de Guía ZMG, ver
`src/theme/tokens.ts`):

```
assets/fonts/Manrope-Regular.ttf      (peso 400)
assets/fonts/Manrope-Medium.ttf       (peso 500)
assets/fonts/Manrope-SemiBold.ttf     (peso 600)
assets/fonts/Manrope-Bold.ttf         (peso 700)
assets/fonts/Manrope-ExtraBold.ttf    (peso 800)
```

Los nombres EXACTOS importan: `src/app/_layout.tsx` los referencia por ruta
literal (`require('../../assets/fonts/Manrope-Regular.ttf')`, etc.) para que
Metro pueda empaquetarlos en build time. Si renombras un archivo, actualiza
también ese `require` en `_layout.tsx`.

## De dónde bajarlos

Manrope es una fuente libre (SIL Open Font License). Dos fuentes oficiales,
cualquiera de las dos sirve:

1. **Google Fonts** — https://fonts.google.com/specimen/Manrope → botón
   "Download family". El .zip trae variable font; hay que exportar los
   estáticos de cada peso (o usar la herramienta de Google Fonts para pedir
   los recortes estáticos) y renombrarlos según la lista de arriba.
2. **Repositorio oficial del tipógrafo** (Mikhail Sharanda) —
   https://github.com/sharanda/manrope/tree/master/fonts/ttf — ya trae los
   `.ttf` estáticos por peso, es la ruta más directa.

## Si esta carpeta está vacía

La app **no se rompe**. `src/app/_layout.tsx` usa `expo-font` con
`useFonts()`; si los `.ttf` no existen, la promesa de carga resuelve con
`fontError` en vez de colgarse, y `theme/theme-provider.tsx` degrada
automáticamente a la fuente del sistema (`fontsLoaded: false` →
`fontFamily()` devuelve `undefined`, React Native usa la fuente nativa de la
plataforma). El tamaño, la altura de línea y el peso (`fontWeight`) de la
escala tipográfica se siguen respetando igual — el texto no se ve "roto",
solo no es Manrope hasta que se agreguen los archivos.
