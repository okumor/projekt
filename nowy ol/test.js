let pomiary = [];
let aktualnyOkres = 30; // domyślnie 30 dni

// Ładowanie danych
function wczytajDane() {
  const dane = localStorage.getItem('pomiary-cukru');
  if (dane) pomiary = JSON.parse(dane);
}

// Zapis danych
function zapiszDane() {
  localStorage.setItem('pomiary-cukru', JSON.stringify(pomiary));
}

// Status glukozy
function pobierzStatus(wartosc) {
  if (wartosc < 70) return 'Niski';
  if (wartosc <= 140) return 'Normalny';
  if (wartosc <= 180) return 'Wysoki';
  return 'Bardzo wysoki';
}

function pobierzKlase(wartosc) {
  if (wartosc < 70) return 'niski';
  if (wartosc <= 140) return 'normalny';
  if (wartosc <= 180) return 'wysoki';
  return 'bardzo-wysoki';
}

function formatujDate(czas) {
  const d = new Date(czas);
  return d.toLocaleDateString('pl-PL');
}

function formatujGodzine(czas) {
  const d = new Date(czas);
  return d.toLocaleTimeString('pl-PL', {hour: '2-digit', minute: '2-digit'});
}

// Filtrowanie danych według okresu
function filtrujWedlugOkresu(dni) {
  if (dni === 0) return pomiary;
  
  const teraz = new Date().getTime();
  const dniWMilisekundach = dni * 24 * 60 * 60 * 1000;
  const dataGraniczna = teraz - dniWMilisekundach;
  
  return pomiary.filter(p => p.data >= dataGraniczna);
}

// Dodawanie pomiaru
document.getElementById('form-pomiar').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const glukoza = parseFloat(document.getElementById('glukoza').value);
  const insulina = parseFloat(document.getElementById('insulina').value) || 0;
  const wegle = parseFloat(document.getElementById('wegle').value) || 0;
  const notatka = document.getElementById('notatka').value || '';
  
  if (!glukoza) {
    alert('Podaj poziom glukozy!');
    return;
  }
  
  pomiary.push({
    glukoza,
    insulina,
    wegle,
    notatka,
    data: new Date().getTime()
  });
  
  zapiszDane();
  
  // Czyszczenie formularza
  document.getElementById('glukoza').value = '';
  document.getElementById('insulina').value = '';
  document.getElementById('wegle').value = '';
  document.getElementById('notatka').value = '';
  
  alert('Pomiar dodany!');
  pokazOstatniPomiar();
  odswiezWszystko();
});

// Ostatni pomiar
function pokazOstatniPomiar() {
  if (pomiary.length === 0) {
    document.getElementById('last-glukoza').textContent = '-';
    document.getElementById('last-status').textContent = 'Brak danych';
    document.getElementById('last-data').textContent = '-';
    return;
  }
  
  const ostatni = pomiary[pomiary.length - 1];
  const status = pobierzStatus(ostatni.glukoza);
  const klasa = pobierzKlase(ostatni.glukoza);
  
  document.getElementById('last-glukoza').textContent = ostatni.glukoza + ' mg/dL';
  document.getElementById('last-glukoza').className = klasa;
  
  document.getElementById('last-status').textContent = status;
  document.getElementById('last-status').className = klasa;
  
  document.getElementById('last-data').textContent = formatujDate(ostatni.data) + ' ' + formatujGodzine(ostatni.data);
}

// Tabela pomiarów
function pokazTabele() {
  const tbody = document.getElementById('tbody-pomiary');
  tbody.innerHTML = '';
  
  if (pomiary.length === 0) {
    document.getElementById('brak-danych').classList.remove('hidden');
    return;
  }
  
  document.getElementById('brak-danas').classList.add('hidden');
  
  // Sortowanie od najnowszych
  const posortowane = [...pomiary].sort((a, b) => b.data - a.data);
  
  posortowane.forEach(p => {
    const tr = document.createElement('tr');
    const klasa = pobierzKlase(p.glukoza);
    
    tr.innerHTML = `
      <td>${formatujDate(p.data)}</td>
      <td>${formatujGodzine(p.data)}</td>
      <td class="${klasa}">${p.glukoza}</td>
      <td>${p.insulina || '-'}</td>
      <td>${p.wegle || '-'}</td>
      <td>${p.notatka || '-'}</td>
    `;
    
    tbody.appendChild(tr);
  });
}

// Statystyki
function pokazStatystyki() {
  const dane = filtrujWedlugOkresu(aktualnyOkres);
  
  if (dane.length === 0) {
    document.getElementById('stat-liczba').textContent = '0';
    document.getElementById('stat-srednia').textContent = '-';
    document.getElementById('stat-min').textContent = '-';
    document.getElementById('stat-max').textContent = '-';
    document.getElementById('wykres-prosty').innerHTML = '<p>Brak danych</p>';
    return;
  }
  
  // Obliczanie statystyk
  const glukozy = dane.map(p => p.glukoza);
  const suma = glukozy.reduce((a, b) => a + b, 0);
  const srednia = Math.round(suma / dane.length);
  const min = Math.min(...glukozy);
  const max = Math.max(...glukozy);
  
  document.getElementById('stat-liczba').textContent = dane.length;
  document.getElementById('stat-srednia').textContent = srednia;
  document.getElementById('stat-min').textContent = min;
  document.getElementById('stat-max').textContent = max;
  
  // Rysowanie wykresu średnich
  rysujWykresSrednich(dane);
}

// Rysowanie wykresu średnich
function rysujWykresSrednich(dane) {
  const wykres = document.getElementById('wykres-prosty');
  
  if (dane.length === 0) {
    wykres.innerHTML = '<p>Brak danych do wykresu</p>';
    return;
  }
  
  // Grupowanie danych według dni
  const dzisiaj = new Date();
  const grupy = {};
  
  dane.forEach(p => {
    const data = new Date(p.data);
    const klucz = data.toLocaleDateString('pl-PL');
    
    if (!grupy[klucz]) {
      grupy[klucz] = { suma: 0, liczba: 0 };
    }
    
    grupy[klucz].suma += p.glukoza;
    grupy[klucz].liczba++;
  });
  
  // Obliczanie średnich i ograniczenie do ostatnich 20 dni
  const klucze = Object.keys(grupy).slice(-20);
  const srednie = klucze.map(k => Math.round(grupy[k].suma / grupy[k].liczba));
  const maxWartosc = Math.max(...srednie, 200);
  
  let html = '<div class="wykres-kontener">';
  
  klucze.forEach((klucz, index) => {
    const wartosc = srednie[index];
    const wysokosc = (wartosc / maxWartosc) * 100;
    const klasa = pobierzKlase(wartosc);
    
    html += `
      <div class="slupek-kontener">
        <div class="slupek ${klasa}" style="height:${wysokosc}%"></div>
        <div class="slupek-etykieta">${wartosc}</div>
        <div class="slupek-data">${klucz}</div>
      </div>
    `;
  });
  
  html += '</div>';
  wykres.innerHTML = html;
}

// Nawigacja
document.querySelectorAll('.menu-link').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    
    document.querySelectorAll('.menu-link').forEach(l => l.classList.remove('active'));
    this.classList.add('active');
    
    const strona = this.getAttribute('data-page');
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(strona).classList.remove('hidden');
    
    if (strona === 'lista') pokazTabele();
    if (strona === 'statystyki') pokazStatystyki();
  });
});

// Przyciski okresu statystyk
document.querySelectorAll('.okres-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.okres-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    
    aktualnyOkres = parseInt(this.getAttribute('data-dni'));
    pokazStatystyki();
  });
});

// Odświeżanie
function odswiezWszystko() {
  pokazOstatniPomiar();
  pokazTabele();
  pokazStatystyki();
}

// Inicjalizacja
wczytajDane();
pokazOstatniPomiar();