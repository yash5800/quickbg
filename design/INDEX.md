# QuickBG Design Documentation Index

Quick navigation to all design documents.

---

## 📋 Essential Documentation

### Core Architecture
- **[database.md](database.md)** - Database schema, collections, TTL, and data retention (UPDATED ✨)
- **[architecture.md](architecture.md)** - System architecture and components overview
- **[api-routes.md](api-routes.md)** - API endpoints (needs update for new schema)
- **[types.md](types.md)** - TypeScript types and interfaces (needs update for new schema)

### Development Guides
- **[getting-started.md](getting-started.md)** - Setup and installation guide
- **[workflow.md](workflow.md)** - Development workflow and processes
- **[features.md](features.md)** - Feature descriptions and capabilities

### Frontend Documentation
- **[components.md](components.md)** - React components overview
- **[pages-routes.md](pages-routes.md)** - Next.js pages and routing
- **[state-management.md](state-management.md)** - Store and state management

### Backend/Worker
- **[worker.md](worker.md)** - Worker service documentation

---

## 🔧 Database Optimization (May 2026)

### Optimization Documentation

Quick links to understand the database optimization that was implemented:

1. **[database.md](database.md)** ⭐ START HERE
   - Updated schema with removed redundancies
   - New fields: `updatedAt`, `expiresAt`
   - Progress now derived from status
   - TTL auto-deletion configured

2. **[OPTIMIZATION_SUMMARY.md](OPTIMIZATION_SUMMARY.md)** - Complete details
   - What was optimized and why
   - Before/after comparison
   - Implementation files modified

3. **[PROGRESS_DERIVATION.md](PROGRESS_DERIVATION.md)** - How progress works now
   - Status → Progress mapping (quick reference)
   - Code locations for frontend and backend
   - Best practices for developers

4. **[AUTO_DELETION_TIMELINE.md](AUTO_DELETION_TIMELINE.md)** - When data is deleted
   - TTL timeline for each collection
   - Deletion schedule and batch patterns
   - Monitoring queries

5. **[TTL_VERIFICATION_GUIDE.md](TTL_VERIFICATION_GUIDE.md)** - Verify TTL is working
   - Console log patterns to look for
   - How to monitor in production
   - Troubleshooting TTL issues

6. **[OPTIMIZATION_VERIFICATION.md](OPTIMIZATION_VERIFICATION.md)** - Implementation checklist
   - What was changed and verified
   - Testing checklist
   - Success criteria

---

## 🚀 Quick Start Path

**If you're new to QuickBG:**
1. Start with [getting-started.md](getting-started.md)
2. Read [architecture.md](architecture.md)
3. Check [features.md](features.md)

**If you're working on the database:**
1. Read [database.md](database.md) first
2. Understand progress derivation: [PROGRESS_DERIVATION.md](PROGRESS_DERIVATION.md)
3. Learn TTL timeline: [AUTO_DELETION_TIMELINE.md](AUTO_DELETION_TIMELINE.md)

**If you're verifying the optimization:**
1. Check [OPTIMIZATION_VERIFICATION.md](OPTIMIZATION_VERIFICATION.md)
2. Verify with [TTL_VERIFICATION_GUIDE.md](TTL_VERIFICATION_GUIDE.md)
3. Reference [OPTIMIZATION_SUMMARY.md](OPTIMIZATION_SUMMARY.md) for details

---

## 📊 Documentation Status

| Document | Status | Last Updated | Priority |
|----------|--------|--------------|----------|
| database.md | ✅ Updated | May 12, 2026 | 🔴 Critical |
| api-routes.md | ⚠️ Needs Review | - | 🟡 High |
| types.md | ⚠️ Needs Review | - | 🟡 High |
| worker.md | ⚠️ Needs Review | - | 🟡 High |
| features.md | ⚠️ Needs Review | - | 🟡 High |
| workflow.md | ⚠️ Needs Review | - | 🟡 High |
| architecture.md | ✅ Current | - | 🟢 Medium |
| components.md | ✅ Current | - | 🟢 Medium |
| pages-routes.md | ✅ Current | - | 🟢 Medium |
| state-management.md | ✅ Current | - | 🟢 Medium |
| getting-started.md | ✅ Current | - | 🟢 Medium |

---

## 🔄 Key Changes in Database Optimization

**Removed Fields (Redundant):**
- ❌ `progress` → Derived from `status`
- ❌ `completedAt` → Inferred from status
- ❌ `queuePosition` → Computed on-demand
- ❌ `estimatedWait` → Calculated from queue

**Added Fields:**
- ✅ `updatedAt` → Track modifications
- ✅ `expiresAt` → TTL auto-deletion (10 minutes)

**Impact:**
- 📉 25-30% smaller documents
- 🗑️ Automatic cleanup (no manual delete)
- 📊 Real-time data accuracy

---

## 📝 Next Steps

Files that need review/update for new schema:

1. **api-routes.md** - Update response format examples to show no `progress` stored (still sent from API)
2. **types.md** - Update `Job` interface to remove redundant fields
3. **worker.md** - Update worker API documentation
4. **features.md** - Update cleanup feature description
5. **workflow.md** - Update workflow diagrams if they show redundant fields

---

## 💡 Tips

- Most documents are already correct, just reference `database.md` for the current schema
- Progress is still sent in API responses (just not stored - it's derived)
- Frontend code doesn't need major changes - APIs still return progress
- See [OPTIMIZATION_SUMMARY.md](OPTIMIZATION_SUMMARY.md) for list of code files modified

---

**Last Updated:** May 12, 2026  
**Maintenance:** Review quarterly for outdated information
