# Skills

Each skill's files live in `.agents/skills/<name>/`, `.claude/skills/<name>` is a symlink
to them, and `skills-lock.json` pins the skill to its source. `npx skills@latest` writes
all three, and the next update overwrites anything else, so change skills only through
the CLI or upstream. Commit skill changes as `chore(agents): …`.

## Add

```sh
npx skills@latest add <source> --skill <name> -a universal -a claude-code -y
```

Pass both agents: `-a universal` puts the files in `.agents/skills/` and links Claude
Code to them, while `-a claude-code` alone copies a plain folder into `.claude/skills/`.

Done when `ls -l .claude/skills/<name>` shows a symlink.

## Remove

`npx skills@latest remove <name> -y` removes the files, the symlink and the lock entry.

## Update one source

`npx skills@latest update -p -y` rewrites every lock entry. To ship one source's update
(`<src>` is its `source` in the lock, for example `mattpocock/skills`):

1. `cp skills-lock.json /tmp/skills-lock.old.json`, then run the update.
2. Restore the skill folders of every other source with `git restore`, and delete any
   new untracked folders that aren't from `<src>`.
3. Rebuild the lock from the old one, taking only `<src>`'s entries from the new one:

   ```sh
   jq -s --arg src '<src>' '.[0] as $old | .[1] as $new | $old
     | .skills = ($old.skills | with_entries(select(.value.source != $src)))
               + ($new.skills | with_entries(select(.value.source == $src)))
     | .skills |= (to_entries | sort_by(.key) | from_entries)' \
     /tmp/skills-lock.old.json skills-lock.json > /tmp/skills-lock.json \
     && mv /tmp/skills-lock.json skills-lock.json
   ```

4. Copy only `skills-lock.json` into an empty directory and run
   `npx skills@latest experimental_install` there.

Done when `git diff --stat` touches only `<src>`'s skills and lock entries, and step 4
restores every skill.

## Edit a `piscis/agent-skills` skill

`orpc-api` and the other `piscis/agent-skills` skills are authored on Forgejo at
`code.vicoli.de/piscis/agent-skills`. `github.com/piscis/agent-skills` is a push mirror
that syncs within seconds, and the lock points at the mirror.

1. Branch in a clone of the Forgejo repo, commit with a Conventional Commits title, and
   push to Forgejo.
2. `fj -H code.vicoli.de pr create --repo piscis/agent-skills`.
3. Wait for the `check-skills` action to pass:
   `fj -H code.vicoli.de actions tasks -r piscis/agent-skills`.
4. `fj -H code.vicoli.de pr merge <n> -M squash -d`.
5. Back here, update the `piscis/agent-skills` source as described above.
