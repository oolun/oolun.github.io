(function () {
  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');
  var filterInput = document.getElementById('post-filter');
  var postList = document.getElementById('post-list');
  var searchDataEl = document.getElementById('search-data');
  var originalPostListHTML = postList ? postList.innerHTML : '';
  var searchIndex = [];

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (m) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[m];
    });
  }

  function escapeRegExp(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlightText(text, keyword) {
    var raw = String(text || '');
    if (!keyword) return escapeHtml(raw);
    var re = new RegExp(escapeRegExp(keyword), 'ig');
    var output = '';
    var last = 0;
    var match;
    while ((match = re.exec(raw)) !== null) {
      output += escapeHtml(raw.slice(last, match.index));
      output += '<mark class="search-hit">' + escapeHtml(match[0]) + '</mark>';
      last = match.index + match[0].length;
      if (match.index === re.lastIndex) re.lastIndex += 1;
    }
    output += escapeHtml(raw.slice(last));
    return output;
  }

  function buildSnippet(text, keyword) {
    var raw = String(text || '').replace(/\s+/g, ' ').trim();
    if (!raw) return '';
    if (!keyword) return raw.slice(0, 120);
    var idx = raw.toLowerCase().indexOf(keyword.toLowerCase());
    if (idx === -1) return raw.slice(0, 120);
    var start = Math.max(0, idx - 36);
    var end = Math.min(raw.length, idx + keyword.length + 84);
    var snippet = raw.slice(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < raw.length) snippet += '...';
    return snippet;
  }

  if (searchDataEl) {
    try {
      searchIndex = JSON.parse(searchDataEl.textContent || '[]');
    } catch (e) {
      searchIndex = [];
    }
  }

  var saved = localStorage.getItem('nova-theme');
  if (saved === 'dark') {
    root.setAttribute('data-theme', 'dark');
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var current = root.getAttribute('data-theme');
      if (current === 'dark') {
        root.removeAttribute('data-theme');
        localStorage.setItem('nova-theme', 'light');
      } else {
        root.setAttribute('data-theme', 'dark');
        localStorage.setItem('nova-theme', 'dark');
      }
    });
  }

  if (filterInput && postList && searchIndex.length) {
    filterInput.addEventListener('input', function (e) {
      var q = e.target.value.trim().toLowerCase();
      if (!q) {
        postList.innerHTML = originalPostListHTML;
        return;
      }

      var matches = searchIndex.filter(function (item) {
        var title = (item.title || '').toLowerCase();
        var text = (item.text || '').toLowerCase();
        return title.indexOf(q) > -1 || text.indexOf(q) > -1;
      }).slice(0, 60);

      if (!matches.length) {
        postList.innerHTML = '<p class="empty">No posts found.</p>';
        return;
      }

      postList.innerHTML = matches.map(function (item) {
        var categoryHtml = item.categories ? '<span>·</span><span>' + escapeHtml(item.categories) + '</span>' : '';
        var snippet = buildSnippet(item.text || item.firstLine || '', q);
        return '' +
          '<article class="post-card">' +
          '  <h2 class="post-title"><a href="' + item.path + '">' + highlightText(item.title, q) + '</a></h2>' +
          '  <div class="post-meta"><time>' + escapeHtml(item.date) + '</time>' + categoryHtml + '</div>' +
          '  <div class="post-excerpt">' + highlightText(snippet, q) + '</div>' +
          '  <a class="post-readmore" href="' + item.path + '">More</a>' +
          '</article>';
      }).join('');
    });
  }

  if (window.hljs) {
    window.hljs.configure({ cssSelector: '.post-content pre code:not(.hljs)' });
    window.hljs.highlightAll();
  }
})();
