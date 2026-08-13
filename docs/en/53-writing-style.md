# How the documentation in this project is written

<!-- sdd:doc-type:start -->

> **Reference** · Facts to consult while you work. Not meant to be read end to end.

<!-- sdd:doc-type:end -->

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Back_to_index-2D3139?style=for-the-badge" alt="Back to index"></a>

---

## 🌍 Language pair / Par de idioma

- English: **53-writing-style.md**
- Español: [../es/53-estilo-de-escritura.md](../es/53-estilo-de-escritura.md)

---

## Why this guide exists

A documentation review found the same problem over and over: words the reader does not know, used before anything explains them, and eight different names for the same screen. Goodwill does not fix that. Rules do.

These rules are not invented here. They are the ones used by the platforms whose documentation works:

- [Google developer documentation style guide](https://developers.google.com/style/highlights) — second person, active voice, present tense, sentence case for headings.
- [Microsoft writing style guide](https://learn.microsoft.com/en-us/style-guide/top-10-tips-style-voice) — write like you speak, short sentences, everyday words, prune every excess word.
- [Diátaxis](https://diataxis.fr/) — tutorial, how-to, reference and explanation are four different things; mixing them is the most common cause of confusing documentation.

## The five document types

[Diátaxis](https://diataxis.fr/) rule: a document serves **one** need. Mixing them is the most common cause of confusing documentation, and it is what happened here: the builder guide was a lesson, a recipe book, a reference and an essay at once, so it grew without criteria and nobody knew where to put anything new.

Pick the type before you write. Each guide declares it in a header, generated from `site/src/guides.mjs`.

| Type | The reader wants | What it holds | What it does NOT hold |
| :--- | :--- | :--- | :--- |
| **Tutorial** | "teach me by doing" | a lesson start to finish, with a concrete result | exhaustive reference, alternatives, discussion |
| **How-to** | "help me achieve X" | the steps for one task, assuming the basics | explaining concepts from scratch |
| **Reference** | "tell me how it is" | tables and facts to consult while working | guided steps, opinions |
| **Explanation** | "help me understand why" | context, reasoning, rejected alternatives | instructions |
| **Project** | repository material | roadmap, releases, audits | none of this is product documentation |

**How to choose**: if the reader knows nothing yet, tutorial. If they know what they want and need the steps, how-to. If they are already working and need a fact, reference. If they ask "why this way?", explanation.

**The sign you mixed them**: your guide has a long table in the middle of a step-by-step walkthrough. That table is reference and wants to live apart; leave a link where it was.

To change a guide's type, edit it in `GUIDE_TYPES` and run `node scripts/sync-doc-types.mjs`. The header and the site menu both come from there, so they cannot disagree.

## The rules

### 1. An unfamiliar word is explained the first time it appears

Google's rule: spell out the term and put the abbreviation in parentheses.

- ✅ "a connector so your AI tool can run the workflow itself (MCP, the Model Context Protocol)"
- ❌ "an MCP server"

If the word has a [glossary](./04-glossary.md) entry, link it on first use **in each document**. First use per document, not per repository: nobody reads the guides in order.

### 2. One concept, one name

The list you do not stray from:

| Say | Do not say |
| :--- | :--- |
| the board | canvas, lienzo, graph (except the in-product toggle) |
| the gate | hard stop, semaphore |
| the `spec/` folder | sidecar |
| the spec | specification, bundle |
| the spec panel | drawer |
| the logbook | bitacora (in English prose) |
| your AI assistant | agent (except when you mean the agent serving the queue) |

### 3. Short sentences

One idea per sentence. More than two commas means split it. Microsoft's rule: read it aloud; if you run out of breath, it is too long.

### 4. Second person, active voice

- ✅ "Run this in your terminal"
- ❌ "The command should be executed"

### 5. Say where each command runs

A code block with no context assumes the reader knows where they are. They never do.

- ✅ "From your project's top folder, in a terminal:"
- ❌ a bare code block

And when the path depends on how it was installed, say so before showing the command.

### 6. No lists that rot

If a number can change (how many tools, how many guides), do not write it in prose or hand-list it in several places. Link to the reference that generates itself. This project got "21 tools" wrong twice while the real number was 39.

### 7. Do not promise what does not exist

Every claim about the interface is checked against the code before it ships. A guide describing a button that was removed is worse than no guide: it sends the reader looking for something that is not there.

### 8. No cleverness that gets in the way

A metaphor that does not clarify is dead weight. "A public librarian for the repository" says nothing; "it lets the AI read this repository, nothing more" says it.

## Before publishing

- [ ] Is every technical term explained or linked on first use?
- [ ] Did you use the name from the table, and only that one?
- [ ] Does any sentence carry more than two commas?
- [ ] Does every command say where it runs from?
- [ ] Does every claim about the interface exist in the code today?
- [ ] Do the English and the Spanish say the same thing?
