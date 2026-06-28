function getNumber(id) {
  const value = Number(document.getElementById(id).value);
  if (!Number.isFinite(value)) {
    throw new Error(`Некорректное значение в поле ${id}`);
  }
  return value;
}

function getText(id) {
  return document.getElementById(id).value;
}

function roundUp(value, step) {
  return Math.ceil(value / step) * step;
}

function format(value) {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2
  }).format(value);
}

// Расчётное сопротивление арматуры Rs, МПа
// Данные внесены по предоставленной таблице.
function getRs(rebarClass, diameter) {
  if (rebarClass === 'A240') return 225;
  if (rebarClass === 'A300') return 280;
  if (rebarClass === 'A500') return 455;

  if (rebarClass === 'A400') {
    if (diameter >= 6 && diameter <= 8) return 355;
    if (diameter >= 10 && diameter <= 40) return 365;
    throw new Error('Для A400 доступны диаметры 6–8 мм или 10–40 мм.');
  }

  throw new Error('Неизвестный класс арматуры.');
}

function calculateLapLength(data) {
  const Rs = getRs(data.rebarClass, data.d);

  // Формула: lan = (ωan × Rs / Rb + Δλan) × d
  const resistanceRatio = data.wan * Rs / data.Rb;
  const coefficient = resistanceRatio + data.deltaLambdaAn;
  const lan = coefficient * data.d;
  const accepted = roundUp(lan, data.roundStep);

  return {
    ...data,
    Rs,
    resistanceRatio,
    coefficient,
    lan,
    accepted
  };
}

function renderResult(result) {
  const el = document.getElementById('result');
  el.className = 'result-box';
  el.innerHTML = `
    <div class="result-main">
      Длина нахлёста после округления:
      <strong>${format(result.accepted)} мм</strong>
    </div>

    <p class="check-ok">Rs принято автоматически: ${format(result.Rs)} МПа</p>

    <table class="table">
      <tr><th>Параметр / проверка</th><th>Значение</th></tr>
      <tr><td>Класс арматуры</td><td>${result.rebarClass}</td></tr>
      <tr><td>Диаметр d</td><td>${format(result.d)} мм</td></tr>
      <tr><td>Rs</td><td>${format(result.Rs)} МПа</td></tr>
      <tr><td>Rb</td><td>${format(result.Rb)} МПа</td></tr>
      <tr><td>ωan</td><td>${format(result.wan)}</td></tr>
      <tr><td>Δλan</td><td>${format(result.deltaLambdaAn)}</td></tr>
      <tr><td>ωan × Rs / Rb</td><td>${format(result.resistanceRatio)}</td></tr>
      <tr><td>ωan × Rs / Rb + Δλan</td><td>${format(result.coefficient)}</td></tr>
      <tr><td>lan до округления</td><td>${format(result.lan)} мм</td></tr>
      <tr><td>Принять</td><td><strong>${format(result.accepted)} мм</strong></td></tr>
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
      rebarClass: getText('rebarClass'),
      d: getNumber('d'),
      wan: getNumber('wan'),
      Rb: getNumber('Rb'),
      deltaLambdaAn: getNumber('deltaLambdaAn'),
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
