// Admin-specific type definitions for plan management

export interface Plan {
  planId: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  planFeatures?: PlanFeature[];
}

export interface Feature {
  featureId: string;
  keyName: string;
  displayName: string;
  description: string;
  isBoolean: boolean;
  createdAt: string;
}

export interface PlanFeature {
  planFeatureId: string;
  planId: string;
  featureId: string;
  value: FeatureValue;
  createdAt: string;
  feature?: Feature;
}

export interface FeatureValue {
  enabled?: boolean;
  limit?: number;
  [key: string]: any;
}

export interface CreatePlanRequest {
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  features: CreatePlanFeatureRequest[];
}

export interface CreatePlanFeatureRequest {
  featureId: string;
  value: FeatureValue;
}

export interface UpdatePlanRequest extends Partial<CreatePlanRequest> {
  planId?: string;
}

export interface CreateFeatureRequest {
  keyName: string;
  displayName: string;
  description: string;
  isBoolean: boolean;
}

export interface UpdateFeatureRequest extends Partial<CreateFeatureRequest> {
  featureId?: string;
}

export interface AdminApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PlanStatistics {
  totalPlans: number;
  activePlans: number;
  totalSubscriptions: number;
  totalRevenue: number;
}

export interface FeatureUsageStats {
  featureId: string;
  featureName: string;
  totalUsage: number;
  uniqueUsers: number;
  avgUsagePerUser: number;
}
