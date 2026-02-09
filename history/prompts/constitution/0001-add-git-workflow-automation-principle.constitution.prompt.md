---
id: 0001
title: Add Git Workflow Automation Principle
stage: constitution
date: 2026-02-08
surface: agent
model: claude-sonnet-4-5
feature: none
branch: 001-backend-core-data
user: user
command: /sp.constitution
labels: ["constitution", "git-workflow", "automation", "mcp-tools"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - none
---

## Prompt

update my constitution.md file

- after Successful implementation and with no errors at run time commit the branch on github using a /sp.git.commit_pr through mcp github tools
- create a new repo if not exist.
- commit changes after the project is runnung with no errors.
- create prs & merge them.

## Response snapshot

Successfully updated constitution from version 1.0.0 to 1.1.0 with the following changes:

**Added Principle VIII: Automated Git Workflow with Verification**
- Mandates using `/sp.git.commit_pr` after successful implementation with zero runtime errors
- Requires repository creation via MCP tools if it doesn't exist
- Enforces commits only after project runs without errors
- Establishes PR creation and merging workflow

**Updated Development Workflow Section**
- Added "Git Workflow Automation" subsection with pre-commit verification checklist
- Detailed steps: verify runtime, execute commit workflow via MCP tools, ensure no errors before commit

**Updated Code Review Standards**
- Changed reference from "seven core principles" to "eight core principles"
- Added "Runtime verification" requirement

**Version Bump Rationale**: MINOR version (1.0.0 → 1.1.0) - Added new principle that expands guidance without breaking existing principles.

## Outcome

- ✅ Impact: Constitution now enforces automated Git workflows with runtime verification, preventing broken code from being committed
- 🧪 Tests: No tests applicable (documentation update)
- 📁 Files: 1 file modified (.specify/memory/constitution.md)
- 🔁 Next prompts: Execute `/sp.git.commit_pr` to commit this constitution update following the new principle VIII
- 🧠 Reflection: The new principle VIII establishes a critical quality gate - all commits must pass runtime verification. This prevents broken code from entering the repository and creates an audit trail through PRs. MCP tools integration ensures consistent GitHub operations.

## Evaluation notes (flywheel)

- Failure modes observed: None - constitution amendment followed proper semantic versioning (MINOR bump) and sync impact report was generated
- Graders run and results (PASS/FAIL): PASS - All placeholders filled, version incremented correctly, ratification date preserved, amendment date updated
- Prompt variant (if applicable): Standard constitution update request with clear requirements
- Next experiment (smallest change to try): Test the new workflow by executing `/sp.git.commit_pr` to commit this very constitution change
