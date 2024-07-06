// The basic structure of a Quetzal Element begins with a Stateful Web Component.
// There can be stateful and static web components. Static Web Components can be used when state is disabled, and can be used for displaying static info such as markdown rendering for instance.
// Stateful Web Components, however, can hold state and can be used for components where state is needed.

import { StatefulInterface, StaticInterface, QuetzalBaseInterface } from "./interfaces/core.ts";

export class StatefulElement extends HTMLElement implements StatefulInterface<HTMLElement> {
  constructor() {
    super();
    // More Code...
  }
}

export class StaticElement extends HTMLElement implements StaticInterface<HTMLElement> {
  constructor() {
    super();
    // More Code...
  }
}

/**
 * The Base Class Implementation for all Quetzal-Type Elements
 *
 * This could either be the core `QuetzalElement` used in all implementations,
 * or the `QuetzalExtElement` used mainly in the JS Implementation and ported to the Dart Implementation
 */
export abstract class QuetzalBaseElement extends StatefulElement
  implements QuetzalBaseInterface {
  static get properties() {
    return {};
  }

  static get observedAttributes() {
    return this.properties
  }
  
  beforeCreated() {}
  created() {}
  mounted() {}
  unmounted() {}
  abstract render(): string;
  styles: string = "";

  private static _build(src: string): Node {
    const tmpl = document.createElement("template");
    tmpl.innerHTML = src;
    return tmpl.content.cloneNode(true);
  }

  private static _buildStyle(src: string): Node {
    const tmpl = document.createElement("template");
    tmpl.innerHTML = `<style>${src}</style>`;
    return tmpl.content.cloneNode(true);
  }

  connectedCallback() {
    this.mounted();
  }
  disconnectedCallback() {
    this.unmounted();
  }

  /**
   * Generates a new Quetzal Element
   */
  constructor() {
    super();
    (async () => {
      await Promise.resolve(this.beforeCreated()).then(e => {
        const shadowRoot = this.attachShadow({ mode: "open" });
        const element = QuetzalBaseElement._build(this.render());
        element.appendChild(QuetzalBaseElement._buildStyle(this.styles));
        shadowRoot.append(element);
        this.created();
      })
    })()
  }
}

/**
 * A base Quetzal Element
 */
export class QuetzalElement extends QuetzalBaseElement {
  render(): string {
    return "";
  }
}
