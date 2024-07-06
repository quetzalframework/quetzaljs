import { QuetzalBaseInterface } from "./interfaces/core.ts";

export abstract class QuetzalBaseExtensionClass implements QuetzalBaseInterface {
  created(): void {}
  beforeCreated(): void {}
  mounted(): void {}
  unmounted(): void {}

  abstract styles: string;
  abstract render(): string;
}