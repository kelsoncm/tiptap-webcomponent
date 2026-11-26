import {
  createEditorUI,
  EDITOR_MODES,
  TOOLBAR_PRESETS,
  type CharacterCountMode,
  type DocumentLimits,
  type EditorMode,
  type EditorUI,
  type EditorUIOptions,
  type NumericLimit,
} from '@kelsoncm/tiptap-core';

export const TAG_NAME = 'kelsoncm-tiptap';

/** Detail of the `kt-change` event. */
export interface ChangeDetail {
  html: string;
  /** Empty-document check without parsing HTML. */
  empty: boolean;
}

const OBSERVED = [
  'mode',
  'toolbar',
  'locale',
  'readonly',
  'disabled',
  'placeholder',
  'min-height',
  'max-height',
  'max-characters',
  'max-words',
  'max-paragraphs',
  'min-characters',
  'min-words',
  'min-paragraphs',
  'character-count',
  'status-bar',
  'required',
] as const;

const LIMIT_ATTRIBUTES: Record<string, NumericLimit> = {
  'max-characters': 'maxCharacters',
  'max-words': 'maxWords',
  'max-paragraphs': 'maxParagraphs',
  'min-characters': 'minCharacters',
  'min-words': 'minWords',
  'min-paragraphs': 'minParagraphs',
};

const CHARACTER_COUNT_MODES: readonly CharacterCountMode[] = ['noSpaces', 'withSpaces', 'text'];

/** Attributes that require a new editor instance when they change. */
const REBUILD = new Set<string>([
  'toolbar',
  'placeholder',
  'status-bar',
  'character-count',
  ...Object.keys(LIMIT_ATTRIBUTES),
]);

let stylesInjected = false;

/** Injects the editor stylesheet once per document (light DOM, so page styles still apply). */
export function injectStyles(css: string, doc: Document = document): void {
  if (stylesInjected || doc.getElementById('kelsoncm-tiptap-styles')) return;
  const style = doc.createElement('style');
  style.id = 'kelsoncm-tiptap-styles';
  style.textContent = css;
  doc.head.append(style);
  stylesInjected = true;
}

/**
 * `<kelsoncm-tiptap>` — form-associated rich text editor.
 *
 * Attributes: `name`, `value` (initial HTML), `mode`, `toolbar`, `locale`, `readonly`,
 * `disabled`, `required`, `placeholder`, `min-height`, `max-height`, `status-bar`,
 * `max-/min-characters|words|paragraphs`, `character-count` (`noSpaces` | `withSpaces` | `text`).
 * Property `options` takes everything else of `EditorUIOptions` (mentions, media,
 * revision, plugins...). Events: `kt-ready`, `kt-change`, `input`, `change`, `focus`, `blur`.
 */
export class KelsonTiptapElement extends HTMLElement {
  static readonly formAssociated = true;
  static readonly observedAttributes = [...OBSERVED, 'value'];

  #ui: EditorUI | null = null;
  #options: Partial<EditorUIOptions> = {};
  #internals: ElementInternals | null = null;
  #value: string | null = null;
  #initialValue = '';
  #dirty = false;

  constructor() {
    super();
    // attachInternals is missing in some test environments and older browsers.
    const internals = typeof this.attachInternals === 'function' ? this.attachInternals() : null;
    this.#internals = internals && typeof internals.setFormValue === 'function' ? internals : null;
  }

  /** The underlying editor (null before connection). */
  get editor(): EditorUI | null {
    return this.#ui;
  }

  /** Extra options (mentions, media, revision...). Setting them rebuilds the editor. */
  get options(): Partial<EditorUIOptions> {
    return this.#options;
  }

  set options(value: Partial<EditorUIOptions>) {
    this.#options = value ?? {};
    if (this.#ui) this.#rebuild();
  }

  /** Current HTML. */
  get value(): string {
    return this.#ui ? this.#html() : (this.#value ?? this.getAttribute('value') ?? '');
  }

  set value(html: string) {
    this.#value = html ?? '';
    if (this.#ui) {
      this.#ui.editor.commands.setContent(this.#value, { emitUpdate: false });
      this.#sync();
    }
  }

  get form(): HTMLFormElement | null {
    return this.#internals?.form ?? null;
  }

  get name(): string | null {
    return this.getAttribute('name');
  }

  get validity(): ValidityState | undefined {
    return this.#internals?.validity;
  }

  get validationMessage(): string {
    return this.#internals?.validationMessage ?? '';
  }

  checkValidity(): boolean {
    return this.#internals?.checkValidity() ?? true;
  }

  reportValidity(): boolean {
    return this.#internals?.reportValidity() ?? true;
  }

  /** Moves the focus into the editor. */
  override focus(): void {
    this.#ui?.editor.commands.focus();
  }

  connectedCallback(): void {
    if (!this.#ui) {
      // Inline content (<kelsoncm-tiptap><p>…</p></kelsoncm-tiptap>) is the initial value.
      if (this.#value === null && !this.hasAttribute('value') && this.innerHTML.trim()) {
        this.#value = this.innerHTML;
      }
      this.#initialValue = this.value;
      this.#build();
    }
  }

  disconnectedCallback(): void {
    // Moving the element in the DOM disconnects and reconnects it; destroy only if it stays out.
    queueMicrotask(() => {
      if (!this.isConnected) this.#destroy();
    });
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue || !this.#ui) return;
    if (name === 'value') {
      if (!this.#dirty) this.value = newValue ?? '';
      return;
    }
    if (name === 'mode') {
      this.#ui.setMode(this.#mode());
      return;
    }
    if (name === 'locale') {
      if (newValue) this.#ui.i18n.setLocale(newValue);
      return;
    }
    if (name === 'readonly' || name === 'disabled') {
      this.#applyEditable();
      return;
    }
    if (name === 'min-height' || name === 'max-height') {
      this.#ui.root.style.setProperty(`--kt-${name}`, newValue ?? '');
      return;
    }
    if (name === 'required') {
      this.#sync();
      return;
    }
    if (REBUILD.has(name)) this.#rebuild();
  }

  // ---- form callbacks
  formResetCallback(): void {
    this.#dirty = false;
    this.value = this.#initialValue;
  }

  formDisabledCallback(disabled: boolean): void {
    this.toggleAttribute('disabled', disabled);
  }

  formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === 'string') this.value = state;
  }

  // ---- internals
  #mode(): EditorMode {
    const mode = this.getAttribute('mode') ?? 'toolbar';
    return (EDITOR_MODES as readonly string[]).includes(mode) ? (mode as EditorMode) : 'toolbar';
  }

  #limits(): DocumentLimits {
    const limits: DocumentLimits = {};
    for (const [attribute, key] of Object.entries(LIMIT_ATTRIBUTES)) {
      const value = Number(this.getAttribute(attribute));
      if (this.hasAttribute(attribute) && Number.isFinite(value) && value >= 0) limits[key] = value;
    }
    const count = this.getAttribute('character-count');
    if (count !== null) {
      if ((CHARACTER_COUNT_MODES as readonly string[]).includes(count)) {
        limits.characterCount = count as CharacterCountMode;
      } else {
        console.warn(
          `<${TAG_NAME}>: character-count="${count}" inválido; use ${CHARACTER_COUNT_MODES.join(', ')}.`,
        );
      }
    }
    return limits;
  }

  #build(): void {
    const toolbar = this.getAttribute('toolbar');
    const locale = this.getAttribute('locale');
    const content = this.#value ?? this.getAttribute('value') ?? '';
    this.replaceChildren();
    const limits = { ...this.#limits(), ...this.#options.limits };
    this.#ui = createEditorUI(this, {
      ...this.#options,
      content,
      mode: this.#mode(),
      ...(toolbar && toolbar in TOOLBAR_PRESETS
        ? { toolbar: toolbar as keyof typeof TOOLBAR_PRESETS }
        : {}),
      ...(locale && !this.#options.i18n ? { i18n: { locale } } : {}),
      ...(this.hasAttribute('placeholder')
        ? { placeholder: this.getAttribute('placeholder') ?? '' }
        : {}),
      ...(this.getAttribute('min-height')
        ? { minHeight: this.getAttribute('min-height') ?? '' }
        : {}),
      ...(this.getAttribute('max-height')
        ? { maxHeight: this.getAttribute('max-height') ?? '' }
        : {}),
      ...(this.getAttribute('status-bar') === 'false' ? { statusBar: false } : {}),
      ...(Object.keys(limits).length ? { limits } : {}),
    });
    const { editor } = this.#ui;
    editor.on('update', this.#onUpdate);
    editor.on('focus', this.#onFocus);
    editor.on('blur', this.#onBlur);
    this.#applyEditable();
    this.#sync();
    this.dispatchEvent(new CustomEvent('kt-ready', { detail: { editor: this.#ui } }));
  }

  #rebuild(): void {
    const html = this.#ui ? this.#html() : (this.#value ?? '');
    this.#destroy();
    this.#value = html;
    this.#build();
  }

  #destroy(): void {
    if (!this.#ui) return;
    const { editor } = this.#ui;
    editor.off('update', this.#onUpdate);
    editor.off('focus', this.#onFocus);
    editor.off('blur', this.#onBlur);
    this.#ui.destroy();
    this.#ui = null;
  }

  #applyEditable(): void {
    if (!this.#ui) return;
    const readonly = this.hasAttribute('readonly') || this.hasAttribute('disabled');
    this.#ui.setMode(readonly ? 'readonly' : this.#mode());
    this.#ui.root.toggleAttribute('aria-disabled', this.hasAttribute('disabled'));
  }

  #html(): string {
    const ui = this.#ui;
    if (!ui) return '';
    // The empty paragraph the editor keeps after tables/lists is an editing aid, not content.
    return ui.editor.isEmpty ? '' : ui.editor.getHTML().replace(/(?:<p><\/p>)+$/, '');
  }

  #sync(): void {
    const ui = this.#ui;
    if (!ui) return;
    const html = this.#html();
    this.#value = html;
    this.#internals?.setFormValue(html, html);
    if (this.hasAttribute('required') && ui.editor.isEmpty) {
      this.#internals?.setValidity(
        { valueMissing: true },
        ui.i18n.t('validation.required'),
        ui.editor.view.dom as HTMLElement,
      );
    } else {
      this.#internals?.setValidity({});
    }
  }

  #onUpdate = (): void => {
    this.#dirty = true;
    this.#sync();
    const detail: ChangeDetail = {
      html: this.#value ?? '',
      empty: this.#ui?.editor.isEmpty ?? true,
    };
    this.dispatchEvent(new CustomEvent('kt-change', { detail, bubbles: true }));
    this.dispatchEvent(new Event('input', { bubbles: true }));
  };

  #onFocus = (): void => {
    this.dispatchEvent(new FocusEvent('focus'));
  };

  #onBlur = (): void => {
    this.dispatchEvent(new FocusEvent('blur'));
    // Like native inputs, `change` fires when leaving after edits.
    if (this.#dirty) this.dispatchEvent(new Event('change', { bubbles: true }));
  };
}

/** Registers the element (idempotent). */
export function defineKelsonTiptap(tagName: string = TAG_NAME): void {
  if (!customElements.get(tagName)) customElements.define(tagName, KelsonTiptapElement);
}

declare global {
  interface HTMLElementTagNameMap {
    'kelsoncm-tiptap': KelsonTiptapElement;
  }
}
