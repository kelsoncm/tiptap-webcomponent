# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [0.1.5] - 2026-11-24

### Alterado

- `@kelsoncm/tiptap-core` `^0.18.4`.
- Primeira publicação por _Trusted Publishing_ (OIDC), que valida o trusted publisher do npm.

## [0.1.4] - 2026-11-24

### Alterado

- `@kelsoncm/tiptap-core` do registro do npm (`^0.18.2`) em vez do tarball da release; sai o `allow-remote=root` do `.npmrc`.
- Release publica no npm por _Trusted Publishing_ (OIDC), com npm 11.5.1+; o secret `NPM_TOKEN` fica só como reserva.

## [0.1.3] - 2026-11-23

### Alterado

- Repositório transferido para a organização `tiptap-by-kelsoncm`: homepage, repositório e links atualizados.
- `@kelsoncm/tiptap-core` 0.18.1 (tarball da release na organização nova): bundle UMD, opção `contentLanguage` e correções desde a 0.15.2.

## [0.1.2] - 2026-11-23

### Alterado

- `@kelsoncm/tiptap-core` 0.15.2: KaTeX fixado em `^0.18.11` (compatível com `@tiptap/extension-mathematics`).

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
