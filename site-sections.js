/* ============================================================
   UQZ — Navigation par sections.
   Sur les pages .content avec >= 3 <h2>, transforme la page en
   "menu + sous-menu" : une barre de sections permet d'afficher
   chaque bloc directement, sans scroll infini.
   ============================================================ */
(function () {
  'use strict';

  var content = document.querySelector('.page > .content');
  if (!content) return;

  // Sections = groupes de noeuds séparés par les <h2> directs
  var h2s = Array.prototype.filter.call(content.children, function (n) {
    return n.tagName === 'H2';
  });
  if (h2s.length < 3) return;

  var page = content.parentElement;

  // Construit les groupes : [intro..., h2, noeuds...], [h2, noeuds...]...
  var groups = [];
  var cur = [];
  Array.prototype.forEach.call(content.childNodes, function (n) {
    if (n.nodeType === 1 && n.tagName === 'H2') {
      if (cur.length) groups.push(cur);
      cur = [n];
    } else {
      cur.push(n);
    }
  });
  if (cur.length) groups.push(cur);

  // Le premier groupe = intro (back, eyebrow, h1, meta) : toujours visible
  var intro = groups.shift();
  var introNodes = document.createElement('div');
  introNodes.className = 'pintro';
  intro.forEach(function (n) { introNodes.appendChild(n); });
  content.appendChild(introNodes);

  // Menu
  var nav = document.createElement('nav');
  nav.className = 'pnav';
  nav.setAttribute('aria-label', 'Sections de la page');
  var btns = [];
  var secs = [];

  groups.forEach(function (nodes, i) {
    var h2 = nodes[0];
    var sec = document.createElement('div');
    sec.className = 'psec';
    nodes.forEach(function (n) { sec.appendChild(n); });
    content.appendChild(sec);

    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = h2.textContent.trim();
    b.setAttribute('aria-controls', 'psec-' + i);
    sec.id = 'psec-' + i;
    b.addEventListener('click', function () { show(i, true); });
    nav.appendChild(b);
    btns.push(b);
    secs.push(sec);
  });

  page.insertBefore(nav, content);

  function show(i, pushHash) {
    secs.forEach(function (s, j) { s.hidden = (j !== i); });
    btns.forEach(function (b, j) { b.classList.toggle('on', j === i); });
    if (pushHash) history.replaceState(null, '', '#sec-' + i);
  }

  // Hash au chargement : #sec-N
  var m = location.hash.match(/^#sec-(\d+)$/);
  var start = m ? Math.min(parseInt(m[1], 10), secs.length - 1) : 0;
  if (start < 0) start = 0;
  show(start, false);
})();
