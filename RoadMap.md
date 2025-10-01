# Bray Report - Development Roadmap

## Overview
This roadmap outlines the development plan for the Bray Report platform, which consists of two main sections:
1. **Blog Platform** - Content management and public blog (mostly complete)
2. **Family Section** - GEDCOM family tree visualization and genealogy management (new feature)

---

## Phase 1: Blog Platform Completion (High Priority)

### =' Cleanup & Optimization
- [ ] **Remove Legacy Code** (Effort: Medium)
  - Remove unused Projects/Stories/Chapters components
  - Clean up legacy routes and API endpoints
  - Remove obsolete database migration files
- [ ] **Remove Debug Code** (Effort: Small)
  - Clean up console.log statements from recent fixes
  - Remove temporary debugging CSS classes

### ( Core Features Completion
- [ ] **Tag Filtering Implementation** (Effort: Medium)
  - Add tag filtering to admin dashboard (category filtering works)
  - Implement tag filtering on public blog
  - Ensure tag display consistency
- [ ] **Search Functionality** (Effort: Medium)
  - Implement backend search API for posts
  - Add search functionality to admin dashboard
  - Add search to public blog
- [ ] **Enhanced Post Management** (Effort: Small)
  - Verify all CRUD operations work correctly
  - Test publishing workflow thoroughly

### <� User Experience
- [ ] **Error Handling** (Effort: Small)
  - Improve user-facing error messages
  - Add proper loading states for all async operations
- [ ] **Responsive Design Testing** (Effort: Small)
  - Test and fix mobile/tablet layout issues
  - Ensure navigation works on all screen sizes

### =
 SEO & Performance
- [ ] **SEO Meta Tags** (Effort: Small)
  - Verify all pages have proper meta tags
  - Add Open Graph tags for social sharing
- [ ] **Performance Optimization** (Effort: Medium)
  - Optimize image loading and display
  - Review and optimize database queries

---

## Phase 2: Family Section Foundation (New Feature)

### =� Database Design
- [ ] **Family Data Schema** (Effort: Large)
  - Design Person table (id, names, dates, gender, notes)
  - Design Family table (marriage info, relationships)
  - Design Relationship table (parent-child, spouse connections)
  - Create indexes for genealogy queries
- [ ] **GEDCOM File Management** (Effort: Medium)
  - Extend existing file upload for .ged files
  - Create GEDCOM_Files table to track uploaded files
  - Add admin interface for managing GEDCOM uploads

### = GEDCOM Parser
- [ ] **Parser Implementation** (Effort: Large)
  - Research and implement GEDCOM file format parser
  - Parse individuals (INDI records) into Person table
  - Parse families (FAM records) into Family/Relationship tables
  - Handle dates, places, notes, and custom fields
- [ ] **Data Validation** (Effort: Medium)
  - Validate GEDCOM file format before parsing
  - Handle parsing errors gracefully
  - Prevent duplicate data from multiple uploads

### <3 Basic Tree Visualization
- [ ] **Tree Component Architecture** (Effort: Large)
  - Research tree visualization libraries (D3.js, vis.js, etc.)
  - Create basic tree layout component
  - Implement person nodes with basic info display
- [ ] **Navigation & Layout** (Effort: Medium)
  - Add /family route and page structure
  - Create family section navigation
  - Implement authentication check for family access

---

## Phase 3: Family Section Enhancement

### <� Interactive Tree Features
- [ ] **Advanced Tree UI** (Effort: Large)
  - Interactive pan/zoom functionality
  - Person detail cards on hover/click
  - Family relationship indicators (marriage, parent-child)
  - Birth/death date display on nodes
- [ ] **Multiple Tree Views** (Effort: Medium)
  - Ancestor tree view (going up generations)
  - Descendant tree view (going down generations)
  - Family group sheets
- [ ] **Person Detail Pages** (Effort: Medium)
  - Individual person detail views
  - Life timeline display
  - Family connections and relationships
  - Notes and biographical information

### =d User Management & Permissions
- [ ] **Access Control** (Effort: Small)
  - Ensure family section requires login
  - Admin-only editing permissions
  - Read-only access for regular users
- [ ] **Admin Tools** (Effort: Medium)
  - Upload new GEDCOM files
  - Manage existing family data
  - Edit person information and relationships

---

## Phase 4: Integration & Polish

### = Cross-Platform Features
- [ ] **Unified Navigation** (Effort: Small)
  - Integrate family section into main navigation
  - Consistent styling between blog and family sections
- [ ] **Shared Components** (Effort: Small)
  - Reuse existing auth, navigation, and styling
  - Consistent admin dashboard experience

### =� Production Readiness
- [ ] **Security Hardening** (Effort: Medium)
  - Input validation for all forms
  - File upload security for GEDCOM files
  - Rate limiting for API endpoints
- [ ] **Performance & Accessibility** (Effort: Medium)
  - Tree rendering optimization for large families
  - Accessibility compliance (ARIA labels, keyboard nav)
  - Mobile responsiveness for tree visualization

---

## Technical Architecture Notes

### Database Considerations
- **Storage Approach**: Store parsed GEDCOM data in MySQL for optimal querying and performance
- **File Size**: Handle 400KB+ GEDCOM files with potentially thousands of individuals
- **Relationships**: Complex many-to-many relationships between persons, families, and events

### Technology Stack Additions
- **GEDCOM Parser**: Node.js library (gedcom-js or custom parser)
- **Tree Visualization**: D3.js or similar for interactive family trees
- **File Processing**: Server-side GEDCOM parsing and database population

### Integration Points
- **Authentication**: Reuse existing JWT auth system
- **File Management**: Extend current file upload system
- **Styling**: Use existing CSS framework and theme
- **Navigation**: Integrate into current navigation structure

---

## Effort Estimates

| Phase | Total Effort | Key Challenges |
|-------|--------------|----------------|
| **Phase 1** (Blog Completion) | 2-3 weeks | Tag filtering, search implementation |
| **Phase 2** (Family Foundation) | 4-5 weeks | GEDCOM parsing, database design |
| **Phase 3** (Family Enhancement) | 3-4 weeks | Tree visualization, complex UI |
| **Phase 4** (Integration & Polish) | 1-2 weeks | Performance optimization |

**Total Estimated Effort**: 10-14 weeks

---

## Success Criteria

### Blog Platform
-  Clean, maintainable codebase without legacy components
-  Complete post management with categories and tags
-  Search functionality for content discovery
-  SEO-optimized public blog
-  Mobile-responsive design

### Family Section
-  Successfully parse and display 4-8 GEDCOM files
-  Interactive family tree visualization
-  Person detail views with biographical information
-  Admin-controlled content management
-  Secure, authenticated access

### Integration
-  Unified navigation and user experience
-  Consistent styling and branding
-  Production-ready security and performance
-  Maintainable and extensible architecture

---

## Next Steps

1. **Complete Phase 1** - Focus on blog platform cleanup and core features
2. **Begin Phase 2** - Start "roughing out" family section architecture
3. **Iterate and refine** - Adjust roadmap based on implementation learnings
4. **Test thoroughly** - Ensure both sections work seamlessly together

---

*Last Updated: [Current Date]*
*Status: Planning Phase*