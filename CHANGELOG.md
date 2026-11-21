# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [0.1.1] - 2026-11-21

### Alterado

- `@kelsoncm/tiptap-core` 0.15.1: instalar o tarball não dispara mais o aviso de script bloqueado do npm 12.

## [0.1.0] - 2026-11-21

### Adicionado

- Elemento `<kelsoncm-tiptap>` sobre `@kelsoncm/tiptap-core` 0.15.0, sem framework e sem shadow DOM.
- Campo de formulário (form-associated): `name`, `required` com mensagem traduzida, `disabled`, reset e restauração de estado; valor = HTML do editor.
- Atributos `value`, `mode`, `toolbar`, `locale`, `readonly`, `placeholder`, `min-height`, `max-height`, limites e `status-bar`; propriedade `options` para o restante do `createEditorUI`.
- Eventos `kt-ready`, `kt-change`, `input`, `change`, `focus`, `blur`.
- CSS do core injetado uma vez; build ESM (dependências externas) e arquivo único (`kelsoncm-tiptap.bundle.js`).
- Demo com formulário (`npm run dev`), CI (Node 22/24) e release por tag (tarball e bundle na GitHub Release; npm com `NPM_TOKEN`).
