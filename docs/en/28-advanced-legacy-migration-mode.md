# Advanced legacy migration mode

## Goal

Transform an existing system into specs without breaking current behavior.

## Recommended flow

1. Run discovery:

```bash
./scripts/legacy-discovery.sh /path/to/legacy-project
```

2. Review generated report in `analysis/legacy-discovery/`.
3. Create baseline reverse-engineered spec.
4. Split into multiple specs when independent flows are found.

## Recommended prompt

```text
Use this template as the main guide.
Analyze the legacy project without changing behavior.
Convert the current state into idea + baseline specs.
Suggest spec split by domain and risk.
Recommend GitHub Spec Kit flow for the next iteration.
```
