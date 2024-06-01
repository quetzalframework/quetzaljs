declare class QuetzalBaseClass {}

export function QuetzalExtElement(constructor: {
  new (): HTMLElement;
  prototype: HTMLElement;
}) {
  return class extends constructor implements QuetzalBaseClass {
  };
}
