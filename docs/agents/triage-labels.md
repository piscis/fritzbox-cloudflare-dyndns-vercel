# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Edit the "Label in our tracker" column to match whatever vocabulary you actually use.

## Labels that are not triage roles

`no-triage` and `spec` are **not** triage roles, so never count them as one.

- **`no-triage`** takes an issue out of triage entirely: `/triage` skips it in every
  bucket and it never gets a role. See
  [Not triage material](./issue-tracker.md#not-triage-material).
- **`spec`** says what an issue is, and sits next to its triage role (a spec from
  `/to-spec` carries `spec,ready-for-agent`). The tickets cut from a spec don't get it.
  See [Specs](./issue-tracker.md#specs).
