# The test bench

It drives the application in a real browser — clicking, typing, finishing a
session — and reads what it shows. No database: `mock-server.mjs` serves an
in-memory Kettle API, with test data covering the formats that break (EMOM,
Tabata, AMRAP, chipper, pyramid, an "Every" block from before the merge) and
a history that gives something to compare against.

## Running it

```sh
npm install                       # inside verif/
cd .. && npm install && npx vite  # the front end, on port 5173
```

The front end has to find the test API: `VITE_API_URL=http://localhost:3001`
in a `.env` at the root.

```sh
node runner.mjs verify_recap.mjs verify_paysage.mjs
```

The runner restarts a fresh server before each suite: a suite running on the
state left by the previous one would prove nothing.

Name the suites explicitly. With no arguments the runner runs nothing at all,
and says so rather than reporting a green that covers zero assertions.

## Writing a suite

`common.mjs` carries what they all redo: signing in, starting a guided
session, reading the screen. Two traps are worth knowing:

- **Never navigate by the screen's text.** A block's last round already
  announces the next block — "dernier tour — ensuite : AMRAP" — and a pattern
  on "AMRAP" stops one step too early. `where(page)` reads `aria-valuetext`
  on the progress bar: it is the only reliable marker.
- **Normalise the spaces.** The interface writes "Tour 1 / 10" with
  non-breaking spaces; `clean()` brings them back to ordinary ones.

The selectors, the role names and the regexes stay in French: they match the
interface, which addresses French speakers. Everything else — identifiers,
comments, assertion labels — is in English.

## The discipline

A green is only worth something once it has been broken. For every mechanism
checked, we sabotage it in the code and make sure the assertion covering it
falls — and only that one. An assertion that stays green when the mechanism
is broken does not check what it claims to; it has happened, and there is no
other way to see it.
