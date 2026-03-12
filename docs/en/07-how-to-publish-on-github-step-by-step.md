# How to publish on GitHub step by step

## Prerequisites

- A GitHub account
- Git installed locally

## Step 1: Create repository on GitHub

1. Open GitHub
2. Create a new repository
3. Copy repository URL

## Step 2: Initialize local repository

From the template folder:

```bash
git init
git add .
git commit -m "Initial template release"
```

## Step 3: Connect to GitHub

```bash
git branch -M main
git remote add origin <REPOSITORY_URL>
git push -u origin main
```

## Step 4: Verify visible files

Confirm these files appear on GitHub:

- `README.md`
- `LICENSE`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `docs/`

## Step 5: Create first release tag

```bash
git tag v1.0.0
git push origin v1.0.0
```
