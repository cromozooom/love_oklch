import { Injectable, inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { ProjectService } from '../services/project.service';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export const ProjectExistsGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const projectService = inject(ProjectService);
  const router = inject(Router);
  const projectId = route.paramMap.get('projectId');

  if (!projectId) {
    // No projectId in route, deny access
    router.navigate(['/dashboard']);
    return of(false);
  }

  return projectService.getProjectById(projectId).pipe(
    map((project) => {
      if (project) {
        return true;
      } else {
        router.navigate(['/dashboard']);
        return false;
      }
    }),
    catchError(() => {
      router.navigate(['/dashboard']);
      return of(false);
    })
  );
};
