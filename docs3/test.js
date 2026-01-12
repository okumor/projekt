// DANE
var pomiary = [];

// WCZYTANIE DANYCH
function wczytajDane() {
  var dane = localStorage.getItem('pomiary-cukru');
  if (dane) {
    pomiary = JSON.parse(dane);
  }
}

// ZAPISANIE DANYCH
function zapiszDane() {
  localStorage.setItem('pomiary-cukru', JSON.stringify(pomiary));
}

// OKREŚLENIE STATUSU GLUKOZY
function pobierzStatus(wartosc) {
  if (wartosc < 70) {
    return 'Niski';
  } else if (wartosc <= 140) {
    return 'Normalny';
  } else if (wartosc <= 180) {
    return 'Wysoki';
  } else {
    return 'Bardzo wysoki';
  }
}

// KLASA CSS DLA KOLORU
function pobierzKlase(wartosc) {
  if (wartosc < 70) {
    return 'niski';
  } else if (wartosc <= 140) {
    return 'normalny';
  } else if (wartosc <= 180) {
    return 'wysoki';
  } else {
    return 'bardzo-wysoki';
  }
}

// FORMATOWANIE DATY
function formatujDate(data) {
  var d = new Date(data);
  var dzien = d.getDate();
  var miesiac = d.getMonth() + 1;
  var rok = d.getFullYear();
  
  if (dzien < 10) dzien = '0' + dzien;
  if (miesiac < 10) miesiac = '0' + miesiac;
  
  return dzien + '.' + miesiac + '.' + rok;
}

// FORMATOWANIE GODZINY
function formatujGodzine(data) {
  var d = new Date(data);
  var godz = d.getHours();
  var min = d.getMinutes();
  
  if (godz < 10) godz = '0' + godz;
  if (min < 10) min = '0' + min;
  
  return godz + ':' + min;
}

// DODAWANIE POMIARU
document.getElementById('form-pomiar').addEventListener('submit', function(e) {
  e.preventDefault();
  
  var glukoza = document.getElementById('glukoza').value;
  var insulina = document.getElementById('insulina').value;
  var wegle = document.getElementById('wegle').value;
  var notatka = document.getElementById('notatka').value;
  
  if (!glukoza) {
    alert('Podaj poziom glukozy!');
    return;
  }
  
  var pomiar = {
    glukoza: Number(glukoza),
    insulina: insulina ? Number(insulina) : 0,
    wegle: wegle ? Number(wegle) : 0,
    notatka: notatka || '',
    data: new Date().getTime()
  };
  
  pomiary.push(pomiar);
  zapiszDane();
  
  // Wyczyść formularz
  document.getElementById('glukoza').value = '';
  document.getElementById('insulina').value = '';
  document.getElementById('wegle').value = '';
  document.getElementById('notatka').value = '';
  
  alert('Pomiar dodany!');
  pokazOstatniPomiar();
  odswiezWszystko();
});

// POKAZANIE OSTATNIEGO POMIARU
function pokazOstatniPomiar() {
  if (pomiary.length === 0) {
    document.getElementById('last-glukoza').textContent = '-';
    document.getElementById('last-status').textContent = 'Brak danych';
    document.getElementById('last-data').textContent = '-';
    return;
  }
  
  var ostatni = pomiary[pomiary.length - 1];
  var status = pobierzStatus(ostatni.glukoza);
  var klasa = pobierzKlase(ostatni.glukoza);
  
  document.getElementById('last-glukoza').textContent = ostatni.glukoza + ' mg/dL';
  document.getElementById('last-glukoza').className = klasa;
  
  document.getElementById('last-status').textContent = status;
  document.getElementById('last-status').className = klasa;
  
  document.getElementById('last-data').textContent = formatujDate(ostatni.data) + ' ' + formatujGodzine(ostatni.data);
}

// WYŚWIETLENIE TABELI
function pokazTabele() {
  var tbody = document.getElementById('tbody-pomiary');
  tbody.innerHTML = '';
  
  if (pomiary.length === 0) {
    document.getElementById('brak-danych').classList.remove('hidden');
    document.getElementById('tabela-pomiary').classList.add('hidden');
    return;
  }
  
  document.getElementById('brak-danych').classList.add('hidden');
  document.getElementById('tabela-pomiary').classList.remove('hidden');
  
  // Sortowanie od najnowszych
  var posortowane = pomiary.slice().sort(function(a, b) {
    return b.data - a.data;
  });
  
  for (var i = 0; i < posortowane.length; i++) {
    var p = posortowane[i];
    var tr = document.createElement('tr');
    
    var klasa = pobierzKlase(p.glukoza);
    
    tr.innerHTML = '<td>' + formatujDate(p.data) + '</td>' +
                   '<td>' + formatujGodzine(p.data) + '</td>' +
                   '<td class="' + klasa + '">' + p.glukoza + '</td>' +
                   '<td>' + (p.insulina || '-') + '</td>' +
                   '<td>' + (p.wegle || '-') + '</td>' +
                   '<td>' + (p.notatka || '-') + '</td>';
    
    tbody.appendChild(tr);
  }
}

// OBLICZANIE STATYSTYK
function pokazStatystyki() {
  if (pomiary.length === 0) {
    document.getElementById('stat-liczba').textContent = '0';
    document.getElementById('stat-srednia').textContent = '-';
    document.getElementById('stat-min').textContent = '-';
    document.getElementById('stat-max').textContent = '-';
    
    document.getElementById('poziom-niski').textContent = '0';
    document.getElementById('poziom-normalny').textContent = '0';
    document.getElementById('poziom-wysoki').textContent = '0';
    document.getElementById('poziom-bardzo-wysoki').textContent = '0';
    
    document.getElementById('wykres-prosty').innerHTML = '<p>Brak danych do wykresu</p>';
    return;
  }
  
  // Podstawowe statystyki
  var suma = 0;
  var min = pomiary[0].glukoza;
  var max = pomiary[0].glukoza;
  
  var niski = 0;
  var normalny = 0;
  var wysoki = 0;
  var bardzoWysoki = 0;
  
  for (var i = 0; i < pomiary.length; i++) {
    var g = pomiary[i].glukoza;
    suma += g;
    
    if (g < min) min = g;
    if (g > max) max = g;
    
    if (g < 70) {
      niski++;
    } else if (g <= 140) {
      normalny++;
    } else if (g <= 180) {
      wysoki++;
    } else {
      bardzoWysoki++;
    }
  }
  
  var srednia = Math.round(suma / pomiary.length);
  
  document.getElementById('stat-liczba').textContent = pomiary.length;
  document.getElementById('stat-srednia').textContent = srednia;
  document.getElementById('stat-min').textContent = min;
  document.getElementById('stat-max').textContent = max;
  
  document.getElementById('poziom-niski').textContent = niski;
  document.getElementById('poziom-normalny').textContent = normalny;
  document.getElementById('poziom-wysoki').textContent = wysoki;
  document.getElementById('poziom-bardzo-wysoki').textContent = bardzoWysoki;
  
  // Prosty wykres
  rysujWykres();
}

// RYSOWANIE PROSTEGO WYKRESU
function rysujWykres() {
  var wykres = document.getElementById('wykres-prosty');
  
  // Weź ostatnie 10 pomiarów
  var ostatnie = pomiary.slice(-10);
  var html = '<div class="wykres-kontener">';
  
  var maxWartosc = 200;
  
  for (var i = 0; i < ostatnie.length; i++) {
    var p = ostatnie[i];
    var wysokosc = (p.glukoza / maxWartosc) * 100;
    if (wysokosc > 100) wysokosc = 100;
    
    var klasa = pobierzKlase(p.glukoza);
    
    html += '<div class="slupek-kontener">';
    html += '<div class="slupek ' + klasa + '" style="height:' + wysokosc + '%"></div>';
    html += '<div class="slupek-etykieta">' + p.glukoza + '</div>';
    html += '</div>';
  }
  
  html += '</div>';
  wykres.innerHTML = html;
}

// NAWIGACJA MIĘDZY STRONAMI
var linki = document.querySelectorAll('.menu-link');
var strony = document.querySelectorAll('.page');

for (var i = 0; i < linki.length; i++) {
  linki[i].addEventListener('click', function(e) {
    e.preventDefault();
    
    var strona = this.getAttribute('data-page');
    
    // Ukryj wszystkie strony
    for (var j = 0; j < strony.length; j++) {
      strony[j].classList.add('hidden');
    }
    
    // Pokaż wybraną stronę
    document.getElementById(strona).classList.remove('hidden');
    
    // Odśwież dane
    if (strona === 'lista') {
      pokazTabele();
    } else if (strona === 'statystyki') {
      pokazStatystyki();
    }
  });
}

// ODŚWIEŻENIE WSZYSTKIEGO
function odswiezWszystko() {
  pokazOstatniPomiar();
  pokazTabele();
  pokazStatystyki();
}

// INICJALIZACJA
wczytajDane();
odswiezWszystko();
