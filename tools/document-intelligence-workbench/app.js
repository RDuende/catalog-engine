document.querySelector('#analyze').addEventListener('click', (event) => {
  const button = event.currentTarget;
  button.textContent = 'Analizando…';
  setTimeout(() => { button.textContent = 'Análisis completado'; }, 700);
});
