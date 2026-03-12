# Architecture decisions

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Back_to_index-2D3139?style=for-the-badge" alt="Back to index"></a>

---

## Purpose

This document centralizes cross-cutting decisions that affect multiple specs.

## Decision template

| Field | Description |
|---|---|
| Title | Short decision name |
| Context | Problem being solved |
| Options | Evaluated alternatives |
| Decision | Chosen option |
| Impact | Technical and business consequences |

## Short example

- Title: Authentication strategy
- Decision: Keep session using httpOnly token
- Impact: improved client-side security
