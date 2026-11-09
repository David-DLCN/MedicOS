# Instrucciones para agentes (Codex, Claude y otros)

MedicOS es un SaaS para médicos independientes. Hoy es un prototipo: un panel del médico con
**datos ficticios**. Lee el `README.md` para conocer la arquitectura.

## Reglas de diseño (obligatorias)

Cumple **`docs/guia-de-diseno.md`** en toda pantalla nueva o modificada. En resumen:

- Máximo **4 colores**, todos de los tokens de `src/app/globals.css`: `primary` (verde
  azulado), `info` (azul), grises y `danger` (rojo, **solo para problemas**). Nada de naranja,
  ámbar ni amarillo, ni colores escritos a mano.
- **Sin fondos oscuros.** Texto oscuro sobre fondo claro con buen contraste.
- **Una sola fuente** sans-serif (Inter). Sin `font-mono` ni `font-serif`.
- Menú principal con **5 secciones como máximo**, nombres de una o dos palabras. Lo
  específico va en un segundo nivel (pirámide invertida).
- Textos breves; cifras y términos clave en negrita; **el subrayado solo para enlaces**;
  espacio en blanco generoso.
- Iconos SVG (lucide-react) en lugar de imágenes. Las fotos, optimizadas con `next/image`.

## Reglas de código

- La UI lee datos **solo** a través de `src/lib/data/repository.ts`.
- Ninguna cifra se escribe a mano en un componente: se calcula en `src/lib/domain/metrics.ts`.
- Los datos de prueba se separan de la presentación. Nunca se usan datos reales de pacientes.
- El dinero se guarda en unidades menores (céntimos). Las fechas, en ISO UTC.
- TypeScript estricto, sin `any`. Componentes pequeños y reutilizables (`src/components/ui`).
- Nada de pagos reales ni secretos en el código.

## Antes de dar algo por terminado

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Revisa también la pantalla en escritorio y en móvil (390 px, sin scroll horizontal).
