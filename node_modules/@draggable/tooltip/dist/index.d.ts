interface SmartTooltipOptions {
    triggerName: string;
}
/**
 * The `SmartTooltip` class provides functionality to display tooltips on HTML elements.
 * Tooltips can be triggered by mouse hover or click events and are positioned optimally
 * within the viewport to avoid overflow.
 *
 * @example
 * ```typescript
 * const tooltip = new SmartTooltip({
 *   triggerName: 'tooltip'
 * });
 * ```
 *
 * @remarks
 * The tooltip content is specified using a data attribute on the trigger element.
 * The tooltip can be triggered by elements with the specified `triggerName` data attribute.
 *
 * @param {SmartTooltipOptions} options - Configuration options for the tooltip.
 *
 * @property {string} triggerName - The name of the data attribute used to trigger the tooltip.
 * @property {HTMLDivElement} tooltip - The tooltip element.
 * @property {string | null} activeTriggerType - The type of the currently active trigger ('click' or 'hover').
 * @property {number} spacing - The spacing between the tooltip and the trigger element.
 *
 * @method setupEventListeners - Sets up event listeners for mouseover, mouseout, click, resize, and scroll events.
 * @method handleClick - Handles click events to show or hide the tooltip.
 * @method handleMouseOver - Handles mouseover events to show the tooltip.
 * @method handleMouseOut - Handles mouseout events to hide the tooltip.
 * @method handleResize - Handles window resize events to hide the tooltip.
 * @method handleScroll - Handles window scroll events to hide the tooltip.
 * @method isVisible - Checks if the tooltip is currently visible.
 * @method calculatePosition - Calculates the optimal position for the tooltip relative to the trigger element.
 * @method fitsInViewport - Checks if the tooltip fits within the viewport and is not obstructed by other elements.
 * @method show - Displays the tooltip with the specified content.
 * @method hide - Hides the tooltip.
 * @method destroy - Removes event listeners and the tooltip element from the DOM.
 */
export declare class SmartTooltip {
    readonly triggerName: string;
    private readonly tooltip;
    private activeTriggerType;
    private readonly spacing;
    constructor(options?: SmartTooltipOptions);
    private setupEventListeners;
    private readonly handleClick;
    private readonly handleMouseOver;
    private readonly handleMouseOut;
    private readonly handleResize;
    private readonly handleScroll;
    private isVisible;
    /**
     * Calculates the optimal position for the tooltip relative to the trigger element.
     * It tries to find a position where the tooltip fits within the viewport.
     * If no position fits, it defaults to the first position in the list.
     *
     * @param {HTMLElement} trigger - The HTML element that triggers the tooltip.
     * @returns {Position} The calculated position for the tooltip.
     */
    private calculatePosition;
    /**
     * Checks if the tooltip fits within the viewport and is not obstructed by other elements.
     *
     * @param pos - The position of the tooltip.
     * @param tooltipRect - The bounding rectangle of the tooltip.
     * @returns `true` if the tooltip fits within the viewport and is not obstructed, otherwise `false`.
     */
    private fitsInViewport;
    private show;
    private hide;
    destroy(): void;
}
export declare const Tooltip: typeof SmartTooltip;
declare global {
    interface Window {
        SmartTooltip: typeof SmartTooltip;
    }
}
export default SmartTooltip;
