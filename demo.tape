# VHS tape - demo of the SDD flow (spec -> validate -> gate).
# Regenerated in CI by .github/workflows/demo.yml (charmbracelet/vhs-action).
# Local run (if vhs is installed): vhs demo.tape

Output docs/assets/demo.gif

Set FontSize 15
Set Width 1100
Set Height 620
Set Theme "Catppuccin Mocha"
Set TypingSpeed 40ms

# Scaffold FIRST: new-spec.sh refuses to run in the template root by design
# (scripts/new-spec.sh:18-22), so the previous tape recorded its own first
# command failing — on the README hero image, re-committed on every release.

Type "# Spec-Driven Development Template — the golden rule in action"
Enter
Sleep 1s

Type "./scripts/create-www-project.sh demo-app codex --no-spec-kit | tail -3"
Enter
Sleep 4s

Type "cd www/demo-app"
Enter
Sleep 1s

Type "./spec/scripts/new-spec.sh 'demo-feature' 'Demo Owner'"
Enter
Sleep 2.5s

Type "./spec/scripts/validate-sdd.sh . --strict | tail -6"
Enter
Sleep 3s

Type "./spec/scripts/check-sdd-gate.sh . | tail -6"
Enter
Sleep 3.5s

Type "# No code before approved spec and consistent plan ✅"
Enter
Sleep 2s
