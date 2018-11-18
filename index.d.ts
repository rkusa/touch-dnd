/// <reference types="jquery" />

declare namespace TouchDnd {
  interface UiItem {
    item: Element;
    index?: number;
    helper?: any;
    clone?: Element;
  }

  interface SortableConfig {
    accept?: string;
    activeClass?: string;
    cancel?: string;
    connectWith?: boolean;
    disabled?: boolean;
    forcePlaceholderSize?: boolean;
    handle?: boolean;
    initialized?: boolean;
    items?: string;
    placeholder?: string;
    placeholderTag?: string | null;
    updateHandler?: (this: Element, ui: UiItem) => void | null;
    receiveHandler?: (this: Element, evtObj: UiItem) => void | null;
  }

  interface DraggableConfig {
    cancel?: string;
    connectWith?: string | boolean;
    cursor?: string;
    disabled?: boolean;
    handle?: boolean;
    initialized?: boolean;
    clone?: boolean;
    cloneClass?: string;
    scope?: string;
  }

  interface DroppableConfig {
    accept?: string;
    activeClass?: string;
    disabled?: boolean;
    hoverClass?: string;
    initialized?: boolean;
    scope?: string;
    receiveHandler?: (this: Element, evtObj: UiItem) => void | null;
  }
}

interface JQuery {
  sortable(config: TouchDnd.SortableConfig): JQuery;
  draggable(config: TouchDnd.DraggableConfig): JQuery;
  droppable(config: TouchDnd.DroppableConfig): JQuery;
}
