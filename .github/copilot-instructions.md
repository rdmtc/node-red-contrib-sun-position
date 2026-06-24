# Copilot Instructions for node-red-contrib-sun-position

## Project context
- This repository contains Node-RED contrib nodes for sun/moon position, scheduling, and time-based logic.
- Keep changes compatible with Node-RED 1.x+ and Node.js 8+ unless the task explicitly requires otherwise.

## Coding style
- Follow the existing JavaScript style in this repository: 4-space indentation, semicolons, single quotes, and `'use strict'` where the surrounding files use it.
- Preserve the existing JSDoc and typedef patterns used in the runtime node files.
- Prefer small, focused edits that preserve current behavior and existing flow compatibility.

## Node-RED node changes
- When changing a node, update the runtime implementation, matching editor definition, locale strings, and tests together when relevant.
- Keep configuration property names and existing behavior stable unless a breaking change is explicitly requested.
- Reuse existing helpers from the lib folder and existing node patterns instead of introducing new abstractions.
- Keep status messages, error handling, and node documentation consistent with the surrounding implementation.

## Quality expectations
- Avoid introducing new dependencies unless there is a clear need and no suitable existing helper is available.
- If behavior changes, add or update tests under the test folder and verify them with the project test commands.
- Keep examples and documentation in sync when a user-facing feature or config option changes.
