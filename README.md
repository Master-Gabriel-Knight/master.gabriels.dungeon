# master.gabriels.dungeon — Dual Role Build

**Passwords**
- Supplicant: `masterisgod`
- Master: `Iamthemaster`

**Master mode adds**
- Witness (local) ledger: see sessions on your device; export JSON.
- Master Console: compose broadcast messages.
  - Download `messages.json` for manual publish (commit to repo under `data/messages.json`), or
  - Optional Gist publish (enter Gist ID + token in Settings). Supplicants can read from that public gist.

**Notes**
- Without a backend, global witness requires a remote store. This build supports GitHub Gist as a simple option.
- Tokens are stored locally (in your browser) and never committed.
