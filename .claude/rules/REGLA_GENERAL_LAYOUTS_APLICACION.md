---
paths:
  - "src/components/layout/**"
  - "src/app/temas/page.tsx"
  - "src/app/temas/*/layout.tsx"
  - "src/app/consolidado/page.tsx"
  - "src/features/temas/**"
---

# Regla general de layouts de la aplicación

## 1. Propósito

La interfaz se organiza en **dos layouts**: (1) **portada de temas** y (2) **layout interno de navegación**. Aplica a cualquier tema, módulo o vista.

## 2. Principios

Estructura clara y constante; portada separada del espacio de trabajo; sin navegación duplicada; nuevos temas/vistas sin cambiar la arquitectura; identidad institucional siempre visible; **menú lateral nunca desplegable ni colapsable**; componentes reutilizables.

---

## Layout 1 — Portada (`/temas`)

## 3. Objetivo

Presentar los temas disponibles; cada tema es un acceso directo al layout interno.

## 4. Estructura

### 4.1 Encabezado

Nombre/título, descripción breve e identidad institucional; limpio, sin competir con los temas.

### 4.2 Presentación

Bloque breve: qué contiene la app, qué puede hacer el usuario, cómo entrar a los temas (indicadores generales opcionales).

### 4.3 Contenedor de temas

Tarjetas reutilizables (`TarjetaTema`) con, cuando aplique: nombre, descripción, ícono/logo, estado, fecha de actualización y acción para ingresar.

### 4.4 Navegación

Seleccionar un tema lleva a `/temas/:temaId/:vista`; la ruta identifica el tema y lo conserva entre vistas.

## 5. Reglas visuales de la portada

Sin menú lateral; tarjetas con estructura idéntica; cuadrícula que se adapta al número de temas; punto de entrada principal; desde el layout interno siempre se puede volver.

---

## Layout 2 — Navegación interna (`/temas/:temaId/:vista`)

## 6. Objetivo

Espacio de trabajo del tema: la estructura se mantiene, solo cambia el contenido central.

## 7. Estructura

Menú lateral fijo · encabezado superior · logos · área de contenido · navegación entre vistas.

## 8. Menú lateral (`Sidebar`)

### 8.1 Comportamiento

Fijo, siempre visible, **no desplegable ni colapsable**, sin hamburguesa en escritorio, el mismo para todos los temas.

### 8.2 Especificación de referencia

Ancho 250 px · alto 100vh · `position: sticky` · fondo `--uc-gradient-primary` (verde oscuro) · texto `rgba(255,255,255,.82)` · ítems con radio 11 px. Cabecera: `LogoUcundinamarca` horizontal **blanco**, 90 px de alto, centrado. Valores exactos en `globals.css`.

### 8.3 Contenido

Logo (obligatorio), etiqueta "Vistas", enlaces a resumen · indicadores · responsables · datos · seguimiento, acceso a `/consolidado` y "Volver a temas". Orden y agrupación flexibles.

### 8.4 Estados

**Activo** (nunca solo color): fondo translúcido + barra izquierda amarilla 3 px (`--uc-yellow`) + peso 600 + texto blanco puro + ícono opaco. **Disponible:** hover `rgba(255,255,255,.08)`. **Deshabilitado:** texto `rgba(255,255,255,.42)`, sin hover ni cursor.

## 9. Encabezado superior (`ViewHeader`)

Sobre el contenido, altura estable entre vistas: nombre de la vista, periodo/filtros generales y acciones. **Esquina superior derecha:** `LogoSistema` del tema y sello de acreditación.

## 10. Logo institucional

**Implementación vigente:** imagotipo en la **cabecera del menú lateral** (§8.2). El encabezado reserva la esquina superior derecha para el logo del sistema (§9). Si se reubicara, se hace en el `Sidebar`/`ViewHeader`, nunca por vista.

Siempre: visible en todas las vistas, proporciones intactas (`object-fit: contain`), área de seguridad ≥ 8–12 px, versión legible según fondo, sin uso decorativo, sin competir con el título; solo vía `LogoUcundinamarca`.

## 11. Área de contenido

Cambia según la vista sin alterar el layout: márgenes consistentes, título claro por vista, reutiliza componentes comunes, maneja carga/vacío/error.

## 12. Jerarquía de componentes

```text
Portada:  page /temas → encabezado, presentación, TarjetaTema[], PieInstitucional
Interno:  [temaId]/layout → Sidebar · VistaShell(ViewHeader + vista actual)
```

## 13. Navegación

Cada tema y vista con ruta propia, legible y compartible; el contexto del tema viaja por la ruta; historial del navegador funcional; cambiar de vista no recarga toda la app; volver a la portada no cierra sesión.

## 14. Responsive

- **Escritorio:** menú completo y fijo, encabezado horizontal, contenido amplio.
- **Tableta:** menú visible, puede reducir ancho (íconos + etiquetas breves); nunca desplegable.
- **Móvil:** barra lateral compacta fija o navegación inferior persistente; **sin hamburguesa**; logo visible; scroll vertical.

## 15. Flexibilidad

**Se permite:** agregar/reordenar vistas, íconos, filtros, breadcrumbs, ocultar opciones por permisos.
**No se permite:** fusionar portada y layout interno, menú desplegable en escritorio, logo en posición inconsistente entre vistas, layout distinto por módulo sin justificación, **duplicar el menú por página**, mezclar selección de temas con navegación interna.

## 16. Estados obligatorios

**Portada:** cargando, sin temas, error, tema deshabilitado/restringido. **Interno:** cargando, vista vacía, error, ruta o tema no encontrado, sin permisos. Cada uno con mensaje claro y una acción.

## 17. Accesibilidad

Todo navegable por teclado con foco visible; activo identificable; íconos y logo con texto alternativo; contraste suficiente; orden lógico; tarjetas activables por teclado; jerarquía semántica de títulos.

## 18. Criterios de aceptación

Portada independiente · cada tema abre su layout interno · menú lateral fijo, no colapsable · vista activa evidente · logo institucional visible y en la misma posición en todas las vistas · contenido cambia sin alterar la estructura · se vuelve a la portada · se agregan temas/vistas sin rediseño · responsive escritorio/tableta/móvil.

## 19. Resumen

> Portada para elegir el tema → layout interno con menú lateral fijo y no desplegable, navegación entre vistas e identidad institucional siempre visible. Estructura general, reutilizable y adaptable.
