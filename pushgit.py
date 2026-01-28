import os
import subprocess
import sys
from pathlib import Path

REPO_URL = "https://github.com/WSSITTT/KeyshaunPortfolio.git"
BRANCH = "main"

def run(cmd: list[str], cwd: str | None = None) -> str:
    p = subprocess.run(cmd, cwd=cwd, text=True, capture_output=True)
    if p.returncode != 0:
        raise RuntimeError(
            f"Command failed: {' '.join(cmd)}\n\nSTDOUT:\n{p.stdout}\n\nSTDERR:\n{p.stderr}"
        )
    return p.stdout.strip()

def exists(cmd: list[str]) -> bool:
    try:
        subprocess.run(cmd, capture_output=True)
        return True
    except FileNotFoundError:
        return False

def main():
    root = Path(__file__).resolve().parent

    if not exists(["git", "--version"]):
        print("ERROR: git is not installed or not in PATH.")
        sys.exit(1)

    os.chdir(root)

    # init if needed
    if not (root / ".git").exists():
        print("Initializing git repo...")
        run(["git", "init"])
        # ensure branch name is main
        run(["git", "checkout", "-B", BRANCH])

    # ensure remote is set
    remotes = run(["git", "remote"]).splitlines()
    if "origin" not in remotes:
        print("Adding origin remote...")
        run(["git", "remote", "add", "origin", REPO_URL])
    else:
        # ensure origin URL is correct
        current = run(["git", "remote", "get-url", "origin"])
        if current != REPO_URL:
            print("Updating origin remote URL...")
            run(["git", "remote", "set-url", "origin", REPO_URL])

    # stage + commit
    run(["git", "add", "-A"])
    status = run(["git", "status", "--porcelain"])
    if not status:
        print("No changes to commit.")
    else:
        msg = "Update portfolio site"
        if len(sys.argv) > 1:
            msg = " ".join(sys.argv[1:])
        print(f"Committing: {msg}")
        run(["git", "commit", "-m", msg])

    # push
    print(f"Pushing to {BRANCH}...")
    try:
        run(["git", "push", "-u", "origin", BRANCH])
    except RuntimeError as e:
        # common case: branch exists remotely, local differs
        print(str(e))
        print("\nIf prompted for credentials, use a GitHub Personal Access Token (PAT) as the password.")
        print("If push was rejected, run:")
        print("  git pull --rebase origin main")
        print("then rerun this script.")
        sys.exit(1)

    print("Done.")

if __name__ == "__main__":
    main()
