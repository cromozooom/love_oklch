import { test, expect } from '@playwright/test';
import { setupColorSetterTest, switchColorFormat } from './utils';

test('Debug: Check HEX input element structure', async ({ page }) => {
  await setupColorSetterTest(page);
  await switchColorFormat(page, 'hex');

  // Check what elements exist
  const hexInputContainer = page.locator('[data-testid="hex-input"]');
  const colorInput = page.locator('[data-testid="color-input"]');
  const displayValue = page.locator('[data-testid="display-value"]');

  console.log(
    'HEX input container visible:',
    await hexInputContainer.isVisible()
  );
  console.log('Color input visible:', await colorInput.isVisible());
  console.log('Display value visible:', await displayValue.isVisible());

  // Try to find any input elements inside hex-input
  const inputsInsideHex = page.locator('[data-testid="hex-input"] input');
  console.log('Inputs inside hex container:', await inputsInsideHex.count());

  // Try to get values from each input inside hex container
  for (let i = 0; i < (await inputsInsideHex.count()); i++) {
    const input = inputsInsideHex.nth(i);
    const value = await input.inputValue();
    const id = await input.getAttribute('data-testid');
    const type = await input.getAttribute('type');
    console.log(`Input ${i}: value="${value}", testid="${id}", type="${type}"`);
  }

  // Try the hex-input container directly
  try {
    const directValue = await hexInputContainer.inputValue();
    console.log('Direct hex container value:', directValue);
  } catch (e) {
    console.log('Cannot get input value from hex container directly');
  }

  // Check display value content
  const displayContent = await displayValue.textContent();
  console.log('Display value content:', displayContent);
});
