import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';
import {
  Plan,
  Feature,
  PlanFeature,
  CreatePlanRequest,
  UpdatePlanRequest,
  CreateFeatureRequest,
  UpdateFeatureRequest,
  AdminApiResponse,
  PaginatedResponse,
  PlanStatistics,
  FeatureUsageStats,
} from '../types/admin.types';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly apiUrl =
    environment.apiUrl || 'http://localhost:3000/api/v1';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  private handleApiResponse<T>(response: AdminApiResponse<T>): T {
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(
      response.error || response.message || 'Unknown error occurred'
    );
  }

  private handleError = (error: any): Observable<never> => {
    console.error('AdminService error:', error);

    let errorMessage = 'An unexpected error occurred';

    if (error.status === 401) {
      errorMessage = 'Unauthorized. Please login again.';
      this.authService.logout();
    } else if (error.status === 403) {
      errorMessage = 'Access denied. Admin privileges required.';
    } else if (error.status === 404) {
      errorMessage = 'Resource not found.';
    } else if (error.status === 400) {
      errorMessage =
        error.error?.message || error.error?.error || 'Invalid request.';
    } else if (error.status === 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  };

  // Plan Management
  getPlans(page: number = 1, limit: number = 50): Observable<Plan[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<AdminApiResponse<PaginatedResponse<Plan>>>(
        `${this.apiUrl}/admin/plans?page=${page}&limit=${limit}`,
        { headers }
      )
      .pipe(
        map((response) => this.handleApiResponse(response).items),
        catchError(this.handleError)
      );
  }

  getPlan(planId: string): Observable<Plan> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<AdminApiResponse<Plan>>(`${this.apiUrl}/admin/plans/${planId}`, {
        headers,
      })
      .pipe(
        map((response) => this.handleApiResponse(response)),
        catchError(this.handleError)
      );
  }

  createPlan(planData: CreatePlanRequest): Observable<Plan> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<AdminApiResponse<Plan>>(`${this.apiUrl}/admin/plans`, planData, {
        headers,
      })
      .pipe(
        map((response) => this.handleApiResponse(response)),
        catchError(this.handleError)
      );
  }

  updatePlan(planId: string, planData: UpdatePlanRequest): Observable<Plan> {
    const headers = this.getAuthHeaders();
    return this.http
      .put<AdminApiResponse<Plan>>(
        `${this.apiUrl}/admin/plans/${planId}`,
        planData,
        { headers }
      )
      .pipe(
        map((response) => this.handleApiResponse(response)),
        catchError(this.handleError)
      );
  }

  deletePlan(planId: string): Observable<boolean> {
    const headers = this.getAuthHeaders();
    return this.http
      .delete<AdminApiResponse<{ deleted: boolean }>>(
        `${this.apiUrl}/admin/plans/${planId}`,
        { headers }
      )
      .pipe(
        map((response) => this.handleApiResponse(response).deleted),
        catchError(this.handleError)
      );
  }

  // Feature Management
  getFeatures(page: number = 1, limit: number = 100): Observable<Feature[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<AdminApiResponse<PaginatedResponse<Feature>>>(
        `${this.apiUrl}/admin/features?page=${page}&limit=${limit}`,
        { headers }
      )
      .pipe(
        map((response) => this.handleApiResponse(response).items),
        catchError(this.handleError)
      );
  }

  getFeature(featureId: string): Observable<Feature> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<AdminApiResponse<Feature>>(
        `${this.apiUrl}/admin/features/${featureId}`,
        { headers }
      )
      .pipe(
        map((response) => this.handleApiResponse(response)),
        catchError(this.handleError)
      );
  }

  createFeature(featureData: CreateFeatureRequest): Observable<Feature> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<AdminApiResponse<Feature>>(
        `${this.apiUrl}/admin/features`,
        featureData,
        { headers }
      )
      .pipe(
        map((response) => this.handleApiResponse(response)),
        catchError(this.handleError)
      );
  }

  updateFeature(
    featureId: string,
    featureData: UpdateFeatureRequest
  ): Observable<Feature> {
    const headers = this.getAuthHeaders();
    return this.http
      .put<AdminApiResponse<Feature>>(
        `${this.apiUrl}/admin/features/${featureId}`,
        featureData,
        { headers }
      )
      .pipe(
        map((response) => this.handleApiResponse(response)),
        catchError(this.handleError)
      );
  }

  deleteFeature(featureId: string): Observable<boolean> {
    const headers = this.getAuthHeaders();
    return this.http
      .delete<AdminApiResponse<{ deleted: boolean }>>(
        `${this.apiUrl}/admin/features/${featureId}`,
        { headers }
      )
      .pipe(
        map((response) => this.handleApiResponse(response).deleted),
        catchError(this.handleError)
      );
  }

  // Plan-Feature Association Management
  getPlanFeatures(planId: string): Observable<PlanFeature[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<AdminApiResponse<PlanFeature[]>>(
        `${this.apiUrl}/admin/plans/${planId}/features`,
        { headers }
      )
      .pipe(
        map((response) => this.handleApiResponse(response)),
        catchError(this.handleError)
      );
  }

  addFeatureToPlan(
    planId: string,
    featureId: string,
    value: any
  ): Observable<PlanFeature> {
    const headers = this.getAuthHeaders();
    const data = { featureId, value };
    return this.http
      .post<AdminApiResponse<PlanFeature>>(
        `${this.apiUrl}/admin/plans/${planId}/features`,
        data,
        { headers }
      )
      .pipe(
        map((response) => this.handleApiResponse(response)),
        catchError(this.handleError)
      );
  }

  updatePlanFeature(
    planId: string,
    featureId: string,
    value: any
  ): Observable<PlanFeature> {
    const headers = this.getAuthHeaders();
    const data = { value };
    return this.http
      .put<AdminApiResponse<PlanFeature>>(
        `${this.apiUrl}/admin/plans/${planId}/features/${featureId}`,
        data,
        { headers }
      )
      .pipe(
        map((response) => this.handleApiResponse(response)),
        catchError(this.handleError)
      );
  }

  removeFeatureFromPlan(
    planId: string,
    featureId: string
  ): Observable<boolean> {
    const headers = this.getAuthHeaders();
    return this.http
      .delete<AdminApiResponse<{ deleted: boolean }>>(
        `${this.apiUrl}/admin/plans/${planId}/features/${featureId}`,
        { headers }
      )
      .pipe(
        map((response) => this.handleApiResponse(response).deleted),
        catchError(this.handleError)
      );
  }

  // Analytics and Statistics
  getPlanStatistics(): Observable<PlanStatistics> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<AdminApiResponse<PlanStatistics>>(
        `${this.apiUrl}/admin/plans/statistics`,
        { headers }
      )
      .pipe(
        map((response) => this.handleApiResponse(response)),
        catchError(this.handleError)
      );
  }

  getFeatureUsageStats(featureId?: string): Observable<FeatureUsageStats[]> {
    const headers = this.getAuthHeaders();
    const url = featureId
      ? `${this.apiUrl}/admin/features/${featureId}/usage`
      : `${this.apiUrl}/admin/features/usage`;

    return this.http
      .get<AdminApiResponse<FeatureUsageStats[]>>(url, { headers })
      .pipe(
        map((response) => this.handleApiResponse(response)),
        catchError(this.handleError)
      );
  }

  // Bulk Operations
  bulkUpdatePlans(
    updates: Array<{ planId: string; data: UpdatePlanRequest }>
  ): Observable<Plan[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .patch<AdminApiResponse<Plan[]>>(
        `${this.apiUrl}/admin/plans/bulk`,
        { updates },
        { headers }
      )
      .pipe(
        map((response) => this.handleApiResponse(response)),
        catchError(this.handleError)
      );
  }

  bulkUpdateFeatures(
    updates: Array<{ featureId: string; data: UpdateFeatureRequest }>
  ): Observable<Feature[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .patch<AdminApiResponse<Feature[]>>(
        `${this.apiUrl}/admin/features/bulk`,
        { updates },
        { headers }
      )
      .pipe(
        map((response) => this.handleApiResponse(response)),
        catchError(this.handleError)
      );
  }
}
