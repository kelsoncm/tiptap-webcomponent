// jsdom has no layout engine; ProseMirror and floating-ui call these when the editor is
// focused or menus are positioned.
const emptyRect = (): DOMRect => new DOMRect(0, 0, 0, 0);
const emptyRects = (): DOMRectList => {
  const list = [] as unknown as DOMRectList & DOMRect[];
  Object.defineProperty(list, 'item', { value: () => null });
  return list;
};

for (const proto of [Range.prototype, Element.prototype, Text.prototype] as object[]) {
  const target = proto as { getClientRects?: unknown; getBoundingClientRect?: unknown };
  target.getClientRects ??= emptyRects;
  target.getBoundingClientRect ??= emptyRect;
}

document.elementFromPoint ??= () => null;

// ProseMirror syncs the DOM selection in deferred callbacks (focus, suggestion exit).
// jsdom throws InvalidStateError when that node is no longer in the document, which a
// browser silently ignores. Only that specific error is swallowed.
const collapse = Selection.prototype.collapse;
Selection.prototype.collapse = function patchedCollapse(node, offset) {
  try {
    collapse.call(this, node, offset);
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'InvalidStateError')) throw error;
  }
};

for (const name of ['collapseToStart', 'collapseToEnd'] as const) {
  const original = Selection.prototype[name];
  Selection.prototype[name] = function patched(this: Selection) {
    if (this.rangeCount > 0) original.call(this);
  };
}
