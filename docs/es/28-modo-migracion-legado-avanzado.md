# Modo migración legado avanzado

⬅️ [Volver al índice](../README.md)

---

## Objetivo

Transformar un sistema existente en specs sin romper su comportamiento actual.

## Flujo recomendado

1. Ejecutar descubrimiento:

```bash
./scripts/legacy-discovery.sh /ruta/proyecto-legado
```

2. Revisar reporte generado en `analysis/legacy-discovery/`.
3. Crear spec base con ingeniería inversa.
4. Dividir en múltiples specs si hay flujos independientes.

## Prompt recomendado

```text
Usa este template como guía principal.
Analiza el proyecto legado sin cambiar su comportamiento.
Convierte el estado actual en idea + specs baseline.
Sugiere división en specs por dominio y riesgo.
Recomienda flujo GitHub Spec Kit para la siguiente iteración.
```
