# Guía de diseño de MedikOS

Reglas obligatorias para cualquier pantalla nueva o modificada. Se basan en el artículo
*"Reglas para un buen sitio web"* (DISEÑO WEB, Medium), adaptado a una aplicación SaaS para
médicos. Cada regla indica **cómo se aplica aquí** y **cómo comprobarla**.

---

## 1. La app es para el usuario, no para nosotros

El usuario principal es el **médico independiente**. Más adelante también lo serán sus
**pacientes**, en el marketplace.

- Cada pantalla responde a una pregunta del médico ("¿qué tengo hoy?", "¿cuánto he cobrado?").
  Si un elemento no ayuda a responderla, no va.
- **Resalta lo importante.** Hay un dato o acción principal por bloque: cifras grandes y
  titulares cortos. El resto, en texto secundario (`text-muted`). Si todo pesa igual, nada destaca.
- **Lenguaje preciso para usuarios capacitados.** El médico es un profesional: términos
  exactos ("Consulta de seguimiento", "Teleconsulta", "No asistió"), sin explicaciones obvias.
  En las pantallas para pacientes, en cambio, no se da nada por sabido.
- **Coherencia** entre todas las pantallas y con cualquier material de la marca (logo, colores,
  tipografía). Todo sale de los tokens de `src/app/globals.css`.

## 2. Diseñar primero el contenido, después la pantalla

Antes de programar una pantalla, responde por escrito:

1. ¿Qué quiere conseguir el médico aquí?
2. ¿Qué información o acciones le ofrecemos?
3. ¿Con qué frecuencia cambia este contenido?

**Estructura en pirámide invertida:**

- **Primer nivel** (menú principal): lo general, visible para todos. Máximo **5 secciones**.
  Hoy son: Panel, Citas, Pacientes, Finanzas y Ajustes.
- **Segundo nivel** (detalle): lo específico, para quien quiere profundizar. Por ejemplo,
  `/appointments/[id]` o `/patients/[id]`.
- No se añade una sexta sección al menú: lo nuevo entra dentro de una sección existente, como
  subsección o pestaña. La estructura debe poder crecer sin volverse confusa.
- Solo se crean secciones de "novedades" si alguien va a actualizarlas de verdad.

## 3. Contenido útil

En el panel del médico, el "contenido" son **sus datos**: deben ser correctos, coherentes y
fáciles de encontrar.

- Ninguna cifra se escribe a mano en un componente: todo se calcula en
  `src/lib/domain/metrics.ts`.
- El marketplace (fase futura) seguirá los consejos del artículo para profesionales:
  - perfil y CV del médico, especialidad y artículos o conocimientos que quiera compartir;
  - **precios claros y transparentes** de cada tipo de consulta;
  - **opiniones creíbles** de pacientes reales, nunca textos promocionales inventados;
  - contenido actualizado, con fuentes enlazadas cuando se cite a alguien. Esto también ayuda
    en los buscadores.

## 4. El menú es esencial

- **Nombres cortos e indicativos.** Se entiende qué hay antes de abrirlo. Una o dos palabras,
  sin nombres compuestos. Por eso es "Ajustes" y no "Ajustes e integraciones": las
  integraciones son una subsección dentro de Ajustes.
- La sección activa siempre se distingue (`aria-current="page"`).
- Las listas y catálogos siguen convenciones conocidas: por fecha, alfabético, por estado.

## 5. Pocos colores, pocas fuentes

**Colores: 4 como máximo, todos fríos y profesionales.**

| # | Color | Token | Uso |
| --- | --- | --- | --- |
| 1 | Verde azulado `#0b6b6b` | `primary` | Marca, acciones, resultados positivos (realizada, cobrado) |
| 2 | Azul `#2450b8` | `info` | Información, estados confirmados o próximos |
| 3 | Grises pizarra | `foreground`, `muted`, `subtle`, `border`, `surface` | Texto, superficies, estados neutros |
| 4 | Rojo `#b42323` | `danger` | **Solo problemas**: inasistencia, pago fallido, cobros vencidos, cifras a la baja |

- **Prohibido:** naranja, ámbar, amarillo u otros colores cálidos de acento, y cualquier color
  fuera de estos tokens (`bg-teal-300`, `#ff…`, etc.).
- El rojo es la única excepción cálida: es la convención universal para "error" y hace falta
  para la accesibilidad. Se usa con moderación.
- **Sin fondos oscuros** en la interfaz. La navegación lateral es clara.
- Texto oscuro sobre fondo claro, siempre con buen contraste (WCAG AA: 4,5:1 para texto normal).
- Para distinguir variantes de un mismo color se usa la intensidad o un contorno, no un color
  nuevo. Por ejemplo, "Por confirmar" es azul con contorno y "Confirmada" es azul relleno.

**Fuentes: una sola familia sans-serif** (Inter, cargada con `next/font`).

- Sin fuentes con serifa, decorativas ni monoespaciadas en la interfaz.
- La jerarquía se marca con tamaño y peso, no con más familias.

## 6. Textos breves y pensados para pantalla

- Títulos cortos que digan qué hay. Una descripción de una línea como máximo bajo cada título.
- **Negrita** (`font-semibold` o `font-medium`) para los términos y cifras clave, para que se
  entiendan de un vistazo.
- **El subrayado se reserva para los enlaces.** No se subraya texto para destacarlo.
- Espacio en blanco generoso. No se amontonan bloques: si una pantalla necesita más de unas
  6 u 8 tarjetas, el contenido se divide en un segundo nivel.
- Los enlaces externos y la información adicional van al final del bloque.

## 7. Cuidado con las imágenes

- Para la navegación y los estados se usan **iconos SVG** (lucide-react): pesan muy poco y ayudan
  a entender.
- Toda fotografía (por ejemplo, la del médico en el marketplace) se sirve con `next/image`, en
  un formato comprimido moderno (WebP o AVIF) y al tamaño en que se muestra.
- Ninguna imagen es solo decorativa si ralentiza la carga.

## 8. Aprovechar el medio

- **Retroalimentación:** cuando exista el backend, el médico tendrá un canal visible para enviar
  comentarios sobre MedikOS. En el marketplace, los pacientes podrán dejar opiniones verificadas.
- Los datos se actualizan solos: los avisos del panel se generan a partir de la actividad y
  nunca se escriben a mano.

---

## Lista de comprobación antes de terminar una pantalla

- [ ] ¿Responde a una pregunta clara del médico? ¿Lo más importante destaca?
- [ ] ¿El menú sigue teniendo 5 secciones o menos, con nombres de una o dos palabras?
- [ ] ¿Solo usa tokens de color de la tabla? ¿El rojo aparece únicamente para problemas?
- [ ] ¿Una sola fuente, sin `font-mono` ni `font-serif`?
- [ ] ¿Textos cortos, cifras clave en negrita y nada subrayado salvo enlaces?
- [ ] ¿Espacio suficiente y nada amontonado?
- [ ] ¿Iconos SVG, y ninguna imagen sin optimizar?
- [ ] ¿Funciona en móvil (390 px) sin scroll horizontal?
