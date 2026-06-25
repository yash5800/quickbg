---
description: "Quick TypeScript type checking for the website project"
agent: ""
---

# TypeScript Type Check

Run TypeScript type checking on the website project to catch type errors quickly.

## Usage

```bash
cd /home/yash/Documents/projects/quickbg/website && npx tsc --noEmit 2>&1 | head -30
```

## What It Does

- Runs TypeScript compiler in "no emit" mode (just checks types, doesn't generate files)
- Shows first 30 errors for quick review
- Helps catch type issues before committing code

## When to Use

- After making changes to TypeScript files
- Before committing code
- When debugging type-related issues
- As part of code review process

## Expected Output

- If no errors: exits silently
- If errors: shows first 30 errors with file paths and line numbers

## Related Skills

- `worker-management`: For managing the worker service
- `mongodb-inspection`: For debugging data issues
