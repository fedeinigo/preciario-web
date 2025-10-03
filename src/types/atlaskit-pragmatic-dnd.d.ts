declare module "@atlaskit/pragmatic-drag-and-drop/element/adapter" {
  type ElementDragSource = {
    element: HTMLElement;
    data: unknown;
  };

  type ElementDragEvent = {
    source: ElementDragSource;
  };

  export function draggable(options: {
    element: HTMLElement;
    getInitialData?: () => unknown;
    onDragStart?: (event: ElementDragEvent) => void;
    onDrop?: (event: ElementDragEvent) => void;
    onDragEnd?: (event: ElementDragEvent) => void;
  }): () => void;

  export function dropTargetForElements(options: {
    element: HTMLElement;
    getData?: () => unknown;
    onDragEnter?: (event: ElementDragEvent) => void;
    onDragLeave?: (event: ElementDragEvent) => void;
    onDrop?: (event: ElementDragEvent) => void;
    onDragEnd?: (event: ElementDragEvent) => void;
  }): () => void;
}
