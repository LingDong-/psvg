export interface PSVGElement {
  tagName: string;
  children: PSVGElement[];
  attributes: Record<string, string>;
  innerHTML: string;
}
