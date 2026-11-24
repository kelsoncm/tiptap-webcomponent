# &lt;kelsoncm-tiptap&gt;

Editor de texto rico como **web component**, sem framework, sobre o
[@kelsoncm/tiptap-core](https://github.com/tiptap-by-kelsoncm/tiptap-core) (Tiptap 3). Funciona em HTML puro,
Django, PHP, Vue, React, Angular etc., e participa de formulários como um `<textarea>`.

## Instalação

Com bundler (Vite, webpack...):

```bash
npm install @kelsoncm/tiptap-webcomponent
```

```ts
import '@kelsoncm/tiptap-webcomponent'; // registra <kelsoncm-tiptap> e injeta o CSS
```

Sem bundler, use o arquivo único `kelsoncm-tiptap.bundle.js`, que vem no pacote (`dist/`) e na
[release](https://github.com/tiptap-by-kelsoncm/tiptap-webcomponent/releases/latest):

```html
<script type="module" src="/static/kelsoncm-tiptap.bundle.js"></script>
```

(Hospede o arquivo no seu servidor ou use um CDN de pacotes npm; o GitHub não serve assets com o tipo
JavaScript.)

## Uso

```html
<form method="post">
  <kelsoncm-tiptap name="descricao" required toolbar="full" max-words="500" placeholder="Descreva…">
    <p>Conteúdo inicial</p>
  </kelsoncm-tiptap>
  <button>Enviar</button>
</form>
```

O valor enviado é o HTML do editor (vazio quando o documento está vazio).

### Atributos

| Atributo                                        | Descrição                                                      |
| ----------------------------------------------- | -------------------------------------------------------------- |
| `name`, `required`, `disabled`                  | Comportamento de campo de formulário.                          |
| `value`                                         | HTML inicial (alternativa ao conteúdo dentro da tag).          |
| `mode`                                          | `toolbar` (padrão), `balloon`, `inline`, `notion`, `readonly`. |
| `toolbar`                                       | `minimal`, `basic`, `full` (padrão).                           |
| `readonly`                                      | Somente leitura.                                               |
| `locale`                                        | `pt-BR` (padrão), `en`, `es`.                                  |
| `placeholder`                                   | Texto do documento vazio.                                      |
| `min-height`, `max-height`                      | Altura do conteúdo (CSS).                                      |
| `max-characters`, `max-words`, `max-paragraphs` | Limites aplicados durante a digitação.                         |
| `min-characters`, `min-words`, `min-paragraphs` | Mínimos exibidos na barra de status.                           |
| `status-bar="false"`                            | Esconde a barra de status.                                     |

### Propriedades e métodos

```js
const el = document.querySelector('kelsoncm-tiptap');
el.value = '<p>Novo conteúdo</p>';
el.options = {
  mentions: { items: [{ id: 'ana', label: 'Ana' }] },
  media: { upload: async (file) => (await enviar(file)).url },
  revision: { user: { id: '1', name: 'Kelson' } },
};
el.editor; // EditorUI do core (comandos, i18n, Tiptap editor)
el.editor.run('bold');
el.checkValidity();
```

`options` aceita qualquer opção de `createEditorUI` do core (menções, merge fields, mídia, tabelas,
revisão, verificadores, plugins...). Alterar `options` recria o editor mantendo o conteúdo.

### Eventos

| Evento          | Quando                                                        |
| --------------- | ------------------------------------------------------------- |
| `kt-ready`      | Editor criado (`event.detail.editor`).                        |
| `kt-change`     | A cada alteração (`event.detail.html`, `event.detail.empty`). |
| `input`         | A cada alteração.                                             |
| `change`        | Ao sair do editor após alterações.                            |
| `focus`, `blur` | Foco do editor.                                               |

### Estilos

O CSS do core é injetado uma vez no `<head>` (`#kelsoncm-tiptap-styles`). O editor fica no DOM da
página (sem shadow DOM), então seus estilos e as variáveis `--kt-*` se aplicam:

```css
kelsoncm-tiptap .kt-editor {
  --kt-accent: #1351b4;
  --kt-radius: 8px;
}
```

## Desenvolvimento

```bash
npm ci
npm run dev      # demo em http://localhost:5181
npm run lint
npm run typecheck
npm test
npm run build    # dist/index.js (ESM), dist/kelsoncm-tiptap.bundle.js (arquivo único)
```

## Licença

[MIT](LICENSE)
