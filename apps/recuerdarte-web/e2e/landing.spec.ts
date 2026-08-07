import { expect, test } from "@playwright/test";

test("la landing es operable con teclado", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main")).toBeVisible();
  const skipLink = page.getByRole("link", { name: "Saltar al contenido" });
  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  const conversationInput = page.getByRole("textbox").first();
  await conversationInput.focus();
  await conversationInput.fill("Quiero crear un recuerdo especial para mis gemelas");
  await expect(conversationInput).toHaveValue("Quiero crear un recuerdo especial para mis gemelas");
});

test("la landing muestra los controles esenciales", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("textbox").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /exportar logs/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /abrir diagnóstico/i })).toBeVisible();
});

test("el centro de diagnóstico se abre y puede cerrarse", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /abrir diagnóstico/i }).click();
  await expect(page.getByRole("dialog", { name: "Centro de diagnóstico" })).toBeVisible();
  await expect(page.getByText("Servicios", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /cerrar diagnóstico/i }).click();
  await expect(page.getByRole("dialog", { name: "Centro de diagnóstico" })).toBeHidden();
});
