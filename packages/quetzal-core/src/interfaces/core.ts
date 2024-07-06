export interface StatefulInterface<T> {}

export interface StaticInterface<T> {}

/**
 * The base interface implementation of all Quetzal-Type Elements
 */
export interface QuetzalBaseInterface {
    /**
     * Code executed when a given element is created
     * @returns {void}
     */
    created(): void;
  
    /**
     * Code executed before a quetzal element is fully created
     */
    beforeCreated(): void;
  
    /**
     * Code executed when a given element is mounted to the DOM
     */
    mounted(): void;
  
    /**
     * Code executed when the given element is removed or destroyed
     * @returns {void}
     */
    unmounted(): void;
  
    /**
     * Styles to use in the given component
     * @type {string}
     */
    styles: string;
  
    /**
     * Render function to render code for the given web component
     * @returns {string}: The generated output
     *
     * TODO: Choose a different output for later versions.
     */
    render(): string;
  }