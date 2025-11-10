import { Page, expect } from '@playwright/test';
import { SELECTORS } from './selectors';

/**
 * Project Management Utilities
 *
 * Utilities for project creation, navigation, and management
 */

export interface ProjectFormData {
  name: string;
  description: string;
  colorGamut: string;
  colorSpace: string;
  colorCount: string;
}

/**
 * Fill project creation form with data
 */
export async function fillProjectForm(page: Page, data: ProjectFormData) {
  await page.fill(SELECTORS.projects.nameInput, data.name);
  await page.fill(SELECTORS.projects.descriptionInput, data.description);
  await page.selectOption(SELECTORS.projects.colorGamutSelect, data.colorGamut);
  await page.selectOption(SELECTORS.projects.colorSpaceSelect, data.colorSpace);
  await page.fill(SELECTORS.projects.colorCountInput, data.colorCount);
}

/**
 * Verify project form values match expected data
 */
export async function verifyProjectForm(
  page: Page,
  expectedData: ProjectFormData
) {
  const nameValue = await page.inputValue(SELECTORS.projects.nameInput);
  const descValue = await page.inputValue(SELECTORS.projects.descriptionInput);
  const gamutValue = await page.inputValue(SELECTORS.projects.colorGamutSelect);
  const spaceValue = await page.inputValue(SELECTORS.projects.colorSpaceSelect);
  const countValue = await page.inputValue(SELECTORS.projects.colorCountInput);

  expect(nameValue).toBe(expectedData.name);
  expect(descValue).toBe(expectedData.description);
  expect(gamutValue).toBe(expectedData.colorGamut);
  expect(spaceValue).toBe(expectedData.colorSpace);
  expect(countValue).toBe(expectedData.colorCount);
}

/**
 * Verify project appears in project list
 */
export async function verifyProjectInList(page: Page, projectName: string) {
  await page.goto('http://localhost:4200/projects');
  await page.waitForLoadState('networkidle');

  const projectCard = page.locator(SELECTORS.projects.projectCard(projectName));
  await expect(projectCard).toBeVisible({ timeout: 5000 });
}

/**
 * Navigate to a specific project by name
 */
export async function navigateToProject(page: Page, projectName: string) {
  await page.goto('http://localhost:4200/projects');
  await page.waitForLoadState('networkidle');

  await page.click(SELECTORS.projects.projectCard(projectName));
  await page.waitForURL(/\/project\//, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

/**
 * Generate unique project name for testing
 */
export function generateUniqueProjectName(
  prefix: string = 'Test Project'
): string {
  return `${prefix} ${Date.now()}`;
}
