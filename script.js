function getNumber(id) {
  const element = document.getElementById(id);
  const value = Number(element.value);

  if (Number.isNaN(value)) {
    throw new Error(`Поле ${id} заполнено некорректно.`);
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
  return Number(value).toLocaleString('ru-RU', {
    maximumFractionDigits: 2
  });
}

// Расчётное сопротивление арматуры Rs, МПа
function getRs(rebarClass, diameter) {
  if (rebarClass === 'A240') return 225;
  if (rebarClass === 'A300') return 280;
  if (rebarClass === 'A500') return 455;
  if (rebarClass === 'A600') return 510;

  if (rebarClass === 'A400') {
    if (diameter >= 6 && diameter <= 8) return 355;
    if (diameter >= 10 && diameter <= 40) return 365;
    throw new Error('Для A400 доступны диаметры 6–8 мм или 10–40 мм.');
  }

  throw new Error('Неизвестный класс арматуры.');
}

// Расчётное сопротивление бетона Rb, МПа
function getRb(concreteClass) {
  const table = {
    'B3.5': 2.1,
    'B5': 2.8,
    'B7.5': 4.5,
    'B10': 6.0,
    'B12.5': 7.5,
    'B15': 8.5,
    'B20': 11.5,
    'B25': 14.5,
    'B30': 17.0,
    'B35': 19.5,
    'B40': 22.0,
    'B45': 25.0,
    'B50': 27.5,
    'B55': 30.0,
    'B60': 33.0
  };

  const value = table[concreteClass];

  if (!value) {
    throw new Error('Для выбранного класса бетона не задано Rb.');
  }

  return value;
}

// Коэффициент ωan по классу арматуры и зоне работы.
function getWan(rebarClass, stressZone) {
  if (rebarClass === 'A240') {
    if (stressZone === 'tension') return 1.55;
    if (stressZone === 'compression') return 1.0;
  }

  if (
    rebarClass === 'A300' ||
    rebarClass === 'A400' ||
    rebarClass === 'A500' ||
    rebarClass === 'A600'
  ) {
    if (stressZone === 'tension') return 0.9;
    if (stressZone === 'compression') return 0.65;
  }

  throw new Error('Для выбранного класса арматуры пока не задан ωan.');
}

// Коэффициент Δλan по классу арматуры и зоне работы.
function getDeltaLambdaAn(rebarClass, stressZone) {
  if (
    rebarClass === 'A240' ||
    rebarClass === 'A300' ||
    rebarClass === 'A400' ||
    rebarClass === 'A500' ||
    rebarClass === 'A600'
  ) {
    if (stressZone === 'tension') return 11;
    if (stressZone === 'compression') return 8;
  }

  throw new Error('Для выбранного класса арматуры пока не задан Δλan.');
}

function getStressZoneName(stressZone) {
  if (stressZone === 'tension') return 'Растянутая зона';
  if (stressZone === 'compression') return 'Сжатая зона';
  return stressZone;
}

function getSeismicIncreaseFactor(seismicIncrease) {
  return seismicIncrease === 'yes' ? 1.3 : 1.0;
}

function getSeismicIncreaseName(seismicIncrease) {
  return seismicIncrease === 'yes' ? 'Да' : 'Нет';
}

function calculateLapLength(data) {
  const Rs = getRs(data.rebarClass, data.d);
  const Rb = getRb(data.concreteClass);
  const wan = getWan(data.rebarClass, data.stressZone);
  const deltaLambdaAn = getDeltaLambdaAn(data.rebarClass, data.stressZone);

  // Формула:
  // lan = (ωan × Rs / Rb + Δλan) × d
  const resistanceRatio = wan * Rs / Rb;
  const coefficient = resistanceRatio + deltaLambdaAn;
  const lan = coefficient * data.d;

  const seismicFactor = getSeismicIncreaseFactor(data.seismicIncrease);
  const finalBeforeRounding = lan * seismicFactor;
  const accepted = roundUp(finalBeforeRounding, data.roundStep);

  return {
    ...data,
    Rs,
    Rb,
    wan,
    deltaLambdaAn,
    resistanceRatio,
    coefficient,
    lan,
    seismicFactor,
    finalBeforeRounding,
    accepted
  };
}

function renderResult(result) {
  const el = document.getElementById('result');
  el.className = 'result-box';

  el.innerHTML = `
    <p class="result-main">
      Принять l<sub>an</sub>: <strong>${format(result.accepted)} мм</strong>
    </p>

    <table class="table">
      <tr>
        <th>Параметр</th>
        <th>Значение</th>
      </tr>
      <tr>
        <td>Класс арматуры</td>
        <td>${result.rebarClass}</td>
      </tr>
      <tr>
        <td>Диаметр d</td>
        <td>${format(result.d)} мм</td>
      </tr>
      <tr>
        <td>Зона работы</td>
        <td>${getStressZoneName(result.stressZone)}</td>
      </tr>
      <tr>
        <td>Учет сейсмических условий согласно п.3.8.14 КМК 2.01.03-19</td>
        <td>${getSeismicIncreaseName(result.seismicIncrease)}</td>
      </tr>
      <tr>
        <td>R<sub>s</sub></td>
        <td>${format(result.Rs)} МПа</td>
      </tr>
      <tr>
        <td>Класс бетона</td>
        <td>${result.concreteClass}</td>
      </tr>
      <tr>
        <td>R<sub>b</sub></td>
        <td>${format(result.Rb)} МПа</td>
      </tr>
      <tr>
        <td>ω<sub>an</sub></td>
        <td>${format(result.wan)}</td>
      </tr>
      <tr>
        <td>Δλ<sub>an</sub></td>
        <td>${format(result.deltaLambdaAn)}</td>
      </tr>
      <tr>
        <td>ω<sub>an</sub> × R<sub>s</sub> / R<sub>b</sub></td>
        <td>${format(result.resistanceRatio)}</td>
      </tr>
      <tr>
        <td>Коэффициент в скобках</td>
        <td>${format(result.coefficient)}</td>
      </tr>
      <tr>
        <td>l<sub>an</sub> без сейсмического увеличения</td>
        <td>${format(result.lan)} мм</td>
      </tr>
      <tr>
        <td>Коэффициент сейсмического увеличения</td>
        <td>${format(result.seismicFactor)}</td>
      </tr>
      <tr>
        <td>Итоговая длина до округления</td>
        <td>${format(result.finalBeforeRounding)} мм</td>
      </tr>
      <tr>
        <td>Округление вверх</td>
        <td>до ${format(result.roundStep)} мм</td>
      </tr>
    </table>
  `;
}

function renderError(message) {
  const el = document.getElementById('result');
  el.className = 'result-box error';
  el.textContent = message;
}

document.getElementById('lap-form').addEventListener('submit', (event) => {
  event.preventDefault();

  try {
    const data = {
      rebarClass: getText('rebarClass'),
      d: getNumber('d'),
      stressZone: getText('stressZone'),
      seismicIncrease: getText('seismicIncrease'),
      concreteClass: getText('concreteClass'),
      roundStep: getNumber('roundStep')
    };

    if (data.d <= 0 || data.roundStep <= 0) {
      throw new Error('Диаметр и шаг округления должны быть больше нуля.');
    }

    renderResult(calculateLapLength(data));
  } catch (error) {
    renderError(error.message);
  }
});
