# Playbooks por tipo de proyecto

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Volver_al_índice-2D3139?style=for-the-badge" alt="Volver al índice"></a>

---

## 🌍 Par de idioma / Language pair

- Español: **27-playbooks-por-tipo-de-proyecto.md**
- English: [../en/27-project-type-playbooks.md](../en/27-project-type-playbooks.md)


## 🗣️ Prompt amigable (copiar y pegar)

Úsalo si no eres técnico y quieres que la IA lo integre todo y te vaya guiando:

```text
Usando https://github.com/juanklagos/spec-driven-development-template, crea todo lo necesario para llevar a cabo mi proyecto de principio a fin.
Mi proyecto es: [explica tu proyecto en lenguaje simple].

Si mi proyecto es nuevo, inicialízalo con este template y GitHub Spec Kit.
Si mi proyecto ya existe, adáptalo a idea/specs/bitacora sin romper el comportamiento actual.
Guíame paso a paso según mi nivel (principiante/intermedio/avanzado), con lenguaje claro.
No omitas especificación, plan, tareas, traza de refinamiento, bitácora y validación.
```


> Un playbook es un punto de partida ya armado para un tipo de proyecto conocido. No te ahorra pensar, te ahorra la página en blanco: llegas con la idea encuadrada y una partición de specs que suele funcionar.

## 📦 Packs disponibles

### 🌐 SaaS (`playbooks/saas/`)

**Para:** productos multi-tenant con cuentas de usuario, suscripciones y panel de administración.

**Partición típica de specs:**
| Spec | Área de enfoque |
|---|---|
| 001-auth | Registro de usuarios, login, gestión de sesiones |
| 002-tenant | Aislamiento multi-tenancy, gestión de organizaciones |
| 003-billing | Planes de suscripción, integración de pagos |
| 004-dashboard | Interfaz principal, visualización de métricas |
| 005-admin | Panel de administración, gestión de usuarios, configuración |

**Lo que hay que decidir temprano:** cómo aislas los datos entre tenants. Casi todo lo demás se puede cambiar después; eso no.

---

### 🛒 E-commerce (`playbooks/ecommerce/`)

**Para:** tiendas online con catálogo, carrito, checkout y pagos.

**Partición típica de specs:**
| Spec | Área de enfoque |
|---|---|
| 001-catalog | Listado de productos, categorías, búsqueda, filtros |
| 002-cart | Carrito de compras, gestión de cantidades, persistencia |
| 003-checkout | Creación de orden, dirección, opciones de envío |
| 004-payment | Integración con pasarela de pago, confirmación |
| 005-orders | Historial de órdenes, seguimiento, actualizaciones de estado |

**Lo que hay que decidir temprano:** checkout invitado o solo con cuenta, y qué pasa cuando la pasarela de pago se cae. El inventario suele morder más tarde, pero muerde.

---

### 📱 App Móvil (`playbooks/mobile-app/`)

**Para:** apps iOS/Android con navegación propia, uso sin conexión y sincronización de datos.

**Partición típica de specs:**
| Spec | Área de enfoque |
|---|---|
| 001-navigation | Flujo de pantallas, tabs, deep linking |
| 002-auth | Login, biométricos, refresh de tokens |
| 003-data-sync | Almacenamiento offline, resolución de conflictos, sync en background |
| 004-notifications | Push notifications, alertas in-app |
| 005-core-feature | La feature principal de tu app específica |

**Lo que hay que decidir temprano:** offline-first u online-first. Esa elección arrastra el modelo de datos entero. Suma después las diferencias por plataforma y los requisitos de las tiendas.

---

### ⚙️ Backend API (`playbooks/backend-api/`)

**Para:** APIs REST o GraphQL que sirven a un frontend, a una app móvil o a terceros.

**Partición típica de specs:**
| Spec | Área de enfoque |
|---|---|
| 001-data-model | Esquema de base de datos, relaciones, migraciones |
| 002-endpoints | Diseño de rutas, validación de input, formato de respuesta |
| 003-auth-security | Autenticación, autorización, rate limiting |
| 004-integration | Conexiones con APIs de terceros, webhooks |
| 005-observability | Logging, monitoreo, tracking de errores, health checks |

**Lo que hay que decidir temprano:** cómo vas a versionar la API y con qué mecanismo autenticas (JWT, OAuth2 o API keys). Y estandariza el formato de error el primer día: reescribirlo con veinte endpoints vivos no es gratis.

---

## 🚀 Cómo activar un playbook

### Con asistencia de IA:

```text
Usando https://github.com/juanklagos/spec-driven-development-template y el playbook [NOMBRE_DEL_PACK],
ayúdame a configurar un proyecto nuevo para [MI OBJETIVO].
Usa la partición típica de specs del playbook como punto de partida.
Propón el encuadre inicial de la idea y la estructura de specs adaptada a mis necesidades específicas.
No implementes código hasta que acordemos la partición de specs.
```

### Manualmente:

1. Copia la estructura de specs sugerida del playbook a tu carpeta `specs/`
2. Llena `idea/IDEA_GENERAL.md` usando las áreas de enfoque del playbook como guía
3. Crea cada carpeta de spec usando `./scripts/new-spec.sh "nombre-feature" "Owner"`
4. Personaliza requisitos y criterios de aceptación para tu caso específico

## 💡 Crear tu propio playbook

Si tu tipo de proyecto no está cubierto, crea un nuevo playbook:

1. Crea `playbooks/tu-tipo/README.md`
2. Define: partición típica de specs, consideraciones clave, prompts específicos del dominio
3. Incluye al menos 5 specs sugeridas con áreas de enfoque
4. Agrega un prompt de IA recomendado para inicialización
