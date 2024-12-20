# Frontend Data Fetching Standardization

## Current Data Fetching Patterns

1. **SWR Hooks**:

   - ✅ `useUsers` - Standardized with new query and mutation hooks
   - ✅ `useOrganizations` - Standardized with new query and mutation hooks
   - Custom SWR implementations in various components

2. **Direct API Calls**:

   - Using `api` instance from `@/lib/api`
   - Mix of direct calls and SWR fetcher

3. **Authentication**:
   - Token-based auth with refresh mechanism
   - Auth state management through context

## Implementation Progress

### ✅ Completed Steps

1. Created new branch `feature/data-fetching-standardization`
2. Created base hooks in `/hooks/api/` directory:
   - ✅ `useQuery.ts` - Type-safe query hook factory with SWR
   - ✅ `useMutation.ts` - Type-safe mutation hook factory with proper error handling
   - ✅ `index.ts` - Exports for the API hooks
3. Created comprehensive type definitions for API responses:
   - ✅ Base response types and error types
   - ✅ User response types
   - ✅ Organization response types
   - ✅ Account response types
   - ✅ Payment response types
4. Updated components with new hooks:
   - ✅ Users page and related components
   - ✅ Organizations page and related components
   - [ ] Accounts page and related components
   - [ ] Payments page and related components

### 🚧 Remaining Steps

1. Continue updating components with new hooks:

   - ✅ Organizations page and related components
   - [ ] Accounts page and related components
   - [ ] Payments page and related components

2. Add tests for new hooks:

   - [ ] Query hook tests
   - [ ] Mutation hook tests
   - [ ] Integration tests

3. Update documentation:

   - [ ] API hooks usage guide
   - [ ] Migration guide
   - [ ] Type definitions

4. Review and testing:
   - [ ] Code review
   - [ ] Performance testing
   - [ ] Error handling testing
   - [ ] Edge cases testing

## Components Requiring Updates

1. ✅ `/app/(auth)/users/page.tsx`
2. ✅ `/app/(auth)/organizations/page.tsx`
3. [ ] `/app/(auth)/accounts/page.tsx`
4. [ ] `/app/(auth)/payments/page.tsx`
5. ✅ `/components/modals/UserModal/UserModal.tsx`
6. ✅ `/components/modals/OrganizationModal/OrganizationModal.tsx`
7. [ ] `/components/modals/AccountModal/AccountModal.tsx`
8. ✅ `/hooks/useUsers.ts` -> `/hooks/api/useUsers.ts`
9. ✅ `/hooks/useOrganizations.ts` -> `/hooks/api/useOrganizations.ts`
10. [ ] `/hooks/useAccounts.ts`
11. [ ] `/hooks/usePayments.ts`

## Migration Strategy

1. ✅ Implement new hooks alongside existing ones
2. ✅ Gradually migrate components to new system
3. ✅ Test thoroughly after each component migration
4. Remove old implementation once all components are migrated
5. Update tests and documentation

## Next Steps

1. ✅ Create type definitions for API responses
2. ✅ Start with Users page migration:
   - ✅ Update `useUsers` hook
   - ✅ Update Users page
   - ✅ Update UserModal
   - ✅ Test changes
3. ✅ Continue with Organizations page:
   - ✅ Create `useOrganizations` hook with new pattern
   - ✅ Update Organizations page
   - ✅ Update OrganizationModal
   - ✅ Test changes
4. Move on to Accounts and Payments
5. Final testing and documentation
