/**
 * Service Layer Index
 * Centralized exports for all service classes in the backend application
 */

// Plan Management Services
export { PlanService } from './plan.service';

// Feature Management Services
export { FeatureService } from './feature.service';
export type {
  FeatureServiceCreateData,
  FeatureServiceUpdateData,
  FeatureSearchFilters,
  FeatureStats,
} from './feature.service';

// Plan-Feature Relationship Services
export { PlanFeatureService } from './plan-feature.service';
export type {
  PlanFeatureServiceCreateData,
  PlanFeatureServiceUpdateData,
  EntitlementMatrixRow,
  PlanEntitlementSummary,
  BulkUpdateRequest,
  EntitlementAnalytics,
} from './plan-feature.service';

/**
 * Service Layer Documentation
 *
 * The service layer provides business logic and orchestration for the application's
 * core functionality. Each service encapsulates domain-specific operations and
 * coordinates between repositories, models, and external systems.
 *
 * Service Architecture:
 * - PlanService: Business logic for subscription plan management
 * - FeatureService: Business logic for feature catalog management
 * - PlanFeatureService: Business logic for entitlement matrix management
 *
 * Key Responsibilities:
 * - Business rule validation and enforcement
 * - Complex operations orchestration (bulk updates, analytics)
 * - Cross-entity consistency management
 * - Domain-specific error handling and messaging
 * - Transaction coordination (when needed)
 *
 * Usage Pattern:
 * ```typescript
 * import { PlanService, FeatureService } from '../services';
 *
 * // Inject repositories into services
 * const planService = new PlanService(planRepository, planFeatureRepository);
 * const featureService = new FeatureService(featureRepository, planFeatureRepository);
 *
 * // Use services for business operations
 * const plan = await planService.createPlan({
 *   name: 'Premium Plan',
 *   slug: 'premium',
 *   currency: 'USD',
 *   metadata: {}
 * });
 * ```
 */
