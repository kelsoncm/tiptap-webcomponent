import '../src/index.js';

const form = document.getElementById('form') as HTMLFormElement;
const out = document.getElementById('out') as HTMLPreElement;
const obs = document.getElementById('obs') as HTMLElement;

form.addEventListener('submit', (event) => {
  event.preventDefault();
  out.textContent = JSON.stringify(Object.fromEntries(new FormData(form)), null, 2);
});
document.getElementById('toggle')?.addEventListener('click', () => obs.toggleAttribute('readonly'));
document.getElementById('locale')?.addEventListener('change', (event) => {
  const locale = (event.target as HTMLSelectElement).value;
  document.querySelectorAll('kelsoncm-tiptap').forEach((el) => el.setAttribute('locale', locale));
});
