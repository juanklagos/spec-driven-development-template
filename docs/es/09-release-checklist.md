# Checklist de publicación (Release Checklist)

> 📌 **Inicio obligatorio:** antes de trabajar, clona (o abre) este repositorio y sigue esta documentación como fuente de verdad.
>
> ```bash
> git clone https://github.com/juanklagos/spec-driven-development-template.git
> cd spec-driven-development-template
> ```
>
> Si ya tienes el repositorio local, usa siempre su guía antes de pedir implementación.

## ⭐ Uso explícito del repositorio base

Usa siempre este repositorio como referencia principal:

- `https://github.com/juanklagos/spec-driven-development-template`

### 🆕 Caso 1: crear un proyecto nuevo desde esta base

Prompt sugerido para la IA:

```text
Usando https://github.com/juanklagos/spec-driven-development-template crea un proyecto nuevo para [OBJETIVO].
Clona el repositorio base, inicializa la estructura, y guíame paso a paso para definir idea, primera spec y bitácora.
No saltes pasos.
```

### ♻️ Caso 2: adaptar un proyecto existente usando esta base

Prompt sugerido para la IA:

```text
Usando https://github.com/juanklagos/spec-driven-development-template y su guía, adapta este proyecto existente: [RUTA_DEL_PROYECTO].
Mantén el código actual, integra la estructura idea/specs/bitacora, crea la primera spec basada en lo que ya existe y deja trazabilidad completa.
```

### ✅ Resultado mínimo esperado

- Proyecto creado o adaptado con estructura estándar.
- Primera especificación creada.
- Bitácora inicial registrada.
- Próximo paso claro para continuar.


Usa esta lista antes de publicar la plantilla en GitHub.

## 1. Validación de contenido

- [ ] El `README.md` explica claramente objetivo, estructura y uso.
- [ ] La carpeta `idea/` tiene plantilla de idea general.
- [ ] La carpeta `specs/` tiene reglas, índice y plantilla.
- [ ] La carpeta `bitacora/` tiene estructura y plantillas.
- [ ] Existe al menos un ejemplo completo de especificación (`001-ejemplo-inicial`).

## 2. Integración con GitHub Spec Kit

- [ ] Existe guía específica de integración (`docs/08-integracion-github-spec-kit.md`).
- [ ] Se explican comandos de instalación e inicialización.
- [ ] Se explica el flujo de comandos recomendado (`constitution`, `specify`, `plan`, `tasks`, `implement`).
- [ ] Existe script de inicialización con Spec Kit (`scripts/init-project-with-spec-kit.sh`).

## 3. Archivos de comunidad y gobernanza

- [ ] `LICENSE` presente.
- [ ] `CONTRIBUTING.md` presente.
- [ ] `CODE_OF_CONDUCT.md` presente.
- [ ] Plantillas de issue y pull request en `.github/`.

## 4. Calidad de lenguaje

- [ ] No hay siglas sin explicación.
- [ ] El lenguaje es comprensible para personas nuevas y profesionales.
- [ ] La documentación evita términos ambiguos.

## 5. Preparación técnica para publicar

- [ ] Git inicializado en el repositorio.
- [ ] Primer commit realizado.
- [ ] Rama principal definida (`main`).
- [ ] Repositorio remoto conectado.
- [ ] Push inicial realizado.

## 6. Metadata recomendada en GitHub

- [ ] Descripción breve del repositorio.
- [ ] Temas (topics) añadidos. Recomendados:
  - `spec-driven-development`
  - `spec-kit`
  - `template`
  - `documentation`
  - `ai-workflow`
- [ ] Sitio o enlace de referencia (opcional).

## 7. Versionado inicial

- [ ] Crear etiqueta inicial:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## 8. Verificación final

- [ ] Cualquier persona puede seguir la guía sin pedir contexto adicional.
- [ ] La plantilla se puede inicializar con `scripts/init-project.sh`.
- [ ] La plantilla se puede inicializar con `scripts/init-project-with-spec-kit.sh`.
