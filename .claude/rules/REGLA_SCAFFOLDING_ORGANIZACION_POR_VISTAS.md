---
paths:
  - "src/app/**/page.tsx"
  - "src/app/**/_components/**"
  - "src/app/**/_lib/**"
  - "src/components/**"
  - "src/features/**"
---

# Regla de scaffolding y organización por vistas

## 1. Propósito

El código se organiza **por vista** y cada componente vive **lo más cerca posible de donde se usa** (colocación). Usado en una sola vista → dentro de la vista. Compartido o transversal → zona general.

## 2. Principios

Colocación · **promoción** (mover, nunca copiar) · sin abstracción prematura · responsabilidad única · **sin dependencias cruzadas** entre vistas.

## 3. General vs. específico

### 3.1 General (`src/components/`, `src/features/`, `src/lib/`, `src/types/`)

Solo si cumple al menos una: se usa en **2+ vistas**; es primitivo de UI; es identidad (`LogoUcundinamarca`); es estructura de layout (`Sidebar`, `ViewHeader`); es base transversal (`ChartCard`); es dato/servicio compartido (`lib/om`).

### 3.2 Específico (obligatorio)

Lo que se usa en **una sola vista** —aunque sea grande o parezca reutilizable— vive en su `_components/`, **nunca** en `features/` ni `components/`.

## 4. Estructura de una vista (obligatoria)

```
app/temas/[temaId]/<vista>/        # resumen · indicadores · responsables · datos · seguimiento
├── page.tsx                       # solo el contenido de esta vista
├── _components/                   # componentes exclusivos
├── _hooks/                        # opcional
└── _lib/                          # opcional: utilidades/tipos exclusivos
```

Una **carpeta física por vista**; prohibido un `[vista]` dinámico que resuelva varias con condicionales. El prefijo `_` evita que se creen rutas. Lo mismo aplica a rutas de primer nivel como `consolidado/`.

## 5. Regla de promoción

1. Nace colocado en la primera vista que lo necesita.
2. Cuando una **segunda vista** lo necesita: se **mueve** a la zona general y se actualizan los imports de ambas.
3. Si vuelve a usarse en una sola vista, puede recolocarse (opcional).

## 6. Árbol de decisión

¿Primitivo, identidad, layout o base de gráfica? → general. ¿2+ vistas? → general. ¿Una sola vista? → colocado. ¿Duda? → colocado.

## 7. Prohibiciones

- Componente de una sola vista en zona general.
- Importar `_components/` de otra vista (promover en su lugar).
- Copiar/pegar componentes entre vistas.
- Reimplementar layout o identidad dentro de una vista.
- Estructuras de carpeta distintas por vista sin justificación.

## 8. Flexibilidad

No fija cuántos componentes tiene una vista. Se permite subdividir, anidar `_components/` y mover entre colocado/general según evolucione el uso.

## 9. Instrucción para Claude

Al crear o modificar vistas: carpeta propia con `page.tsx` y `_components/`; reutilizar lo general existente; promover al segundo uso; nunca importar privados de otra vista; actualizar la documentación en el mismo cambio.

## 10. Criterios de aceptación

Una carpeta por vista · sin `[vista]` · cada `_components/` con solo lo suyo · lo compartido en zona general sin duplicados · sin imports cruzados de privados · patrón consistente · nuevas vistas sin tocar las existentes.

## 11. Resumen

> Específico de una vista → su `_components/`; reutilizable → `src/components/`. Se nace colocado y se promueve (moviendo) al segundo uso.
