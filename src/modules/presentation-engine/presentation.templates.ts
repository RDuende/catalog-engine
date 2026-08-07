import type { PresentationTemplate } from "./presentation.types.js";

export const PRESENTATION_TEMPLATES: readonly PresentationTemplate[] = Object.freeze([
  {
    id: "tshirt-front-v1",
    productKind: "TSHIRT",
    presentationType: "MOCKUP",
    width: 1200,
    height: 1200,
    title: "Camiseta personalizada",
    printableArea: { x: 390, y: 330, width: 420, height: 500, borderRadius: 16 },
    background: "#f4f1eb",
    productColor: "#ffffff",
  },
  {
    id: "mug-front-v1",
    productKind: "MUG",
    presentationType: "MOCKUP",
    width: 1200,
    height: 1200,
    title: "Taza personalizada",
    printableArea: { x: 330, y: 390, width: 500, height: 330, borderRadius: 28 },
    background: "#eef3f7",
    productColor: "#ffffff",
  },
  {
    id: "canvas-wall-v1",
    productKind: "CANVAS",
    presentationType: "MOCKUP",
    width: 1200,
    height: 1200,
    title: "Lienzo personalizado",
    printableArea: { x: 260, y: 220, width: 680, height: 680 },
    background: "#ece7df",
    productColor: "#fafafa",
  },
  {
    id: "puzzle-table-v1",
    productKind: "PUZZLE",
    presentationType: "MOCKUP",
    width: 1200,
    height: 1200,
    title: "Puzle personalizado",
    printableArea: { x: 245, y: 280, width: 710, height: 610, borderRadius: 8 },
    background: "#efe6d6",
    productColor: "#fffdf8",
  },
]);

export function getPresentationTemplate(id: string): PresentationTemplate | undefined {
  return PRESENTATION_TEMPLATES.find((template) => template.id === id);
}
