# @draggable/tooltip

A smart tooltip library that automatically positions tooltips optimally within the viewport.

![draggable-tooltip](https://github.com/user-attachments/assets/33b20fa6-f9ee-456d-8793-f26b03aaeb75)


## Installation

```bash
npm install @draggable/tooltip
```

## Usage

```javascript
import { Tooltip } from '@draggable/tooltip';

// Initialize with default options
const tooltip = new Tooltip();

// Or with custom options
const tooltip = new Tooltip({
  triggerName: 'custom-tooltip'
});
```

note: when using umd or iffe, tooltip can be accessed via `window.SmartTooltip`

```html

## HTML Usage

Add tooltips to any element using data attributes:

```html
<!-- Hover tooltip (default) -->
<div data-tooltip="This is a tooltip">Hover me</div>

<!-- Click tooltip -->
<button data-tooltip="Click tooltip" data-tooltip-type="click">Click me</button>
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| triggerName | string | 'tooltip' | The name used for the data attribute trigger (e.g., 'tooltip' becomes 'data-tooltip') |

## Features

- 🎯 Smart positioning: Automatically finds the best position to display the tooltip
- 🖱️ Multiple trigger types: Support for both hover and click triggers
- 📱 Responsive: Automatically repositions on viewport resize and scroll
- 🎨 Customizable: Easy to style and configure
- 🔄 8-way positioning: top, bottom, left, right, and corner positions

## Positions

The tooltip will attempt to position itself in the following order, choosing the first position that fits within the viewport:
- top
- bottom
- left
- right
- top-left
- top-right
- bottom-left
- bottom-right

## Trigger Types

### Hover Trigger
```html
<div data-tooltip="Hover tooltip">Hover me</div>
```

### Click Trigger
```html
<div data-tooltip="Click tooltip" data-tooltip-type="click">Click me</div>
```

## Cleanup

```javascript
// Remove event listeners and cleanup
tooltip.destroy();
```
