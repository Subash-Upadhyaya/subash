// run immediately before anything renders
// - reads saved preference from localStorage
// - sets data-theme so CSS loads the right colours straight away
// - if nothing saved yet, default to dark
;(function () {
  var saved = localStorage.getItem('su-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
})();


document.addEventListener('DOMContentLoaded', function () {

  // ── build and inject the sidebar + mobile nav
  // I do this in JS so I only need to update links in one place
  // instead of editing every single HTML file whenever I add a page
  buildSidebar();

  // page slide-in
  var wrap = document.querySelector('.main-wrap');
  if (wrap) wrap.classList.add('page-enter');

  // ── custom cursor setup
  // two divs — diamond that snaps to mouse, small dot that trails behind
  var diamond = document.createElement('div');
  diamond.className = 'cursor';
  var tracer = document.createElement('div');
  tracer.className = 'cursor-ring';
  document.body.appendChild(diamond);
  document.body.appendChild(tracer);

  // current mouse pos
  var mouseX = 0, mouseY = 0;
  // tracer lags behind these
  var traceX = 0, traceY = 0;

  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    // diamond snaps right away, no delay
    diamond.style.left = mouseX + 'px';
    diamond.style.top  = mouseY + 'px';
  });

  // lerp the dot toward the mouse each animation frame
  // - 0.12 is the "speed" — lower = more lag
  function animateDot() {
    traceX += (mouseX - traceX) * 0.12;
    traceY += (mouseY - traceY) * 0.12;
    tracer.style.left = traceX + 'px';
    tracer.style.top  = traceY + 'px';
    requestAnimationFrame(animateDot);
  }
  animateDot();

  // ── scroll progress bar at the top
  var progressFill = document.querySelector('.scroll-fill');
  if (progressFill) {
    window.addEventListener('scroll', function () {
      var gone  = window.scrollY;
      var total = document.body.scrollHeight - window.innerHeight;
      progressFill.style.width = ((gone / total) * 100).toFixed(1) + '%';
    });
  }

  // ── scroll reveal
  // IntersectionObserver watches .reveal elements
  // once one enters view → add .visible → unwatch it (no point re-triggering)
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.reveal').forEach(function (node) {
    io.observe(node);
  });

  // ── theme toggle (button lives inside the sidebar we just built)
  wireThemeButton();

  // anchor links — smooth scroll instead of jumping
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var dest = document.querySelector(this.getAttribute('href'));
      if (!dest) return;
      e.preventDefault();
      dest.scrollIntoView({ behavior: 'smooth' });
    });
  });

});


// ── SIDEBAR BUILDER
// kept as a named function so it's easier to find and edit
function buildSidebar() {

  var currentPage = location.pathname.split('/').pop() || 'index.html';

  var pages = [
    { file: 'index.html',      sym: '⌂',   name: 'Home'       },
    { file: 'fullstack.html',  sym: '⚡',  name: 'Full Stack'  },
    { file: 'html.html',       sym: '<>',  name: 'HTML'        },
    { file: 'css.html',        sym: '#',    name: 'CSS'         },
    { file: 'bootstrap.html',  sym: 'B',    name: 'Bootstrap'   },
    { file: 'javascript.html', sym: 'JS',   name: 'JavaScript'  },
    { file: 'about.html',      sym: '~',    name: 'About'       },
  ];

  // build sidebar nav HTML using template literal
  var sidebar = document.createElement('nav');
  sidebar.className = 'sidenav';
  sidebar.innerHTML =
    '<a href="index.html" class="sidenav-logo">SU<span>.</span></a>' +
    '<ul class="sidenav-links">' +
    pages.map(function (p) {
      var isHere = p.file === currentPage ? 'class="active"' : '';
      return '<li><a href="' + p.file + '" ' + isHere + '>' +
               '<span class="nav-icon">'  + p.sym  + '</span>' +
               '<span class="nav-label">' + p.name + '</span>' +
             '</a></li>';
    }).join('') +
    '</ul>' +
    '<button class="sidenav-theme" id="themeToggle" title="Toggle theme">◑</button>';

  document.body.prepend(sidebar);

  // progress bar slot — .scroll-fill width gets set on scroll
  var bar = document.createElement('div');
  bar.className = 'scroll-bar';
  bar.innerHTML = '<div class="scroll-fill"></div>';
  document.body.prepend(bar);

  // mobile bottom nav — shorter labels, just first word
  var mobileBar = document.createElement('nav');
  mobileBar.className = 'mobile-nav';
  mobileBar.innerHTML = pages.map(function (p) {
    var isHere = p.file === currentPage ? 'class="active"' : '';
    return '<a href="' + p.file + '" ' + isHere + '>' +
             '<span>' + p.sym + '</span>' +
             '<span>' + p.name.split(' ')[0] + '</span>' +
           '</a>';
  }).join('');
  document.body.appendChild(mobileBar);
}


// ── THEME TOGGLE
// called after buildSidebar() so the button actually exists in the DOM
function wireThemeButton() {
  var btn = document.getElementById('themeToggle');
  if (!btn) return;

  // sync icon with current theme state
  function refreshIcon() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.textContent = isDark ? '◑' : '◐';
  }
  refreshIcon();

  btn.addEventListener('click', function () {
    var now  = document.documentElement.getAttribute('data-theme');
    var next = now === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('su-theme', next); // remember for next visit
    refreshIcon();
  });
}


// shared delay helper — used by the full stack simulator
// just a promise that resolves after ms milliseconds
function delay(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}
