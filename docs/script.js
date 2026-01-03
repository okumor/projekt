document.addEventListener('DOMContentLoaded', function() {
  // ===== MENU SPA =====
  const menuLinks = document.querySelectorAll('nav a');
  const sections = document.querySelectorAll('main section');

  menuLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault(); // blokujemy domyślny link
      const targetId = link.getAttribute('data-target'); // pobieramy ID sekcji

      // jeśli kliknięto 'dashboard' — pokaż tylko dashboard
      // w przeciwnym razie pokaż tylko docelową sekcję i ukryj dashboard
      sections.forEach(sec => {
        if (targetId === 'dashboard') {
          if (sec.id === 'dashboard') sec.classList.remove('hidden');
          else sec.classList.add('hidden');
        } else {
          if (sec.id === targetId) sec.classList.remove('hidden');
          else sec.classList.add('hidden');
        }
      });

      // Jeśli pokazujemy Analytics, przerysuj wykres po krótkim opóźnieniu (layout musi się ustawić)
      if (targetId === 'analytics') {
        setTimeout(() => {
          const rangeSelect = document.getElementById('trend-range');
          const range = rangeSelect ? rangeSelect.value : 'days';
          updateTrendChart(range);
          // Rysujemy również 12-dniowy wykres słupkowy po otwarciu zakładki
          console.log('Analytics tab opened — forcing 12-day chart render');
          render12DayBarChart();
        }, 120);
      }
    });
  });


});
// =============================================
// INTERAKTYWNY SYSTEM MONITOROWANIA POZIOMU CUKRU WE KRWI - CZYSTY JAVASCRIPT
// =============================================

// ===== 1. PRZECHOWYWANIE DANYCH =====
// Pobieramy dane z localStorage lub tworzymy pustą tablicę
let measurements = JSON.parse(localStorage.getItem('glucoseMeasurements')) || [];
let lastGlucoseStatus = null;
// =============================================
// PRZYKŁADOWE DANE TESTOWE
// =============================================

// Jeśli nie ma jeszcze danych w localStorage, dodajemy przykładowe
if (measurements.length === 0) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  // Formatujemy daty na YYYY-MM-DD
  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }
  
  measurements = [
    // Dziś
    {
      id: Date.now() - 10000,
      glucose: 95,
      date: formatDate(today),
      time: "08:15",
      insulin: 8,
      note: "Na czczo, przed śniadaniem",
      timestamp: new Date(`${formatDate(today)}T08:15`).getTime()
    },
    {
      id: Date.now() - 20000,
      glucose: 145,
      date: formatDate(today),
      time: "13:30",
      insulin: 12,
      note: "Po obiedzie - spaghetti",
      timestamp: new Date(`${formatDate(today)}T13:30`).getTime()
    },
    {
      id: Date.now() - 30000,
      glucose: 120,
      date: formatDate(today),
      time: "19:45",
      insulin: 6,
      note: "Przed kolacją",
      timestamp: new Date(`${formatDate(today)}T19:45`).getTime()
    },
    
    // Wczoraj
    {
      id: Date.now() - 40000,
      glucose: 105,
      date: formatDate(yesterday),
      time: "07:45",
      insulin: 7,
      note: "Poranny pomiar",
      timestamp: new Date(`${formatDate(yesterday)}T07:45`).getTime()
    },
    {
      id: Date.now() - 50000,
      glucose: 180,
      date: formatDate(yesterday),
      time: "14:00",
      insulin: 15,
      note: "Po obiedzie - pizza",
      timestamp: new Date(`${formatDate(yesterday)}T14:00`).getTime()
    },
    {
      id: Date.now() - 60000,
      glucose: 85,
      date: formatDate(yesterday),
      time: "22:00",
      insulin: 4,
      note: "Przed snem",
      timestamp: new Date(`${formatDate(yesterday)}T22:00`).getTime()
    },
    
    // Przedwczoraj
    {
      id: Date.now() - 70000,
      glucose: 115,
      date: formatDate(twoDaysAgo),
      time: "08:30",
      insulin: 9,
      note: "Śniadanie - owsianka",
      timestamp: new Date(`${formatDate(twoDaysAgo)}T08:30`).getTime()
    },
    {
      id: Date.now() - 80000,
      glucose: 65,
      date: formatDate(twoDaysAgo),
      time: "12:15",
      insulin: 0,
      note: "Hipoglikemia! Zjadłem banana",
      timestamp: new Date(`${formatDate(twoDaysAgo)}T12:15`).getTime()
    },
    {
      id: Date.now() - 90000,
      glucose: 160,
      date: formatDate(twoDaysAgo),
      time: "18:45",
      insulin: 10,
      note: "Po treningu",
      timestamp: new Date(`${formatDate(twoDaysAgo)}T18:45`).getTime()
    }
  ];
  
  // Zapisujemy przykładowe dane do localStorage
  localStorage.setItem('glucoseMeasurements', JSON.stringify(measurements));
  
  console.log('✅ Załadowano przykładowe dane testowe!');
}
// ===== 2. POMOCNICZE FUNKCJE =====
// Formatuje datę i godzinę na polski format
function formatDateTime(dateStr, timeStr) {
  if (!dateStr) {
    // Jeśli nie ma daty, używamy bieżącej
    const now = new Date();
    return now.toLocaleString('pl-PL');
  }
  const date = new Date(`${dateStr}T${timeStr || '12:00'}`);
  return date.toLocaleString('pl-PL');
}

// Formatuje tylko datę
function formatDateForDisplay(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pl-PL');
}

// Sprawdza poziom glukozy i zwraca odpowiednią klasę CSS
function getGlucoseClass(value) {
  // Nowa logika:
  // <50 -> very-low (czerwony)
  // 50-69 -> low (żółty)
  // 70-140 -> normal (zielony)
  // 141-180 -> high (żółty)
  // >180 -> very-high (czerwony)
  if (value < 50) return 'glucose-very-low';
  if (value < 70) return 'glucose-low';
  if (value <= 140) return 'glucose-normal';
  if (value <= 180) return 'glucose-high';
  return 'glucose-very-high';
} 



// ===== 4. FUNKCJA AKTUALIZUJĄCA CAŁĄ STRONĘ =====
function updateAllSections() {
  updateDashboard();
  updateHistoryTable();
  updateMiniChart();
  updateAnalytics();
}

// ===== 5. AKTUALIZACJA DASHBOARDU =====
function updateDashboard() {
  const currentGlucoseCard = document.querySelector('#current-glucose-card p');
  const summaryList = document.querySelector('#daily-summary ul');
  
  if (measurements.length === 0) {
    // Jeśli nie ma pomiarów, pokazujemy informację
    if (currentGlucoseCard) {
      currentGlucoseCard.innerHTML = '<em>Brak pomiarów. Dodaj pierwszy pomiar!</em>';
    }
    if (summaryList) {
      summaryList.innerHTML = '<li><em>Brak danych do wyświetlenia</em></li>';
    }
    return;
  }
  
  // --- NAJNOWSZY POMIAR ---
  const latest = measurements[measurements.length - 1];
  if (currentGlucoseCard) {
    const glucoseClass = getGlucoseClass(latest.glucose);

    // określamy status i komunikat na podstawie progu
    const g = latest.glucose;
    let status = 'normal';
    let statusMsg = 'prawidłowy poziom cukru';
    let notifType = 'success';

    if (g < 50) { status = 'very-low'; statusMsg = 'niski cukier'; notifType = 'error'; }
    else if (g < 70) { status = 'low'; statusMsg = 'niski cukier'; notifType = 'warning'; }
    else if (g <= 140) { status = 'normal'; statusMsg = 'prawidłowy poziom cukru'; notifType = 'success'; }
    else if (g <= 180) { status = 'high'; statusMsg = 'za wysoki poziom cukru'; notifType = 'warning'; }
    else { status = 'very-high'; statusMsg = 'za wysoki poziom cukru'; notifType = 'error'; }

    currentGlucoseCard.innerHTML = `
      <span class="${glucoseClass}" style="font-size: 1.5em; font-weight: bold;">
        ${g} mg/dL
      </span><br>
      <small>${formatDateTime(latest.date, latest.time)}</small>
      <div class="glucose-status-message" style="margin-top:8px; font-weight:600; color:#333">${statusMsg}</div>
    `;

    // Wyświetlamy systemowe powiadomienie tylko wtedy, gdy status się zmienił
    if (lastGlucoseStatus !== status) {
      showNotification(statusMsg, notifType);
      lastGlucoseStatus = status;
    }
  }
  
  // --- STATYSTYKI OSTATNICH 24H ---
  const now = Date.now();
  const last24h = measurements.filter(m => now - m.timestamp <= 24 * 60 * 60 * 1000);
  
  if (last24h.length > 0) {
    const values = last24h.map(m => m.glucose);
    const avg = Math.round(values.reduce((a,b) => a+b) / values.length);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    const summaryHTML = `
      <li><strong>Średni poziom glukozy:</strong> ${avg} mg/dL</li>
      <li><strong>Liczba pomiarów:</strong> ${last24h.length}</li>
      <li><strong>Minimalna wartość:</strong> ${min} mg/dL</li>
      <li><strong>Maksymalna wartość:</strong> ${max} mg/dL</li>
    `;
    
    if (summaryList) summaryList.innerHTML = summaryHTML;
  }
}

// ===== 6. AKTUALIZACJA TABELI HISTORII =====
function updateHistoryTable() {
  const tbody = document.querySelector('#history table tbody');
  if (!tbody) return;
  
  if (measurements.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px;">
          <em>Brak pomiarów. Dodaj pierwszy pomiar!</em>
        </td>
      </tr>
    `;
    return;
  }
  
  // Sortujemy od najnowszych
  const sorted = [...measurements].sort((a,b) => b.timestamp - a.timestamp);
  
  // Tworzymy wiersze tabeli
  tbody.innerHTML = sorted.map(measurement => `
    <tr>
      <td>${formatDateForDisplay(measurement.date)}</td>
      <td>${measurement.time}</td>
      <td>
        <span class="${getGlucoseClass(measurement.glucose)}">
          <strong>${measurement.glucose} mg/dL</strong>
        </span>
      </td>
      <td>${measurement.insulin === '-' ? '-' : measurement.insulin + ' IU'}</td>
      <td>${measurement.carbs === '-' ? '-' : measurement.carbs + ' g'}</td>
      <td>${measurement.note}</td>
    </tr>
  `).join('');
}

// ===== 7. MINI WYKRES BEZ BIBLIOTEKI =====
function updateMiniChart() {
  const miniChartDiv = document.querySelector('#mini-chart');
  if (!miniChartDiv) return;
  
  const chartContent = miniChartDiv.querySelector('p') || document.createElement('p');
  
  if (measurements.length < 2) {
    chartContent.innerHTML = '<em>Dodaj więcej pomiarów, aby zobaczyć wykres</em>';
    if (!miniChartDiv.querySelector('p')) miniChartDiv.appendChild(chartContent);
    return;
  }
  
  // Bierzemy ostatnie 8 pomiarów lub wszystkie jeśli jest mniej
  const recent = measurements.slice(-8);
  const values = recent.map(m => m.glucose);
  const times = recent.map(m => m.time.substring(0,5)); // Tylko godzina
  
  // Obliczamy zakres dla skalowania
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1; // Zabezpieczenie przed dzieleniem przez 0
  
  // Tworzymy wykres słupkowy
  const chartHTML = `
    <div style="width: 100%; height: 150px; display: flex; align-items: flex-end; justify-content: space-between; padding: 10px 0;">
      ${values.map((val, index) => {
        // Obliczamy wysokość słupka (od 10% do 90% wysokości)
        const heightPercent = range > 0 ? 10 + ((val - minVal) / range * 80) : 50;
        const glucoseClass = getGlucoseClass(val);
        
        return `
          <div style="display: flex; flex-direction: column; align-items: center; height: 100%;">
            <div style="
              width: 25px;
              height: ${heightPercent}%;
              background: ${getGlucoseColor(val)};
              border-radius: 3px 3px 0 0;
              transition: height 0.3s;
            " title="${val} mg/dL"></div>
            <div style="margin-top: 5px; font-size: 0.8em; color: #666;">${times[index]}</div>
            <div style="margin-top: 2px; font-size: 0.7em; color: #999;">${val}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  chartContent.innerHTML = chartHTML;
  if (!miniChartDiv.querySelector('p')) miniChartDiv.appendChild(chartContent);
}

// Pomocnicza funkcja do kolorów wykresu
function getGlucoseColor(value) {
  if (value < 50) return '#dc3545';     // Czerwony
  if (value < 70) return '#ffc107';     // Żółty
  if (value <= 140) return '#28a745';   // Zielony
  if (value <= 180) return '#ffc107';   // Żółty
  return '#dc3545';                     // Czerwony
} 

// ===== 8. ANALIZY I STATYSTYKI =====

// ===== 12-DNIOWY WYKRES SŁUPKOWY (ostatnie 12 dni) =====
function render12DayBarChart(container) {
  // Try multiple selectors — prefer explicit id
  if (!container) container = document.getElementById('trend-placeholder') || document.querySelector('#analytics .analytics-card:first-child .placeholder');
  console.log('render12DayBarChart called, container=', container);
  if (!container) {
    console.error('render12DayBarChart: placeholder element not found');
    return;
  }

  const now = new Date();
  const labels = [];
  const avgs = [];

  // Zbieramy ostatnie 12 dni (od najstarszego do najnowszego)
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const iso = d.toISOString().split('T')[0];
    labels.push(d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' }));

    const dayMeasurements = measurements.filter(m => m.date === iso);
    if (dayMeasurements.length === 0) {
      avgs.push(null);
    } else {
      const avg = Math.round(dayMeasurements.reduce((s, m) => s + m.glucose, 0) / dayMeasurements.length);
      avgs.push(avg);
    }
  }

  const nonNull = avgs.filter(v => v !== null);
  const max = nonNull.length ? Math.max(...nonNull) : 100; // gdy brak danych, używamy 100 jako punkt odniesienia

  console.log('render12DayBarChart: labels=', labels);
  console.log('render12DayBarChart: avgs=', avgs);
  console.log('render12DayBarChart: max=', max);

  try {
    // Obliczamy zakres tylko z dni posiadających dane
    const validAvgs = avgs.filter(v => v !== null);
    if (validAvgs.length === 0) {
      // żadnych pomiarów w ostatnich 12 dniach — pokaż czytelne info użytkownikowi
      container.innerHTML = '<div class="empty-state">Brak danych do wykresu — dodaj pomiary z ostatnich 12 dni, aby zobaczyć słupki.</div>';
      console.warn('render12DayBarChart: brak danych (wszystkie dni puste)');
      return;
    }

    const minAvg = Math.min(...validAvgs);
    const maxAvg = Math.max(...validAvgs);
    const rangeAvg = maxAvg - minAvg || 1;

    container.innerHTML = `
      <div class="bar-chart" role="img" aria-label="Średnie poziomy glukozy z ostatnich 12 dni">
        ${avgs.map((avg, idx) => {
          // mapowanie do przedziału 10% - 90% jak w mini-chart
          let heightPct;
          if (avg === null) heightPct = 6;
          else if (validAvgs.length === 1) heightPct = 50; // kiedy tylko jedna wartość, ustawiamy środek
          else heightPct = Math.round(10 + ((avg - minAvg) / rangeAvg) * 80);
          const displayVal = avg === null ? '-' : (avg + ' mg/dL');
          const hasData = avg !== null;
          return `
            <div class="bar" data-has-data="${hasData}" title="${hasData ? displayVal : 'Brak danych'}">
              <div class="bar-fill ${hasData ? 'has-data' : 'no-data'}" data-target="${heightPct}" style="height: ${hasData ? 0 : 6}%; border-radius: 3px 3px 0 0;"></div>
              <div class="bar-value">${displayVal}</div>
              <div class="bar-label">${labels[idx]}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Restore placeholder display to CSS default to avoid flex/block conflicts
    container.style.display = '';

    // Quick validation/logging to detect if DOM updated correctly
    const bars = container.querySelectorAll('.bar');
    console.log('render12DayBarChart: rendered bars count=', bars.length);
    if (bars.length !== 12) {
      console.warn('render12DayBarChart: expected 12 bars, got', bars.length);
    }

    // Animujemy słupki dla dni z danymi (płynnie jak mini-chart)
    const fillEls = container.querySelectorAll('.bar-fill.has-data');
    if (fillEls.length === 0) {
      console.warn('render12DayBarChart: no .bar-fill.has-data elements found; avgs=', avgs);
    }
    fillEls.forEach((el, i) => {
      const tgt = el.getAttribute('data-target') || '0';
      el.style.height = '0%';
      // dodajemy stagger (drobne opóźnienie) by animacja była ładniejsza
      setTimeout(() => { el.style.height = tgt + '%'; }, 60 + i * 30);
    });

    // Ustawia małe 'stub' dla dni bez danych
    const noDataFills = container.querySelectorAll('.bar-fill.no-data');
    noDataFills.forEach(el => {
      el.style.height = '6%';
      el.style.background = 'linear-gradient(180deg,#e9ecef,#f8f9fa)';
      el.style.border = '1px solid #e1e1e1';
      el.style.opacity = '0.9';
    });
  } catch (err) {
    console.error('render12DayBarChart failed:', err);
    container.innerHTML = '<em>Błąd renderowania wykresu</em>';
  }
}

// ----- TREND CHART HELPERS -----
function aggregateMeasurements(range) {
  const labels = [];
  const glucoseSeries = [];
  const insulinSeries = [];
  const now = new Date();

  if (range === 'days') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayMeasurements = measurements.filter(x => x.date === dateStr);
      labels.push(d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' }));
      if (dayMeasurements.length === 0) { glucoseSeries.push(null); insulinSeries.push(null); continue; }
      const avgGlucose = Math.round(dayMeasurements.reduce((s, x) => s + x.glucose, 0) / dayMeasurements.length);
      const insulinVals = dayMeasurements.map(x => (x.insulin === '-' ? null : x.insulin)).filter(v => v !== null && !isNaN(v));
      const avgIns = insulinVals.length ? Math.round(insulinVals.reduce((s, x) => s + x, 0) / insulinVals.length * 10) / 10 : null;
      glucoseSeries.push(avgGlucose);
      insulinSeries.push(avgIns);
    }
  } else if (range === 'weeks') {
    for (let i = 6; i >= 0; i--) {
      const end = new Date(now);
      end.setDate(now.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      labels.push(`${start.getDate().toString().padStart(2,'0')}.${(start.getMonth()+1).toString().padStart(2,'0')}`);
      const ms = measurements.filter(m => m.timestamp >= start.getTime() && m.timestamp <= end.getTime());
      if (ms.length === 0) { glucoseSeries.push(null); insulinSeries.push(null); continue; }
      const avgGlucose = Math.round(ms.reduce((s, x) => s + x.glucose, 0) / ms.length);
      const insulinVals = ms.map(x => (x.insulin === '-' ? null : x.insulin)).filter(v => v !== null && !isNaN(v));
      const avgIns = insulinVals.length ? Math.round(insulinVals.reduce((s, x) => s + x, 0) / insulinVals.length * 10) / 10 : null;
      glucoseSeries.push(avgGlucose);
      insulinSeries.push(avgIns);
    }
  } else {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear(); const mth = d.getMonth();
      labels.push(d.toLocaleString('pl-PL', { month: 'short', year: 'numeric' }));
      const ms = measurements.filter(x => {
        const dt = new Date(x.date);
        return dt.getFullYear() === y && dt.getMonth() === mth;
      });
      if (ms.length === 0) { glucoseSeries.push(null); insulinSeries.push(null); continue; }
      const avgGlucose = Math.round(ms.reduce((s, x) => s + x.glucose, 0) / ms.length);
      const insulinVals = ms.map(x => (x.insulin === '-' ? null : x.insulin)).filter(v => v !== null && !isNaN(v));
      const avgIns = insulinVals.length ? Math.round(insulinVals.reduce((s, x) => s + x, 0) / insulinVals.length * 10) / 10 : null;
      glucoseSeries.push(avgGlucose);
      insulinSeries.push(avgIns);
    }
  }

  return { labels, glucoseSeries, insulinSeries };
}

let currentTrendRange = 'days';

function updateTrendChart(range = 'days') {
  currentTrendRange = range;
  const canvas = document.getElementById('trend-chart');
  const placeholder = document.querySelector('#analytics .analytics-card:first-child .placeholder');
  if (!canvas || !placeholder) return;

  // Jeśli canvas ma szerokość 0 (np. sekcja dopiero się pokazuje), spróbuj ponownie po krótkim czasie
  if ((canvas.clientWidth || 0) < 20) {
    setTimeout(() => updateTrendChart(range), 120);
    return;
  }

  const { labels, glucoseSeries, insulinSeries } = aggregateMeasurements(range);
  drawTrendChart(canvas, labels, glucoseSeries, insulinSeries);

  let legend = placeholder.querySelector('.trend-legend');
  if (!legend) {
    legend = document.createElement('div');
    legend.className = 'trend-legend';
    legend.style.marginTop = '8px';
    legend.innerHTML = `<span style="display:inline-flex; align-items:center; gap:6px; margin-right:10px;"><span style="width:12px;height:6px;background:#dc3545;display:inline-block;border-radius:2px"></span>Glukoza</span><span style="display:inline-flex; align-items:center; gap:6px;"><span style="width:12px;height:6px;background:#007bff;display:inline-block;border-radius:2px"></span>Insulina</span>`;
    placeholder.appendChild(legend);
  }
}

function drawTrendChart(canvas, labels, glucoseSeries, insulinSeries) {
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = parseInt(canvas.getAttribute('height')) || 260;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.height = height + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);
  const padding = { left: 40, right: 50, top: 20, bottom: 40 };
  const w = width - padding.left - padding.right;
  const h = height - padding.top - padding.bottom;

  const gvals = glucoseSeries.filter(v => v !== null);
  const ivals = insulinSeries.filter(v => v !== null);
  const gmax = gvals.length ? Math.max(...gvals) : 100;
  const gmin = gvals.length ? Math.min(...gvals) : 0;
  const imax = ivals.length ? Math.max(...ivals) : 10;

  // Jeśli nie ma żadnych wartości do narysowania, pokazujemy czytelny komunikat na canvasie
  if (gvals.length === 0 && ivals.length === 0) {
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Brak danych do wykresu', padding.left + w / 2, padding.top + h / 2);
    return;
  }

  ctx.strokeStyle = '#eee';
  ctx.lineWidth = 1;
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (i / gridLines) * h;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + w, y);
    ctx.stroke();
  }

  const n = labels.length;
  const xStep = n > 1 ? w / (n - 1) : w;

  // Glukoza
  ctx.beginPath();
  ctx.strokeStyle = '#dc3545';
  ctx.lineWidth = 2;
  for (let i = 0; i < n; i++) {
    const val = glucoseSeries[i];
    if (val === null) { ctx.moveTo(padding.left + i * xStep, padding.top + h); continue; }
    const x = padding.left + i * xStep;
    const y = padding.top + h - ((val - gmin) / (gmax - gmin || 1)) * h;
    if (i === 0 || glucoseSeries[i - 1] === null) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Insulina
  ctx.beginPath();
  ctx.strokeStyle = '#007bff';
  ctx.lineWidth = 2;
  for (let i = 0; i < n; i++) {
    const val = insulinSeries[i];
    if (val === null) { ctx.moveTo(padding.left + i * xStep, padding.top + h); continue; }
    const x = padding.left + i * xStep;
    const y = padding.top + h - (val / (imax || 1)) * h;
    if (i === 0 || insulinSeries[i - 1] === null) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Points & labels
  for (let i = 0; i < n; i++) {
    const x = padding.left + i * xStep;
    const gv = glucoseSeries[i];
    if (gv !== null) {
      const y = padding.top + h - ((gv - gmin) / (gmax - gmin || 1)) * h;
      ctx.fillStyle = '#dc3545';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    const iv = insulinSeries[i];
    if (iv !== null) {
      const y2 = padding.top + h - (iv / (imax || 1)) * h;
      ctx.fillStyle = '#007bff';
      ctx.beginPath();
      ctx.arc(x, y2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], x, padding.top + h + 18);
  }

  // y-axis labels
  ctx.fillStyle = '#666';
  ctx.textAlign = 'right';
  ctx.font = '12px Arial';
  ctx.fillText(gmax + ' mg/dL', padding.left - 6, padding.top + 6);
  ctx.fillText((gmin) + '', padding.left - 6, padding.top + h);
  ctx.textAlign = 'left';
  ctx.fillText((imax) + ' IU', padding.left + w + 6, padding.top + 6);
}

function updateAnalytics() {
  const trendPlaceholder = document.querySelector('#analytics .analytics-card:first-child .placeholder');
  const analyticsSection = document.querySelector('#analytics .analytics-card:last-child .placeholder');
  if (!analyticsSection || !trendPlaceholder) return;

  // Gdy analytics są widoczne, przerysowujemy wykres (służy też do odświeżenia po dodaniu pomiaru)
  const analyticsSectionWrapper = document.querySelector('#analytics');
  if (analyticsSectionWrapper && !analyticsSectionWrapper.classList.contains('hidden')) {
    const rangeSelect = document.getElementById('trend-range');
    const range = rangeSelect ? rangeSelect.value : 'days';
    updateTrendChart(range);
  }

  if (measurements.length === 0) {
    analyticsSection.innerHTML = '<em>Brak danych do analizy</em>';
    trendPlaceholder.innerHTML = '<em>Brak danych do wykresu</em>';
    return;
  }

  // Update trend chart based on selected range
  const rangeSelect = document.getElementById('trend-range');
  const range = rangeSelect ? rangeSelect.value : 'days';
  updateTrendChart(range);

  // Render 12-day average bar chart (ostatnie 12 dni)
  render12DayBarChart(trendPlaceholder);

  // Ostatnie 7 dni
  const now = Date.now();
  const last7days = measurements.filter(m => now - m.timestamp <= 7 * 24 * 60 * 60 * 1000);
  
  if (last7days.length === 0) {
    analyticsSection.innerHTML = '<em>Brak pomiarów z ostatnich 7 dni</em>';
    return;
  }
  
  const values = last7days.map(m => m.glucose);
  const avg = Math.round(values.reduce((a,b) => a+b) / values.length);
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Liczymy ile pomiarów było w normie (70-140)
  const inRange = values.filter(v => v >= 70 && v <= 140).length;
  const inRangePercent = Math.round((inRange / values.length) * 100); 
  
  // Analiza por dnia
  const morning = last7days.filter(m => {
    const hour = parseInt(m.time.split(':')[0]);
    return hour >= 6 && hour < 12;
  });
  
  const evening = last7days.filter(m => {
    const hour = parseInt(m.time.split(':')[0]);
    return hour >= 18 && hour < 24;
  });
  
  const avgMorning = morning.length > 0 
    ? Math.round(morning.reduce((sum, m) => sum + m.glucose, 0) / morning.length)
    : 'brak danych';
    
  const avgEvening = evening.length > 0
    ? Math.round(evening.reduce((sum, m) => sum + m.glucose, 0) / evening.length)
    : 'brak danych';
  
  // Tworzymy HTML analiz
  analyticsSection.innerHTML = `
    <div style="padding: 15px;">
      <h4 style="color: #1e3a8a; margin-top: 0;">📊 Ostatnie 7 dni</h4>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
          <div style="font-size: 0.9em; color: #666;">Średni poziom</div>
          <div style="font-size: 1.5em; font-weight: bold; color: #1e3a8a;">${avg} mg/dL</div>
        </div>
        
        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
          <div style="font-size: 0.9em; color: #666;">Pomiary w normie</div>
          <div style="font-size: 1.5em; font-weight: bold; color: #28a745;">${inRangePercent}%</div>
          <div style="font-size: 0.8em;">${inRange} z ${values.length}</div>
        </div>
      </div>
      
      <div style="margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span>Minimalna:</span>
          <span><strong>${min} mg/dL</strong></span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Maksymalna:</span>
          <span><strong>${max} mg/dL</strong></span>
        </div>
      </div>
      
      <hr style="border: none; border-top: 1px solid #dee2e6; margin: 15px 0;">
      
      <h4 style="color: #1e3a8a;">⏰ Analiza por dnia</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
        <div style="text-align: center; padding: 10px; background: #e8f4f8; border-radius: 5px;">
          <div style="font-size: 0.9em;">🌅 Poranne (6-12)</div>
          <div style="font-size: 1.2em; font-weight: bold;">${avgMorning}</div>
          <div style="font-size: 0.8em;">${morning.length} pomiarów</div>
        </div>
        
        <div style="text-align: center; padding: 10px; background: #f8f0e8; border-radius: 5px;">
          <div style="font-size: 0.9em;">🌆 Wieczorne (18-24)</div>
          <div style="font-size: 1.2em; font-weight: bold;">${avgEvening}</div>
          <div style="font-size: 0.8em;">${evening.length} pomiarów</div>
        </div>
      </div>
    </div>
  `;
}

// ===== 9. POWIADOMIENIA =====
function showNotification(message, type = 'info') {
  // Sprawdzamy czy już istnieje element powiadomienia
  let notification = document.getElementById('system-notification');
  
  if (!notification) {
    // Tworzymy nowy element powiadomienia
    notification = document.createElement('div');
    notification.id = 'system-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 5px;
      color: white;
      font-weight: bold;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      opacity: 0;
      transform: translateY(-20px);
      transition: opacity 0.3s, transform 0.3s;
    `;
    document.body.appendChild(notification);
  }
  
  // Ustawiamy kolor w zależności od typu
  const colors = {
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
  };
  
  notification.style.backgroundColor = colors[type] || colors.info;
  notification.textContent = message;
  
  // Pokazujemy powiadomienie
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
  }, 10);
  
  // Ukrywamy po 3 sekundach
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
  }, 3000);
}

// ===== 10. EKSPORT DANYCH =====
function exportData() {
  if (measurements.length === 0) {
    showNotification('Brak danych do eksportu', 'warning');
    return;
  }
  
  // Formatujemy dane
  const dataStr = JSON.stringify(measurements, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  
  // Tworzymy niewidzialny link
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = `pomiary-glukozy-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showNotification('✅ Dane wyeksportowane pomyślnie!', 'success');
}

// ===== 11. INICJALIZACJA STRONY =====
// Gdy strona się załaduje, aktualizujemy wszystkie sekcje
document.addEventListener('DOMContentLoaded', function() {
  updateAllSections();
  
  // Dodajemy przycisk eksportu w ustawieniach
  const settingsList = document.querySelector('.settings-list');
  if (settingsList) {
    const exportItem = document.createElement('li');
    exportItem.innerHTML = `
      <a href="#" id="export-data" style="display: block; text-decoration: none; color: inherit; padding: 12px;">
        💾 Eksportuj dane do JSON
      </a>
    `;
    
    // Dodajemy po "Zarządzanie kontem użytkownika"
    if (settingsList.children.length > 0) {
      settingsList.insertBefore(exportItem, settingsList.children[1]);
    } else {
      settingsList.appendChild(exportItem);
    }
    
    // Obsługa kliknięcia
    document.getElementById('export-data').addEventListener('click', function(e) {
      e.preventDefault();
      exportData();
    });
  }
  

});

// ===== 12. DODATKOWE FUNKCJE (OPCJONALNIE) =====
// Możesz dodać tę funkcję jeśli chcesz mieć możliwość usuwania pomiarów
function deleteMeasurement(id) {
  if (confirm('Czy na pewno chcesz usunąć ten pomiar?')) {
    measurements = measurements.filter(m => m.id !== id);
    localStorage.setItem('glucoseMeasurements', JSON.stringify(measurements));
    updateAllSections();
    showNotification('🗑️ Pomiar usunięty', 'info');
  }
}



// ===== OBSŁUGA SZYBKIEGO FORMULARZA =====
const quickForm = document.getElementById('quick-measurement-form');
if (quickForm) {
  quickForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const glucose = document.getElementById('quick-glucose').value;
    const insulin = document.getElementById('quick-insulin').value;
    const note = document.getElementById('quick-note').value;
    
    if (!glucose) {
      showNotification('❌ Wprowadź poziom glukozy!', 'error');
      return;
    }

    const glucoseVal = parseInt(glucose, 10);
    if (isNaN(glucoseVal) || glucoseVal < 20 || glucoseVal > 800) {
      showNotification('❌ Poziom glukozy musi być w zakresie 20–800 mg/dL', 'error');
      return;
    }

    let insulinVal = null;
    if (insulin) {
      insulinVal = parseFloat(insulin);
      if (isNaN(insulinVal) || insulinVal < 0 || insulinVal > 50) {
        showNotification('❌ Wartość insuliny musi być w zakresie 0–50 IU', 'error');
        return;
      }
    }

    const carbs = document.getElementById('quick-carbs').value;
    let carbsVal = null;
    if (carbs) {
      carbsVal = parseInt(carbs, 10);
      if (isNaN(carbsVal) || carbsVal < 0 || carbsVal > 300) {
        showNotification('❌ Wartość węglowodanów musi być w zakresie 0–300 g', 'error');
        return;
      }
    }

    const now = new Date();
    const measurement = {
      id: Date.now(),
      glucose: glucoseVal,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0,5),
      insulin: (insulinVal !== null) ? insulinVal : '-',
      carbs: (carbsVal !== null) ? carbsVal : '-',
      note: note || '-',
      timestamp: now.getTime(),
      glucoseClass: getGlucoseClass(glucoseVal)
    };
    
    measurements.push(measurement);
    localStorage.setItem('glucoseMeasurements', JSON.stringify(measurements));
    
    updateAllSections();
    quickForm.reset();
    
    showNotification(`✅ Dodano pomiar: ${glucose} mg/dL`, 'success');
  });
}
// ===== USUWANIE WSZYSTKICH DANYCH =====
function clearAllData() {
  if (confirm('⚠️ UWAGA! Czy na pewno chcesz usunąć WSZYSTKIE dane? Tej operacji nie można cofnąć!')) {
    measurements = [];
    localStorage.removeItem('glucoseMeasurements');
    updateAllSections();
    showNotification('🗑️ Wszystkie dane zostały usunięte', 'warning');
  }
}

// Dodajemy przycisk w ustawieniach
document.addEventListener('DOMContentLoaded', function() {
  const settingsList = document.querySelector('.settings-list');
  if (settingsList) {
    const clearDataItem = document.createElement('li');
    clearDataItem.innerHTML = `
      <a href="#" id="clear-all-data" style="display: block; text-decoration: none; color: #dc3545; padding: 12px;">
        🗑️ Usuń wszystkie dane
      </a>
    `;
    
    // Dodajemy na końcu listy
    settingsList.appendChild(clearDataItem);
    
    document.getElementById('clear-all-data').addEventListener('click', function(e) {
      e.preventDefault();
      clearAllData();
    });
  }
});

// Dodatkowe: listener dla selektora zakresu wykresu i obsługa resize (przerysowanie wykresu)
(function() {
  const trendSelect = document.getElementById('trend-range');
  if (trendSelect) {
    trendSelect.addEventListener('change', function() {
      updateTrendChart(this.value);
    });
  }

  // Resize -> przerysuj wykres
  window.addEventListener('resize', function() {
    const range = currentTrendRange || (document.getElementById('trend-range') ? document.getElementById('trend-range').value : 'days');
    updateTrendChart(range);
  });

  // ResizeObserver na placeholder (jeśli dostępny)
  const placeholder = document.querySelector('#analytics .analytics-card:first-child .placeholder');
  if (window.ResizeObserver && placeholder) {
    try {
      const ro = new ResizeObserver(() => {
        const range = currentTrendRange || (document.getElementById('trend-range') ? document.getElementById('trend-range').value : 'days');
        updateTrendChart(range);
      });
      ro.observe(placeholder);
    } catch (e) {
      // ignore
    }
  }
})();

// Ustawienie listenera dla selektora zakresu wykresu
document.addEventListener('DOMContentLoaded', function() {
  const trendSelect = document.getElementById('trend-range');
  if (trendSelect) {
    trendSelect.addEventListener('change', function() {
      updateTrendChart(this.value);
    });
    updateTrendChart(trendSelect.value);
  }
});