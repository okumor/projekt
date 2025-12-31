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
    });
  });

  // ===== MODAL DODAWANIA POMIARU =====
  const openModalBtn = document.getElementById('open-add-measurement');
  const modal = document.getElementById('add-measurement-modal');
  const closeModal = document.getElementById('close-modal');

  // otwieranie modala
  openModalBtn.addEventListener('click', () => modal.classList.remove('hidden'));

  // zamykanie modala po kliknięciu X
  closeModal.addEventListener('click', () => modal.classList.add('hidden'));

  // zamykanie modala po kliknięciu poza modal
  window.addEventListener('click', e => {
    if(e.target === modal) modal.classList.add('hidden');
  });
});
// =============================================
// SYSTEM MONITOROWANIA CUKRU - CZYSTY JAVASCRIPT
// =============================================

// ===== 1. PRZECHOWYWANIE DANYCH =====
// Pobieramy dane z localStorage lub tworzymy pustą tablicę
let measurements = JSON.parse(localStorage.getItem('glucoseMeasurements')) || [];
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

// Sprawdza poziom cukru i zwraca odpowiednią klasę CSS
function getGlucoseClass(value) {
  if (value < 70) return 'glucose-low';      // Za niski
  if (value <= 180) return 'glucose-normal'; // Norma
  if (value <= 250) return 'glucose-high';   // Podwyższony
  return 'glucose-very-high';               // Bardzo wysoki
}

// ===== 3. OBSŁUGA FORMULARZA =====
const measurementForm = document.querySelector('#add-measurement-modal form');

measurementForm.addEventListener('submit', function(e) {
  e.preventDefault(); // Zatrzymujemy domyślne wysłanie formularza
  
  // Pobieramy wartości z formularza
  const glucoseInput = document.getElementById('poziom-cukru');
  const dateInput = document.getElementById('data-pomiaru');
  const timeInput = document.getElementById('godzina-pomiaru');
  const insulinInput = document.getElementById('dawka-insuliny');
  const noteInput = document.getElementById('notatka');
  
  // Sprawdzamy czy podano wymagane pole (cukier)
  if (!glucoseInput.value) {
    alert('Proszę podać poziom cukru!');
    glucoseInput.focus();
    return;
  }
  
  // Tworzymy nowy pomiar
  const now = new Date();
  const measurement = {
    id: Date.now(), // Unikalne ID
    glucose: parseInt(glucoseInput.value),
    date: dateInput.value || now.toISOString().split('T')[0],
    time: timeInput.value || now.toTimeString().slice(0,5),
    insulin: insulinInput.value || '-',
    note: noteInput.value || '-',
    timestamp: new Date(`${dateInput.value || now.toISOString().split('T')[0]}T${timeInput.value || now.toTimeString().slice(0,5)}`).getTime(),
    glucoseClass: getGlucoseClass(parseInt(glucoseInput.value)) // Dodajemy klasę CSS
  };
  
  // Dodajemy do tablicy i zapisujemy
  measurements.push(measurement);
  localStorage.setItem('glucoseMeasurements', JSON.stringify(measurements));
  
  // Aktualizujemy stronę
  updateAllSections();
  
  // Resetujemy formularz i zamykamy modal
  measurementForm.reset();
  modal.classList.add('hidden');
  
  // Pokazujemy potwierdzenie
  showNotification('✅ Pomiar dodany pomyślnie!', 'success');
});

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
    currentGlucoseCard.innerHTML = `
      <span class="${glucoseClass}" style="font-size: 1.5em; font-weight: bold;">
        ${latest.glucose} mg/dL
      </span><br>
      <small>${formatDateTime(latest.date, latest.time)}</small>
    `;
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
      <li><strong>Średni poziom cukru:</strong> ${avg} mg/dL</li>
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
        <td colspan="5" style="text-align: center; padding: 40px;">
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
      <td>${measurement.insulin}</td>
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
  if (value < 70) return '#dc3545';     // Czerwony
  if (value <= 180) return '#28a745';   // Zielony
  if (value <= 250) return '#ffc107';   // Żółty
  return '#dc3545';                     // Czerwony
}

// ===== 8. ANALIZY I STATYSTYKI =====
function updateAnalytics() {
  const analyticsSection = document.querySelector('#analytics .analytics-card:last-child .placeholder');
  if (!analyticsSection) return;
  
  if (measurements.length === 0) {
    analyticsSection.innerHTML = '<em>Brak danych do analizy</em>';
    return;
  }
  
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
  
  // Liczymy ile pomiarów było w normie
  const inRange = values.filter(v => v >= 70 && v <= 180).length;
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
  link.download = `pomiary-cukru-${new Date().toISOString().split('T')[0]}.json`;
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
  
  // Ustawiamy domyślną datę w formularzu na dzisiaj
  const dateInput = document.getElementById('data-pomiaru');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.max = today; // Nie można wybrać daty z przyszłości
  }
  
  // Ustawiamy domyślną godzinę na teraz
  const timeInput = document.getElementById('godzina-pomiaru');
  if (timeInput) {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    timeInput.value = `${hours}:${minutes}`;
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
// ===== PRZYCISK DO DODAWANIA PRZYKŁADOWYCH DANYCH =====
function addSampleData() {
  if (confirm('Czy dodać przykładowe dane? Stare dane pozostaną nienaruszone.')) {
    // Tworzymy nowe przykładowe dane
    const now = new Date();
    const sampleData = [
      {
        id: Date.now() + 1,
        glucose: 130,
        date: now.toISOString().split('T')[0],
        time: "10:00",
        insulin: 5,
        note: "Przykładowy pomiar 1",
        timestamp: Date.now() + 1
      },
      {
        id: Date.now() + 2,
        glucose: 95,
        date: now.toISOString().split('T')[0],
        time: "16:30",
        insulin: 3,
        note: "Przykładowy pomiar 2",
        timestamp: Date.now() + 2
      },
      {
        id: Date.now() + 3,
        glucose: 155,
        date: now.toISOString().split('T')[0],
        time: "21:15",
        insulin: 7,
        note: "Przykładowy pomiar 3",
        timestamp: Date.now() + 3
      }
    ];
    
    // Dodajemy do istniejących danych
    measurements.push(...sampleData);
    
    // Zapisujemy
    localStorage.setItem('glucoseMeasurements', JSON.stringify(measurements));
    
    // Aktualizujemy stronę
    updateAllSections();
    
    showNotification('✅ Dodano przykładowe dane!', 'success');
  }
}

// Dodajemy przycisk w ustawieniach
document.addEventListener('DOMContentLoaded', function() {
  // ... (twój istniejący kod) ...
  
  // Dodajemy przycisk "Dodaj przykładowe dane" w ustawieniach
  const settingsList = document.querySelector('.settings-list');
  if (settingsList) {
    const sampleDataItem = document.createElement('li');
    sampleDataItem.innerHTML = `
      <a href="#" id="add-sample-data" style="display: block; text-decoration: none; color: inherit; padding: 12px;">
        🧪 Dodaj przykładowe dane
      </a>
    `;
    
    // Dodajemy przed "Eksportuj dane"
    const exportButton = document.getElementById('export-data');
    if (exportButton && exportButton.parentElement) {
      settingsList.insertBefore(sampleDataItem, exportButton.parentElement);
    } else {
      settingsList.appendChild(sampleDataItem);
    }
    
    // Obsługa kliknięcia
    document.getElementById('add-sample-data').addEventListener('click', function(e) {
      e.preventDefault();
      addSampleData();
    });
  }
});
// ===== OBSŁUGA SZYBKIEGO FORMULARZA =====
const quickForm = document.getElementById('quick-measurement-form');
if (quickForm) {
  quickForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const glucose = document.getElementById('quick-glucose').value;
    const insulin = document.getElementById('quick-insulin').value;
    const note = document.getElementById('quick-note').value;
    
    if (!glucose) {
      showNotification('❌ Wprowadź poziom cukru!', 'error');
      return;
    }
    
    const now = new Date();
    const measurement = {
      id: Date.now(),
      glucose: parseInt(glucose),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0,5),
      insulin: insulin || '-',
      note: note || '-',
      timestamp: now.getTime(),
      glucoseClass: getGlucoseClass(parseInt(glucose))
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