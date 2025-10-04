# Offline Sync Testing Guide

This guide explains how to test the offline sync functionality using two database instances.

## Overview

The offline sync feature allows you to:

1. **Generate Mirror Fixture** - Download a snapshot of viewable data for offline work
2. **Import Mirror Fixture** - Import the snapshot into your offline instance
3. **Generate Update Fixture** - Create a fixture of your local changes
4. **Import Update Fixture** - Sync your local changes back to the server

## Two-Database Testing Setup

### Running Two Instances

Run two separate instances of the app with different databases:

**Terminal 1 - Main Instance (Port 3000)**
```bash
npm run dev
```
- Uses `sqlite.db`
- Runs on `http://localhost:3000`
- Represents your "online server"

**Terminal 2 - Offline Instance (Port 3001)**
```bash
npm run dev2
```
- Uses `sqlite2.db`
- Runs on `http://localhost:3001`
- Represents your "offline laptop"

### Initial Setup

1. **Seed both databases:**
   ```bash
   # Terminal 1 - Main database
   npm run db:seed

   # Terminal 2 - Secondary database
   npm run db:seed2
   ```

2. **Sign in to both instances:**
   - Port 3000: Sign in as admin@example.com
   - Port 3001: Sign in as admin@example.com

## Testing Workflow

### Phase 1: Prepare for Offline Work

**On Main Instance (Port 3000):**

1. Create some scraps as different users
2. Make some scraps public, some private
3. Navigate to Studio → Fixtures
4. Click "Generate Mirror Fixture"
5. Download the JSON file (e.g., `mirror-fixture-2025-01-04.json`)

**On Offline Instance (Port 3001):**

1. Navigate to Studio → Fixtures
2. Click "Import Mirror Fixture"
3. Upload the downloaded JSON file
4. Confirm the import (this will wipe all scraps!)
5. Verify you can see:
   - All public scraps (mapped to dummy user)
   - Your own scraps (both public and private)
   - Content is hidden for other users' private scraps

### Phase 2: Work Offline

**On Offline Instance (Port 3001):**

1. Create new scraps
2. Edit existing scraps you own
3. Try editing scraps owned by dummy user (should fail)
4. Create nested scraps

### Phase 3: Sync Back to Server

**On Offline Instance (Port 3001):**

1. Navigate to Studio → Fixtures
2. Click "Generate Update Fixture"
3. Optionally select "Since date" to only sync recent changes
4. Download the JSON file (e.g., `update-fixture-2025-01-04.json`)

**On Main Instance (Port 3000):**

1. Navigate to Studio → Fixtures
2. Click "Import Update Fixture"
3. Upload the downloaded JSON file
4. Review the results page showing:
   - **Updated**: Scraps successfully synced
   - **Created**: New scraps added
   - **Skipped**: Conflicts or permission issues
   - **Parent Created**: Placeholder parents for orphaned nested scraps

## Test Scenarios

### Scenario 1: Basic Sync
- **Setup**: Create 5 public scraps on main instance
- **Test**: Mirror to offline, verify all 5 appear
- **Expected**: All scraps visible, owned by dummy user

### Scenario 2: Private Scraps
- **Setup**: Create private scrap on main instance
- **Test**: Mirror to offline as different user
- **Expected**: Private scrap not included in mirror

### Scenario 3: Own Private Scraps
- **Setup**: Create private scrap as admin on main
- **Test**: Mirror to offline as admin
- **Expected**: Private scrap included with full content

### Scenario 4: Update Conflict - Not Owner
- **Setup**: Mirror fixture to offline
- **Test**: Try to update dummy user's scrap, sync back
- **Expected**: Update skipped with "not_owner" reason

### Scenario 5: Update Conflict - Newer on Server
- **Setup**:
  1. Create scrap on main (updated at 10:00)
  2. Mirror to offline
  3. Edit same scrap on main (updated at 11:00)
  4. Edit same scrap on offline (still thinks it's 10:00)
- **Test**: Sync offline changes back
- **Expected**: Update skipped with "newer_on_server" reason

### Scenario 6: Nested Scraps with Missing Parent
- **Setup**: On offline, create scrap nested in non-existent parent
- **Test**: Sync back to main
- **Expected**: Placeholder parent created automatically

### Scenario 7: Mixed Results
- **Setup**:
  1. Create new scrap on offline (should create)
  2. Update own scrap (should update)
  3. Try to update dummy scrap (should skip)
- **Test**: Sync all changes
- **Expected**: Results page shows all three outcomes

## Expected Behavior

### Mirror Fixture Generation
- ✅ Includes all public scraps
- ✅ Includes your own private scraps
- ✅ Excludes other users' private scraps
- ✅ Maps all other users to single dummy user
- ✅ No passwords included
- ✅ Content hidden for invisible scraps you don't own

### Mirror Fixture Import
- ⚠️ **DESTRUCTIVE**: Wipes all existing scraps
- ✅ Confirmation dialog before proceeding
- ✅ Imports all users (dummy + you)
- ✅ Imports all scraps

### Update Fixture Generation
- ✅ Only includes your own scraps
- ✅ Can filter by date (changes since last sync)
- ✅ Preserves original IDs for matching

### Update Fixture Import
- ✅ Updates scraps if owned by you AND server version older
- ✅ Creates new scraps that don't exist
- ✅ Creates placeholder parents for orphaned nested scraps
- ✅ Skips scraps not owned by you
- ✅ Skips scraps with newer server version
- ✅ Shows detailed results page

## File Structure

```
src/
├── lib/
│   ├── fixtures.ts                 # Core fixture utilities
│   └── __tests__/
│       └── fixtures.test.ts        # 21 comprehensive tests
└── app/
    └── studio/
        └── fixtures/
            ├── page.tsx            # Main fixtures management page
            ├── generate-mirror/    # Generate mirror fixture
            ├── import-mirror/      # Import mirror fixture
            ├── generate-update/    # Generate update fixture
            └── import-update/      # Import update fixture
```

## Database Files

- `sqlite.db` - Main database (port 3000)
- `sqlite2.db` - Test database (port 3001)
- Both added to `.gitignore`

## Testing Checklist

Before flight:
- [ ] Run both instances
- [ ] Seed both databases
- [ ] Generate mirror fixture from main
- [ ] Import mirror fixture to offline
- [ ] Verify all expected scraps visible
- [ ] Verify dummy user mapping works

During flight (offline):
- [ ] Create new scraps
- [ ] Edit your existing scraps
- [ ] Create nested scraps
- [ ] Note what you changed

After flight:
- [ ] Generate update fixture from offline
- [ ] Import update fixture to main
- [ ] Verify updates applied correctly
- [ ] Check skipped items for conflicts
- [ ] Verify placeholder parents created if needed

## API Endpoints (To Be Implemented)

- `POST /api/fixtures/mirror/generate` - Generate mirror fixture
- `POST /api/fixtures/mirror/import` - Import mirror fixture
- `POST /api/fixtures/update/generate` - Generate update fixture
- `POST /api/fixtures/update/import` - Import update fixture

## Security Considerations

- ✅ No passwords in fixtures
- ✅ Private scraps filtered correctly
- ✅ Ownership checked before updates
- ✅ Content hidden for invisible scraps
- ⚠️ Fixture files should be encrypted for sensitive data
- ⚠️ Confirm dialogs prevent accidental data loss
