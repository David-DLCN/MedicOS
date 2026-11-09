# Integración con Doctoralia (Docplanner)

**Objetivo:** que el médico siga recibiendo pacientes por Doctoralia y gestione todo lo demás
(agenda, pacientes, cobros, recibos y documentos) en MedicOS. Doctoralia no se sustituye: se
integra en el ecosistema.

## Qué ofrece Doctoralia

Doctoralia pertenece al grupo **Docplanner**, que publica una **API de integraciones** para
proveedores de software médico, como MedicOS. Según su documentación oficial:

- Solo está disponible para **proveedores de software médico** y exige un proceso de alta como
  partner. Se inicia con una reunión de arranque escribiendo a `integrations@docplanner.com`.
- Cada médico o clínica **autoriza individualmente** qué recursos (consultorios, agendas,
  servicios) puede ver el partner.
- Para aceptar una integración, los flujos mínimos son:
  1. **mapear todos los recursos**: consultorios, médicos, direcciones y servicios;
  2. **sincronizar todas las reservas en ambos sentidos** (Doctoralia ↔ MedicOS);
  3. publicar los **huecos disponibles** y los **bloqueos** de la agenda.
- Al activar la integración se hace una **carga inicial completa** de huecos y reservas, para
  que la agenda de Doctoralia refleje la de MedicOS.
- Las reservas se pueden crear, cancelar y reprogramar por API, y los cambios llegan por
  notificaciones (push o pull).

Fuentes:
- [Guía de integraciones de Docplanner](https://integrations.docplanner.com/guide/)
- [Proceso de integración](https://integrations.docplanner.com/guide/integration-process.html)
- [Gestión de calendarios](https://integrations.docplanner.com/guide/api-objects/managing-calendars.html)

> Antes de implementar, conviene revisar la documentación vigente: los detalles técnicos
> (versión, autenticación, límites) pueden cambiar.

## Cómo encaja en MedicOS

| Concepto en Doctoralia | En MedicOS | Estado en la demo |
| --- | --- | --- |
| Reserva (booking) | `Appointment` con `channel: "doctoralia"` y `externalBookingId` | Hecho: ~45 % de las reservas telefónicas de la demo vienen de Doctoralia |
| Servicio | `ConsultationType` | Mapeo pendiente |
| Médico y dirección | `Doctor` y `Clinic` | Mapeo pendiente |
| Huecos y bloqueos | Disponibilidad de la agenda | Pendiente (todavía no hay editor de horarios) |

En la interfaz:
- La agenda y el detalle de cita muestran el origen **Doctoralia** y su referencia.
- **Ajustes → Integraciones** explica la integración y cuántas citas llegan por esa vía.

## Plan de implementación (cuando exista el backend)

1. **Alta como partner** en Docplanner y entorno de pruebas.
2. **Tabla de vínculos** `external_links (provider, resource_type, external_id, internal_id)`,
   para mapear consultorios, médicos, servicios y reservas sin acoplar el modelo de dominio.
3. **Conexión del médico** en Ajustes → Integraciones: autoriza sus recursos y elige qué
   servicios de Doctoralia corresponden a qué tipos de consulta de MedicOS.
4. **Carga inicial**: importar las reservas futuras de Doctoralia y publicar los huecos de
   MedicOS.
5. **Sincronización continua**:
   - Doctoralia → MedicOS: un webhook o un sondeo crea, cambia o cancela la cita.
   - MedicOS → Doctoralia: cada cita creada en MedicOS bloquea ese hueco en Doctoralia.
   - Si llegan dos reservas para la misma hora, gana la primera confirmada y la otra queda como
     incidencia visible en el panel.
6. **Observabilidad**: un registro de sincronización por cita y un aviso en el panel si la
   conexión falla.

Las credenciales de la API se guardarán como secretos del servidor, nunca en el código ni en el
navegador.
