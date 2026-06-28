function getNumber(id) {
  const value = Number(document.getElementById(id).value);
  if (!Number.isFinite(value)) {
    throw new Error(`Некорректное значение в поле ${id}`);
  }
  return value;
}

function roundUp(value, step) {
  return Math.ceil(value / step) * step;
}

function format(value) {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2
  }).format(value);
}

function calculateLapLength(data) {
  const termByDiameter = data.E * data.d;
  const termByResistance = (data.w * data.Rs / data.Rb + data.P) * data.d * data.S;
  const termByMinimum = data.Lan;

  const required = Math.max(termByDiameter, termByResistance, termByMinimum);
  const accepted = roundUp(required, data.roundStep);

  return {
    termByDiameter,
    termByResistance,
    termByMinimum,
    required,
    accepted,
    governing: getGoverningTerm(termByDiameter, termByResistance, termByMinimum)
  };
}

function getGoverningTerm(a, b, c) {
  const max = Math.max(a, b, c);
  if (max === a) return 'E × d';
  if (max === b) return '(w × Rs / Rb + P) × d × S';
  return 'Lan';
}

function renderResult(result) {
  const el = document.getElementById('result');
  el.className = 'result-box';
  el.innerHTML = `
    <div class="result-main">
      Требуемая длина нахлёста после округления:
      <strong>${format(result.accepted)} мм</strong>
    </div>

    <p class="check-ok">Определяющее условие: ${result.governing}</p>

    <table class="table">
      <tr><th>Проверка</th><th>Значение</th></tr>
      <tr><td>E × d</td><td>${format(result.termByDiameter)} мм</td></tr>
      <tr><td>(w × Rs / Rb + P) × d × S</td><td>${format(result.termByResistance)} мм</td></tr>
      <tr><td>Lan</td><td>${format(result.termByMinimum)} мм</td></tr>
      <tr><td>Максимум до округления</td><td>${format(result.required)} мм</td></tr>
    </table>
  `;
}

function renderError(message) {
  const el = document.getElementById('result');
  el.className = 'empty';
  el.innerHTML = `<span class="check-warn">${message}</span>`;
}

document.getElementById('lap-form').addEventListener('submit', (event) => {
  event.preventDefault();

  try {
    const data = {
      d: getNumber('d'),
      E: getNumber('E'),
      w: getNumber('w'),
      Rs: getNumber('Rs'),
      Rb: getNumber('Rb'),
      P: getNumber('P'),
      S: getNumber('S'),
      Lan: getNumber('Lan'),
      roundStep: getNumber('roundStep')
    };

    if (data.d <= 0 || data.Rb <= 0 || data.roundStep <= 0) {
      throw new Error('Диаметр, Rb и шаг округления должны быть больше нуля.');
    }

    renderResult(calculateLapLength(data));
  } catch (error) {
    renderError(error.message);
  }
});
