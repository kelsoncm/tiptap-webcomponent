import css from '@kelsoncm/tiptap-core/styles.css?inline';

import { defineKelsonTiptap, injectStyles } from './kelsoncm-tiptap.js';

export {
  defineKelsonTiptap,
  injectStyles,
  KelsonTiptapElement,
  TAG_NAME,
  type ChangeDetail,
} from './kelsoncm-tiptap.js';
export type { EditorUI, EditorUIOptions } from '@kelsoncm/tiptap-core';

/** The core stylesheet, for pages that prefer to manage styles themselves. */
export const styles: string = css;

// Importing the package registers <kelsoncm-tiptap> and its styles.
if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
  injectStyles(css);
  defineKelsonTiptap();
}
