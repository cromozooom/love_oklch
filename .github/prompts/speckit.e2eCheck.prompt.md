---
description: Debug failing E2E tests by locating, analyzing, running, and troubleshooting test files.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** use the user input as the test identifier to search and debug.

## Goal

Locate, analyze, run, and debug E2E tests that are failing. Provide comprehensive debugging support including test execution, failure analysis, and recommended fixes.

## Operating Constraints

**INTERACTIVE DEBUGGING**: This is an active debugging session. You will:

1. Search for and locate the test file
2. Analyze the test code and understand its purpose
3. Run the test using PowerShell commands with proper navigation
4. Analyze failures and provide debugging insights
5. Suggest and implement fixes as needed

**EXECUTION FOCUS**: Unlike read-only analysis tools, this prompt is designed for hands-on debugging and problem-solving.

## Execution Steps

### 1. Parse Test Identifier

Extract the test identifier from user input:

- Test file name (e.g., `theme-switching.spec.ts`)
- Test describe/it block name (e.g., "should toggle theme")
- Test ID or partial match string
- Path fragments (e.g., `specs/color-setter/`)

### 2. Search and Locate Test Files

Use file search tools to find matching test files in the `e2e` folder:

```bash
# Search patterns to use:
- **/*{test_name}*.spec.ts
- **/specs/**/*.spec.ts (if searching broadly)
- e2e/**/*{partial_match}*
```

If multiple matches found, list all and ask user to specify which one to debug.

### 3. Analyze Test Structure

Read and analyze the located test file:

- **Test Purpose**: Understand what the test is supposed to validate
- **Test Steps**: Identify the sequence of actions (setup, execution, assertions)
- **Selectors Used**: Note data-testid attributes and CSS selectors
- **Dependencies**: Check for utility imports, page object patterns
- **Expected vs Actual**: Understand what should happen vs what's failing

### 4. Navigate and Run Test

Execute the test using proper PowerShell navigation:

```powershell
# Standard pattern:
cd e2e; npm test {test_file_path}

# Examples:
cd e2e; npm test specs/theme-switching/theme-switching.spec.ts
cd e2e; npm test specs/color-setter/hex-color-picker.spec.ts
```

**IMPORTANT**: Always use `cd e2e; npm test` format with semicolon for PowerShell compatibility.

### 5. Analyze Test Output

Parse test execution results:

- **Passed Tests**: Note what's working correctly
- **Failed Tests**: Identify specific failure points
- **Error Messages**: Extract meaningful error information
- **Screenshots/Traces**: Reference any generated debugging artifacts
- **Timeouts**: Identify timing-related issues

### 6. Debug Failure Root Causes

Common debugging approaches:

- **Element Not Found**: Check if selectors exist in current DOM
- **Timing Issues**: Verify wait conditions and element visibility
- **State Problems**: Ensure application is in expected state before assertions
- **Environment Issues**: Check if dev server is running, ports are correct
- **Data Issues**: Verify test data setup and cleanup

### 7. Provide Debugging Insights

Output a structured debugging report:

## E2E Test Debugging Report

**Test File**: `{file_path}`
**Test Name**: `{test_description}`
**Status**: ❌ FAILING / ✅ PASSING / ⚠️ FLAKY

### Test Purpose

Brief description of what this test validates.

### Failure Analysis

| Issue             | Cause             | Impact      | Priority |
| ----------------- | ----------------- | ----------- | -------- |
| Element not found | Selector outdated | Test blocks | HIGH     |
| Timing issue      | Missing wait      | Flaky test  | MEDIUM   |

### Recommended Fixes

1. **Immediate**: Quick fixes to get test passing
2. **Structural**: Improvements to test reliability
3. **Preventive**: Changes to avoid similar issues

### Code Changes Needed

- File: `{file_path}`
- Changes: Specific line-by-line modifications

### 8. Implement Fixes

After analysis, offer to:

- Update test selectors
- Fix timing issues with proper waits
- Adjust test logic or assertions
- Update utility functions
- Improve test data setup

Ask user: "Would you like me to implement the recommended fixes?"

## Operating Principles

### Debugging Workflow

- **Start with search**: Always locate the test file first
- **Understand before running**: Analyze test code before execution
- **Run and observe**: Execute test and capture full output
- **Systematic analysis**: Work through failures methodically
- **Fix and verify**: Apply fixes and re-run to confirm

### PowerShell Navigation

- **Always navigate first**: Use `cd e2e` before running tests
- **Use semicolons**: PowerShell requires `;` for command chaining
- **Handle paths correctly**: Use forward slashes in test paths
- **Capture output**: Save test results for analysis

### Error Handling

- **No test found**: Guide user to correct test identifier
- **Multiple matches**: Present options and ask for clarification
- **Test environment issues**: Check dev server, dependencies
- **Permission issues**: Suggest running as administrator if needed

## Context

User wants to debug: $ARGUMENTS
