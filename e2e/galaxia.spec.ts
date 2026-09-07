import { test, expect } from "@playwright/test";

test("L1 galaxia: cuatro estrellas y Meta System", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("El ecosistema no se pudo cargar")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Haulmer Grid" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Conversación" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Embudo" })).toBeVisible();
  await expect(page.getByText("Adquisición", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Activación", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Uso", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Expansión", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Meta System", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Clasificador de Intención")).toHaveCount(0);
  await expect(page.locator("svg circle.cluster-halo")).toHaveCount(0);
  await expect(page.locator("svg ellipse.cluster-halo")).toHaveCount(0);
  await expect(page.locator("svg path.nebula")).toHaveCount(5);

  await page.screenshot({ path: "referencias/captura-l1-galaxia.png", fullPage: true });
});

test("L2 Uso: clasificador y agentes SAC", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Uso", { exact: true }).first().click();
  await expect(page.getByText("Clasificador de Intención")).toBeVisible();
  await expect(page.getByText("Agente IA SAC - Haulmer")).toBeVisible();
  await expect(page.getByText("Agente IA SAC - Hosting")).toBeVisible();
  await expect(page.getByText("Agente IA Partner")).toBeVisible();

  await page.locator('svg [aria-label="Clasificador de Intención"]').click();
  await expect(page.getByRole("heading", { name: "Clasificador de Intención" })).toBeVisible();

  await page.screenshot({ path: "referencias/captura-l2-uso.png", fullPage: true });
});

test("Conversación: Cliente, clasificador y pulso", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Conversación" }).click();
  await expect(page.getByText("Cliente", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Clasificador de Intención")).toBeVisible();
  await expect(page.getByText("Agente IA SAC - Haulmer")).toBeVisible();
  await expect(page.getByText("Agente IA SAC - Hosting")).toBeVisible();
  await expect(page.getByText("Agente IA Partner")).toBeVisible();
  await expect(page.getByText("Agente IA Onboarding")).toBeVisible();
  await expect(page.getByText("Meta System")).toHaveCount(0);
  await expect(page.locator("svg path.pulse-signal")).toHaveCount(5);
  await expect(page.locator("svg path.nebula")).toHaveCount(0);

  await page.screenshot({ path: "referencias/captura-conversacion.png", fullPage: true });
});

test("Embudo: campañas, capas y ruta Rutitas a SAC", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Embudo" }).click();
  await expect(page.getByText("Cliente", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Clasificador de Intención")).toBeVisible();
  await expect(page.locator('svg [aria-label="¿El número está en la base?"]')).toBeVisible();
  await expect(page.locator('svg [aria-label="¿A qué equipo según el tipificado?"]')).toBeVisible();
  await expect(page.locator('svg [aria-label="¿Es Partner?"]')).toBeVisible();
  await expect(page.getByText("Agente IA Ventas")).toBeVisible();
  await expect(page.getByText("Agente IA SAC - Haulmer")).toBeVisible();
  await expect(page.getByText("Agente IA Onboarding")).toBeVisible();
  await expect(page.getByText("Agente IA Partner")).toBeVisible();
  await expect(page.locator('svg [aria-label="Customer Success"]')).toBeVisible();
  await expect(page.getByText("Meta System")).toHaveCount(0);
  await expect(page.getByText("Agente IA SAC - Hosting")).toHaveCount(0);

  await page.getByRole("radio", { name: "Rutitas" }).click();
  await expect(page.getByRole("radio", { name: "CS" })).toBeVisible();
  await page.getByRole("button", { name: "Ejecutar" }).click();
  await expect(page.getByText("El tipificado es SAC y el contacto no es Partner")).toBeVisible({
    timeout: 5000,
  });
  await expect(page.locator('svg [aria-label="Agente IA SAC - Haulmer"]')).toHaveClass(/is-route/);
  await expect(page.locator('svg [aria-label="Agente IA Partner"]')).not.toHaveClass(/is-route/);
  await expect(page.locator("svg .route-active")).toHaveCount(5);

  await page.screenshot({ path: "referencias/captura-embudo.png", fullPage: true });
});

test("Embudo: las respuestas del panel se pueden cambiar", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Embudo" }).click();
  await page.getByRole("radio", { name: "Abono flexible" }).click();
  await expect(page.getByRole("group", { name: "¿Es Partner?" }).getByRole("radio", { name: "Sí" })).toBeChecked();

  await page.getByRole("button", { name: "Ejecutar" }).click();
  await expect(page.getByText("el contacto es Partner")).toBeVisible({ timeout: 5000 });
  await expect(page.locator('svg [aria-label="Agente IA Partner"]')).toHaveClass(/is-route/);

  await page.getByRole("group", { name: "¿Es Partner?" }).getByRole("radio", { name: "No" }).click();
  await page.getByRole("button", { name: "Ejecutar" }).click();
  await expect(page.getByText("el contacto no es Partner")).toBeVisible({ timeout: 5000 });
  await expect(page.locator('svg [aria-label="Agente IA SAC - Haulmer"]')).toHaveClass(/is-route/);
  await expect(page.locator('svg [aria-label="Agente IA Partner"]')).not.toHaveClass(/is-route/);
});
