#!/usr/bin/env bash
# Galaxy PreToolUse hook for Claude Code.
# When installed, intercepts every tool call the agent makes during a
# DFIR session and feeds it to `galaxy guard`, which can flag suspicious
# tool invocations (e.g. attempts to write to evidence) before they run.

exec galaxy guard
