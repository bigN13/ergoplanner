# Claude CLI Build Workflow - Quality Assurance Pipeline

## Overview

This workflow ensures code quality and error-free development by implementing a continuous build-review-fix cycle after each task completion. Follow this workflow for every feature or task implementation.

## Workflow Phases

### Phase 1: Pre-Task Setup

1. **Verify Current State**
   ```
   - Check current git branch
   - Ensure working directory is clean
   - Run initial build to confirm baseline
   - Document any existing warnings
   ```

2. **Create Task Branch** (Optional)
   ```
   - Create feature branch: git checkout -b feature/task-name
   - Or continue on current branch if appropriate
   ```

### Phase 2: Task Implementation

1. **Implement the Required Feature/Task**
   ```
   - Follow task specifications
   - Write code according to project conventions
   - Include appropriate error handling
   - Add necessary comments and documentation
   ```

### Phase 3: Build and Error Resolution Loop

**IMPORTANT: This loop continues until the build is completely clean (0 errors, 0 warnings)**

#### Step 1: Initial Build

**For .NET Projects:**
```bash
# Clean and build with detailed verbosity
dotnet clean
dotnet build --no-incremental /warnaserror /p:TreatWarningsAsErrors=true

# If build fails, capture output:
dotnet build --no-incremental /warnaserror > build-output.txt 2>&1
```

**For Node.js Projects:**
```bash
# Clean and install
rm -rf node_modules package-lock.json
npm install

# Build with strict settings
npm run build -- --strict

# Run linting
npm run lint -- --max-warnings 0

# Type checking (if TypeScript)
npx tsc --noEmit --strict
```

**For Python Projects:**
```bash
# Clean pyc files
find . -type f -name "*.pyc" -delete
find . -type d -name "__pycache__" -delete

# Run linting and type checking
pylint **/*.py --fail-under=10
mypy . --strict
flake8 . --max-line-length=120

# Run tests
pytest --tb=short
```

#### Step 2: Review Build Output

1. **Categorize Issues:**
   ```
   - Compilation Errors (Priority 1)
   - Type Errors (Priority 1)
   - Warnings (Priority 2)
   - Code Style Issues (Priority 3)
   - TODO Comments (Priority 4)
   ```

2. **Document All Issues:**
   Create a temporary file `build-issues.md`:
   ```markdown
   ## Build Issues - [Date/Time]
   
   ### Errors (X total)
   1. [File:Line] - Error description
   2. ...
   
   ### Warnings (X total)
   1. [File:Line] - Warning description
   2. ...
   ```

#### Step 3: Fix All Issues

**Fix Order:**
1. **Compilation/Syntax Errors First**
   - Fix one error at a time
   - Rebuild after each fix to see cascading effects

2. **Type Errors and Null Reference Issues**
   - Add proper null checks
   - Fix type mismatches
   - Update interface implementations

3. **Warnings**
   - Unused variables: Remove or implement
   - Deprecated methods: Update to current versions
   - Missing XML documentation: Add summaries
   - Async warnings: Add proper async/await

4. **Code Style Issues**
   - Format code according to project standards
   - Fix naming convention violations
   - Resolve line length issues

#### Step 4: Rebuild and Verify

```bash
# After fixing, rebuild with same strict settings
# Repeat Step 1 build commands

# Verify output shows:
# - Build succeeded
# - 0 Error(s)
# - 0 Warning(s)
```

### Phase 4: Code Review and Improvements

Once build is clean, review code for quality improvements:

#### Step 1: Automated Code Analysis

**For .NET:**
```bash
# Run code analysis
dotnet format --verify-no-changes
dotnet analyze

# Security scanning
dotnet list package --vulnerable
```

**For Node.js:**
```bash
# Security audit
npm audit

# Bundle size analysis (if applicable)
npm run analyze

# Check for outdated packages
npm outdated
```

#### Step 2: Manual Code Review Checklist

Review the implemented code for:

1. **Performance Improvements**
   ```
   - Inefficient loops → Use LINQ/.map/.filter appropriately
   - Multiple database calls → Batch operations
   - Large memory allocations → Use streaming/pagination
   - Synchronous I/O → Convert to async
   ```

2. **Code Clarity**
   ```
   - Complex methods → Break into smaller functions
   - Magic numbers → Extract to named constants
   - Nested conditionals → Early returns or strategy pattern
   - Long parameter lists → Use objects/records
   ```

3. **Error Handling**
   ```
   - Missing try-catch blocks
   - Generic exception catching → Specific exception types
   - Silent failures → Proper logging
   - Missing validation → Add input validation
   ```

4. **Security Concerns**
   ```
   - SQL injection risks → Use parameterized queries
   - XSS vulnerabilities → Encode output
   - Hardcoded secrets → Use configuration
   - Missing authentication checks
   ```

5. **Test Coverage**
   ```
   - Missing unit tests for new methods
   - Edge cases not covered
   - Error scenarios not tested
   ```

#### Step 3: Apply Improvements

1. **Implement Each Improvement**
   - Make one improvement at a time
   - Keep changes focused and atomic

2. **Rebuild After Each Change**
   - Ensure no new errors introduced
   - Run relevant tests

### Phase 5: Final Build and Test

1. **Complete Build Pipeline**
   ```bash
   # Clean everything
   git clean -xfd (careful with this!)
   
   # Fresh build
   [Use appropriate build command]
   
   # Run all tests
   [Use appropriate test command]
   
   # Verify 0 errors, 0 warnings
   ```

2. **Run Integration Tests** (if applicable)
   ```bash
   # API tests
   # UI tests
   # End-to-end tests
   ```

### Phase 6: Git Commit

Only proceed if build is completely clean:

1. **Stage Changes**
   ```bash
   # Review changes
   git status
   git diff
   
   # Stage files
   git add -A
   ```

2. **Commit with Descriptive Message**
   ```bash
   git commit -m "feat: [task description]

   - Implementation details
   - Error fixes applied
   - Improvements made
   
   Build: ✓ 0 errors, 0 warnings
   Tests: ✓ All passing"
   ```

3. **Verify Commit**
   ```bash
   # Check commit
   git log -1 --stat
   
   # Ensure nothing left unstaged
   git status
   ```

### Phase 7: Post-Task Validation

1. **Final Verification**
   ```
   - Build one more time from clean state
   - Run application/service locally
   - Perform smoke test of new feature
   - Check for any runtime errors
   ```

2. **Update Documentation**
   ```
   - Update README if needed
   - Add/update code comments
   - Update API documentation
   - Update CHANGELOG
   ```

## Continuous Monitoring

### During Development

1. **Enable File Watchers**
   ```bash
   # .NET
   dotnet watch build
   
   # Node.js
   npm run watch
   
   # Python
   watchmedo auto-restart --patterns="*.py" python app.py
   ```

2. **Use IDE Features**
   - Enable real-time error highlighting
   - Configure auto-format on save
   - Set up pre-commit hooks

### Build Failure Recovery

If build continues to fail:

1. **Rollback Approach**
   ```bash
   # Create backup branch
   git branch backup/current-attempt
   
   # Reset to last known good state
   git reset --hard HEAD~1
   
   # Re-implement with different approach
   ```

2. **Incremental Implementation**
   - Break task into smaller subtasks
   - Implement and verify each subtask
   - Commit working increments

## Workflow Summary Checklist

For each task, ensure:

- [ ] Pre-task build is clean
- [ ] Task implemented according to spec
- [ ] Build completes with 0 errors
- [ ] Build completes with 0 warnings
- [ ] Code review improvements applied
- [ ] All tests passing
- [ ] Final build is clean
- [ ] Changes committed to git
- [ ] Documentation updated
- [ ] Feature tested locally

## Quick Commands Reference

### One-Line Build Checks

**.NET:**
```bash
dotnet build --no-incremental /warnaserror && echo "✓ Build Clean" || echo "✗ Build Failed"
```

**Node.js:**
```bash
npm run build && npm run lint -- --max-warnings 0 && echo "✓ Build Clean" || echo "✗ Build Failed"
```

**Python:**
```bash
python -m py_compile **/*.py && pylint **/*.py --fail-under=10 && echo "✓ Build Clean" || echo "✗ Build Failed"
```

## Notes

- This workflow is intensive but ensures high code quality
- Adjust error tolerance based on project phase (stricter for production)
- Some legacy projects may need gradual warning reduction
- Document any suppressed warnings with justification
- Consider automating this workflow with CI/CD pipelines