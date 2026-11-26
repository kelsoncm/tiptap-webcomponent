import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { KelsonTiptapElement, styles } from '../src/index.js';

beforeAll(() => {
  expect(customElements.get('kelsoncm-tiptap')).toBe(KelsonTiptapElement);
});

afterEach(async () => {
  document.body.replaceChildren();
  await new Promise((resolve) => setTimeout(resolve, 20));
});

const mount = (html: string): KelsonTiptapElement => {
  document.body.insertAdjacentHTML('beforeend', html);
  return document.body.lastElementChild as KelsonTiptapElement;
};

describe('<kelsoncm-tiptap>', () => {
  it('registers itself and injects the stylesheet once', () => {
    mount('<kelsoncm-tiptap></kelsoncm-tiptap>');
    mount('<kelsoncm-tiptap></kelsoncm-tiptap>');
    expect(document.querySelectorAll('#kelsoncm-tiptap-styles')).toHaveLength(1);
    expect(styles).toContain('.kt-editor');
  });

  it('uses inline content or the value attribute as initial value', () => {
    const a = mount('<kelsoncm-tiptap><p>inline <strong>rico</strong></p></kelsoncm-tiptap>');
    expect(a.value).toBe('<p>inline <strong>rico</strong></p>');
    expect(a.querySelector('.kt-editor .tiptap')).not.toBeNull();
    const b = mount('<kelsoncm-tiptap value="<p>atributo</p>"></kelsoncm-tiptap>');
    expect(b.value).toBe('<p>atributo</p>');
  });

  it('drops the trailing empty paragraph from the value', () => {
    const el = mount('<kelsoncm-tiptap value="<ul><li><p>a</p></li></ul>"></kelsoncm-tiptap>');
    expect(el.editor!.editor.getHTML()).toMatch(/<p><\/p>$/);
    expect(el.value).toBe('<ul><li><p>a</p></li></ul>');
  });

  it('gets and sets the value, empty documents become ""', () => {
    const el = mount('<kelsoncm-tiptap></kelsoncm-tiptap>');
    expect(el.value).toBe('');
    el.value = '<h2>Novo</h2>';
    expect(el.editor!.editor.getHTML()).toMatch(/^<h2>Novo<\/h2>/);
  });

  it('emits kt-change and input on edits, change on blur', () => {
    const el = mount('<kelsoncm-tiptap value="<p>a</p>"></kelsoncm-tiptap>');
    const changes: string[] = [];
    const inputs = vi.fn();
    const change = vi.fn();
    el.addEventListener('kt-change', (e) => changes.push((e as CustomEvent).detail.html));
    el.addEventListener('input', inputs);
    el.addEventListener('change', change);
    el.editor!.editor.commands.insertContentAt(2, 'b');
    expect(changes).toEqual(['<p>ab</p>']);
    expect(inputs).toHaveBeenCalledTimes(1);
    el.editor!.editor.emit('blur', {
      editor: el.editor!.editor,
      event: new FocusEvent('blur'),
      transaction: el.editor!.editor.state.tr,
    });
    expect(change).toHaveBeenCalledTimes(1);
  });

  it('applies mode, toolbar, locale, readonly and disabled', () => {
    const el = mount(
      '<kelsoncm-tiptap mode="balloon" toolbar="minimal" locale="en"></kelsoncm-tiptap>',
    );
    const ui = el.editor!;
    expect(ui.mode).toBe('balloon');
    expect(ui.i18n.locale).toBe('en');
    expect(el.querySelectorAll('.kt-toolbar-host button')).toHaveLength(4);
    el.setAttribute('mode', 'notion');
    expect(ui.mode).toBe('notion');
    el.setAttribute('readonly', '');
    expect(ui.editor.isEditable).toBe(false);
    el.removeAttribute('readonly');
    expect(ui.editor.isEditable).toBe(true);
    el.setAttribute('disabled', '');
    expect(ui.editor.isEditable).toBe(false);
    expect(ui.root.hasAttribute('aria-disabled')).toBe(true);
    el.setAttribute('locale', 'es');
    expect(ui.i18n.locale).toBe('es');
  });

  it('rebuilds keeping the content when limits or options change', () => {
    const el = mount('<kelsoncm-tiptap value="<p>um dois três</p>"></kelsoncm-tiptap>');
    const first = el.editor;
    el.setAttribute('max-words', '3');
    expect(el.editor).not.toBe(first);
    expect(el.value).toBe('<p>um dois três</p>');
    expect(el.querySelector('[data-counter="words"]')?.textContent).toBe('Palavras: 3/3');
    el.options = { mentions: { items: [{ id: 'a', label: 'Ana' }] } };
    expect(el.editor!.commands.has('mention')).toBe(true);
    expect(el.value).toBe('<p>um dois três</p>');
  });

  it('counts characters by the character-count attribute', () => {
    const el = mount(
      '<kelsoncm-tiptap value="<p>ab cd</p><p>ef</p>" max-characters="10"></kelsoncm-tiptap>',
    );
    const counter = (): string | null | undefined =>
      el.querySelector('[data-counter="characters"]')?.textContent;
    expect(counter()).toBe('Caracteres: 6/10');
    el.setAttribute('character-count', 'text');
    expect(el.editor!.limits.characterCount).toBe('text');
    expect(counter()).toBe('Caracteres: 7/10');
    el.setAttribute('character-count', 'withSpaces');
    expect(counter()).toBe('Caracteres: 8/10');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    el.setAttribute('character-count', 'invalido');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('character-count="invalido"'));
    expect(counter()).toBe('Caracteres: 6/10');
    warn.mockRestore();
  });

  it('participates in forms when ElementInternals is available', () => {
    const form = document.createElement('form');
    form.innerHTML = '<kelsoncm-tiptap name="texto" required></kelsoncm-tiptap>';
    document.body.append(form);
    const el = form.querySelector('kelsoncm-tiptap') as KelsonTiptapElement;
    if (!el.validity) return; // environment without attachInternals
    expect(el.checkValidity()).toBe(false);
    expect(el.validationMessage).toBe('Este campo é obrigatório');
    el.value = '<p>preenchido</p>';
    expect(el.checkValidity()).toBe(true);
    expect(new FormData(form).get('texto')).toBe('<p>preenchido</p>');
    el.editor!.editor.commands.insertContentAt(1, 'x');
    form.reset();
    expect(el.value).toBe('');
  });

  it('survives being moved in the DOM and cleans up when removed', async () => {
    const el = mount('<kelsoncm-tiptap value="<p>a</p>"></kelsoncm-tiptap>');
    const ui = el.editor;
    const other = document.createElement('div');
    document.body.append(other);
    other.append(el);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(el.editor).toBe(ui);
    el.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(el.editor).toBeNull();
  });

  it('dispatches kt-ready with the editor', () => {
    const el = document.createElement('kelsoncm-tiptap');
    const ready = vi.fn();
    el.addEventListener('kt-ready', ready);
    document.body.append(el);
    expect(ready).toHaveBeenCalledTimes(1);
    expect((ready.mock.calls[0]![0] as CustomEvent).detail.editor).toBe(el.editor);
  });
});
