# VHS tape - demo of the SDD flow (spec -> validate -> gate).
# Regenerated in CI by .github/workflows/demo.yml (charmbracelet/vhs-action).
# Local run (if vhs is installed): vhs demo.tape

Output docs/assets/demo.gif

Set FontSize 15
Set Width 1100
Set Height 620
Set Theme "Catppuccin Mocha"
Set TypingSpeed 40ms

Type "# Spec-Driven Development Template — the golden rule in action"
Enter
Sleep 1s

Type "./scripts/new-spec.sh 'demo-feature' 'Demo Owner'"
Enter
Sleep 2.5s

Type "./scripts/validate-sdd.sh . --strict | tail -8"
Enter
Sleep 3s

Type "./scripts/check-sdd-gate.sh . | tail -6"
Enter
Sleep 3s

Type "# No code before approved spec and consistent plan ✅"
Enter
Sleep 2s
