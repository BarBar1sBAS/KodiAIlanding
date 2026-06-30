(() => {
  var editor = document.getElementById("ide-demo-input");
  var output = document.getElementById("ide-demo-output");
  var btnDemo = document.getElementById("ide-demo-run");
  var explainBox = document.getElementById("ide-demo-explain");
  var explainBody = document.getElementById("ide-demo-explain-body");
  var inputTitle = document.getElementById("ide-demo-input-title");
  var tabsBox = document.getElementById("ide-demo-tabs");
  var tabPanel = document.getElementById("ide-demo-tabpanel");
  var chatLog = document.getElementById("ide-demo-chat-log");
  var chatSuggestions = document.getElementById("ide-demo-chat-suggestions");
  var header = document.querySelector(".site-header");
  var menuToggle = document.getElementById("site-header-menu-toggle");
  var nav = document.getElementById("site-header-nav");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Подписи уровней критичности (4 уровня — как заявлено в секции «О проекте») */
  var SEVERITY_LABELS = {
    critical: "Критично",
    warning: "Предупреждение",
    style: "Стиль",
    hint: "Совет",
  };

  /*
   * Демо-сценарии: язык + учебный трек. Данные имитируют ответ ИИ на клиенте —
   * продукт с реальным разбором ещё в разработке (см. бегущую строку под демо).
   * Дефолтный python повторяет исходный учебный пример 1-в-1.
   */
  var SCENARIOS = {
    python: {
      lang: "Python",
      filename: "main.py",
      code:
        "def summ(a,b):\n" +
        "    return a+b\n" +
        "\n" +
        "for i in range(100):\n" +
        "    print(summ(i,i+1))",
      fixed:
        "def summ(a: int, b: int) -> int:\n" +
        '    """Возвращает сумму двух целых чисел."""\n' +
        "    return a + b\n" +
        "\n" +
        "def main() -> None:\n" +
        "    for i in range(100):\n" +
        "        print(summ(i, i + 1))\n" +
        "\n" +
        "if __name__ == '__main__':\n" +
        "    main()",
      lead: "Кратко: что изменилось в учебном фрагменте по сравнению с исходным кодом.",
      findings: [
        {
          level: "hint",
          line: 1,
          title: "Добавлены аннотации типов параметров и результата",
          why: "Аннотации типов делают код проще читать и помогают ловить ошибки ещё до запуска.",
        },
        {
          level: "style",
          line: 1,
          title: "Пробелы вокруг операторов и после запятых",
          why: "По правилам PEP 8 единый аккуратный стиль улучшает читаемость кода.",
        },
        {
          level: "hint",
          line: 2,
          title: "Добавлен докстринг функции",
          why: "Докстринг объясняет назначение функции — хорошая привычка к самодокументируемому коду.",
        },
        {
          level: "warning",
          line: 4,
          title: "Логика вынесена в main() с защитой запуска",
          why:
            "Цикл и вывод обёрнуты в <code>main()</code> с <code>if __name__ == '__main__'</code> — модуль можно " +
            "импортировать без побочного запуска.",
        },
      ],
      chat: [
        {
          q: "Почему важны аннотации типов?",
          a:
            "Аннотации типов (<code>a: int</code>, <code>-> int</code>) подсказывают, какие данные ожидает функция. " +
            "Редактор и линтер заранее находят несовпадения, а читателю кода понятнее намерение автора.",
        },
        {
          q: "Что такое if __name__ == '__main__'?",
          a:
            "Этот блок выполняется, только когда файл запускают напрямую. Если же модуль импортируют, код внутри не " +
            "сработает — удобно переиспользовать функции без побочных эффектов.",
        },
        {
          q: "Зачем нужен докстринг?",
          a:
            "Докстринг — это краткое описание функции сразу под её объявлением. Он виден в подсказках IDE и в " +
            "<code>help()</code>, поэтому коллеге не нужно перечитывать тело функции.",
        },
      ],
    },
    javascript: {
      lang: "JavaScript",
      filename: "app.js",
      code:
        "var nums = [5, 3, 8, 1]\n" +
        "function srt(a) {\n" +
        "  return a.sort()\n" +
        "}\n" +
        "console.log(srt(nums))",
      fixed:
        "const nums = [5, 3, 8, 1];\n" +
        "\n" +
        "function sortAscending(values) {\n" +
        "  return [...values].sort((a, b) => a - b);\n" +
        "}\n" +
        "\n" +
        "console.log(sortAscending(nums));",
      lead: "Кратко: типичная первая лаба — сортировка чисел. Что стоит поправить.",
      findings: [
        {
          level: "critical",
          line: 3,
          title: "sort() без компаратора сортирует как строки",
          why:
            "Вызов <code>a.sort()</code> сравнивает элементы как строки, поэтому числа выстроятся неверно. Нужен " +
            "компаратор <code>(a, b) => a - b</code>.",
        },
        {
          level: "warning",
          line: 3,
          title: "sort() мутирует исходный массив",
          why: "Копия <code>[...values]</code> перед сортировкой бережёт исходные данные от неожиданных изменений.",
        },
        {
          level: "style",
          line: 1,
          title: "var заменён на const",
          why: "Для значений, которые не переприсваиваются, <code>const</code> безопаснее и читается понятнее.",
        },
        {
          level: "hint",
          line: 2,
          title: "Говорящее имя функции",
          why: "<code>sortAscending</code> вместо <code>srt</code> сразу сообщает, что делает функция.",
        },
      ],
      chat: [
        {
          q: "Почему sort() ломает порядок чисел?",
          a:
            "По умолчанию <code>sort()</code> приводит элементы к строкам и сравнивает посимвольно: так <code>\"10\"</code> " +
            "оказывается раньше <code>\"2\"</code>. Компаратор <code>(a, b) => a - b</code> возвращает числовую разницу и " +
            "выстраивает значения по возрастанию.",
        },
        {
          q: "В чём разница const и var?",
          a:
            "<code>var</code> видна во всей функции и допускает переприсваивание, что чаще приводит к ошибкам. " +
            "<code>const</code> имеет блочную область видимости и запрещает переприсваивание ссылки.",
        },
        {
          q: "Зачем копировать массив перед сортировкой?",
          a:
            "<code>sort()</code> меняет исходный массив на месте. Копия <code>[...values]</code> оставляет входные данные " +
            "нетронутыми — это предсказуемее и безопаснее.",
        },
      ],
    },
    sql: {
      lang: "SQL",
      filename: "query.sql",
      code:
        "select * from orders\n" +
        "where status = 'paid'\n" +
        "order by created_at",
      fixed:
        "SELECT id, customer_id, amount, created_at\n" +
        "FROM orders\n" +
        "WHERE status = 'paid'\n" +
        "ORDER BY created_at DESC\n" +
        "LIMIT 100;",
      lead: "Кратко: запрос к таблице заказов. Делаем его аккуратнее и предсказуемее.",
      findings: [
        {
          level: "warning",
          line: 1,
          title: "SELECT * заменён на список колонок",
          why: "Явные колонки уменьшают объём данных и не ломаются при изменении схемы таблицы.",
        },
        {
          level: "warning",
          line: 3,
          title: "Добавлен LIMIT",
          why: "Без ограничения запрос может вернуть миллионы строк и нагрузить и базу, и приложение.",
        },
        {
          level: "style",
          line: 1,
          title: "Ключевые слова в верхнем регистре",
          why: "<code>SELECT</code>, <code>FROM</code>, <code>WHERE</code> заглавными — общепринятый читаемый стиль SQL.",
        },
        {
          level: "hint",
          line: 3,
          title: "Уточнено направление сортировки",
          why: "Явное <code>DESC</code> убирает неоднозначность: свежие заказы окажутся сверху.",
        },
      ],
      chat: [
        {
          q: "Чем плох SELECT *?",
          a:
            "<code>SELECT *</code> тянет все колонки, включая ненужные и тяжёлые. Запрос становится медленнее и ломается, " +
            "если в таблицу добавят или переименуют поля. Лучше перечислять только нужные колонки.",
        },
        {
          q: "Зачем нужен LIMIT?",
          a:
            "<code>LIMIT</code> ограничивает число строк в ответе. Это защищает от случайной выборки на миллионы записей " +
            "и ускоряет ответ при отладке и постраничном выводе.",
        },
        {
          q: "Почему стоит писать ключевые слова заглавными?",
          a:
            "Регистр не влияет на выполнение, но <code>SELECT ... FROM ... WHERE</code> заглавными визуально отделяет " +
            "команды от имён таблиц и колонок — запрос читается быстрее.",
        },
      ],
    },
    cpp: {
      lang: "C++",
      filename: "main.cpp",
      code:
        "#include <iostream>\n" +
        "using namespace std;\n" +
        "int main(){\n" +
        "  int n; cin>>n;\n" +
        "  int sum=0;\n" +
        "  for(int i=1;i<=n;i++) sum+=i;\n" +
        "  cout<<sum;\n" +
        "}",
      fixed:
        "#include <iostream>\n" +
        "\n" +
        "int main() {\n" +
        "    long long n = 0;\n" +
        "    std::cin >> n;\n" +
        "\n" +
        "    long long sum = n * (n + 1) / 2;\n" +
        "    std::cout << sum << '\\n';\n" +
        "    return 0;\n" +
        "}",
      lead: "Кратко: сумма чисел от 1 до n. Убираем риск переполнения и ускоряем решение.",
      findings: [
        {
          level: "critical",
          line: 6,
          title: "Возможное переполнение int",
          why:
            "При больших <code>n</code> сумма не помещается в <code>int</code>. Тип <code>long long</code> расширяет " +
            "допустимый диапазон.",
        },
        {
          level: "hint",
          line: 6,
          title: "Цикл заменён формулой",
          why:
            "Сумма от 1 до n равна <code>n * (n + 1) / 2</code> — это O(1) вместо O(n), что важно в олимпиадных " +
            "ограничениях по времени.",
        },
        {
          level: "warning",
          line: 2,
          title: "Убран using namespace std",
          why: "Глобальный <code>using namespace std</code> часто вызывает конфликты имён; явный <code>std::</code> надёжнее.",
        },
        {
          level: "style",
          line: 7,
          title: "Перевод строки и return 0",
          why: "Завершающий <code>'\\n'</code> и явный <code>return 0</code> делают вывод и завершение программы аккуратными.",
        },
      ],
      chat: [
        {
          q: "Когда возникает переполнение int?",
          a:
            "<code>int</code> обычно вмещает числа примерно до 2,1 млрд. Сумма <code>1..n</code> при больших " +
            "<code>n</code> легко превышает этот предел, и результат становится некорректным. <code>long long</code> " +
            "даёт куда больший диапазон.",
        },
        {
          q: "Почему формула лучше цикла?",
          a:
            "Цикл складывает числа за O(n) шагов, а формула <code>n * (n + 1) / 2</code> даёт ответ за одно действие — " +
            "O(1). На больших входных данных это решает, уложитесь ли вы в лимит времени.",
        },
        {
          q: "Чем плох using namespace std?",
          a:
            "Он вносит все имена из <code>std</code> в глобальную область и может конфликтовать с вашими именами. " +
            "Явная запись <code>std::cin</code>, <code>std::cout</code> понятнее и безопаснее.",
        },
      ],
    },
  };

  var currentScenarioKey = "python";

  /* Имитация задержки ответа ИИ (мс). Для ~1,5 с: 1500; для ~15 с: 15000 */
  var IDE_DEMO_RESPONSE_DELAY_MS = 1500;
  var CODE_STREAM_LINE_MS = 90;
  var CHAT_STREAM_WORD_MS = 28;

  var ideDemoLoading = false;
  /* Токен отмены: при смене вкладки прерываем незавершённые анимации стрима */
  var streamToken = 0;

  function normalize(text) {
    return String(text).replace(/\r\n/g, "\n").trim();
  }

  function getScenario() {
    return SCENARIOS[currentScenarioKey] || SCENARIOS.python;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function setExplain(html) {
    if (!explainBox || !explainBody) return;
    explainBody.classList.remove("ide-demo__explain-content--loading");
    explainBody.innerHTML = html;
  }

  function startExplainLoading() {
    if (!explainBox || !explainBody) return;
    explainBody.innerHTML = "";
    explainBody.classList.add("ide-demo__explain-content--loading");
    explainBox.setAttribute("aria-busy", "true");
  }

  function renderFindings(scenario) {
    var html =
      '<p class="ide-demo__explain-lead">' + escapeHtml(scenario.lead) + "</p>" +
      '<ul class="ide-demo__finding-list">';
    scenario.findings.forEach(function (f) {
      var label = SEVERITY_LABELS[f.level] || "Замечание";
      html +=
        '<li class="ide-demo__finding ide-demo__finding--' + f.level + '">' +
        '<div class="ide-demo__finding-head">' +
        '<span class="ide-demo__badge ide-demo__badge--' + f.level + '">' + escapeHtml(label) + "</span>" +
        '<span class="ide-demo__finding-loc">строка ' + escapeHtml(f.line) + "</span>" +
        "</div>" +
        '<p class="ide-demo__finding-title">' + escapeHtml(f.title) + "</p>" +
        '<p class="ide-demo__finding-why">' + f.why + "</p>" +
        "</li>";
    });
    html += "</ul>";
    return html;
  }

  var EXPLAIN_OTHER =
    '<p class="ide-demo__explain-placeholder">Вы изменили исходный пример. На промо-сайте доступен только статический демо-сценарий для каждого языка. В полной версии Коди.АИ модель разберёт именно ваш код и перечислит улучшения под него.</p>';

  var PLACEHOLDER =
    "На промо-сайте показан только статический пример улучшения для выбранного языка.\n\n" +
    "Если вы измените код слева, нажмите «Показать улучшенный вариант» — для исходного примера справа " +
    "появится готовое решение. В продукте Коди.АИ анализ и подсказки будет давать ИИ под ваш код.";

  /* Построчный «стриминг» кода в правую панель (иллюстрация SSE-выдачи) */
  function streamOutput(text, token, done) {
    if (reduceMotion) {
      output.textContent = text;
      if (done) done();
      return;
    }
    var lines = text.split("\n");
    var i = 0;
    function step() {
      if (token !== streamToken) return;
      output.textContent = lines.slice(0, i + 1).join("\n");
      i += 1;
      if (i < lines.length) {
        window.setTimeout(step, CODE_STREAM_LINE_MS);
      } else if (done) {
        done();
      }
    }
    step();
  }

  function applyIdeDemoResult(token) {
    if (!editor || !output) return;
    var scenario = getScenario();
    if (normalize(editor.value) === normalize(scenario.code)) {
      streamOutput(scenario.fixed, token, function () {
        setExplain(renderFindings(scenario));
      });
    } else {
      output.textContent = PLACEHOLDER;
      setExplain(EXPLAIN_OTHER);
    }
  }

  function runIdeDemo() {
    if (!editor || !output || !btnDemo || ideDemoLoading) return;
    ideDemoLoading = true;
    var token = streamToken;
    btnDemo.disabled = true;
    btnDemo.setAttribute("aria-busy", "true");
    output.textContent = "";
    output.classList.add("ide-demo__output--loading");
    output.setAttribute("aria-busy", "true");
    startExplainLoading();

    window.setTimeout(() => {
      if (token !== streamToken) return;
      ideDemoLoading = false;
      output.classList.remove("ide-demo__output--loading");
      output.removeAttribute("aria-busy");
      if (explainBox) explainBox.removeAttribute("aria-busy");
      btnDemo.disabled = false;
      btnDemo.removeAttribute("aria-busy");
      applyIdeDemoResult(token);
    }, IDE_DEMO_RESPONSE_DELAY_MS);
  }

  if (btnDemo) {
    btnDemo.addEventListener("click", runIdeDemo);
  }

  /* ----- Диалог по коду: чипы вопросов + стриминг ответа ----- */
  function resetChat() {
    if (!chatLog) return;
    chatLog.innerHTML =
      '<p class="ide-demo__chat-idle">Это диалог по коду: ассистент отвечает на вопросы по текущему примеру. ' +
      "Выберите один из вопросов ниже.</p>";
  }

  function streamChatAnswer(bubble, html, token) {
    if (reduceMotion) {
      bubble.innerHTML = html;
      scrollChatToEnd();
      return;
    }
    /* Разбиваем по словам/тегам, чтобы не рвать HTML-разметку (<code> и т. п.) */
    var tokens = html.match(/<[^>]+>|[^<\s]+|\s+/g) || [];
    var acc = "";
    var i = 0;
    function step() {
      if (token !== streamToken) return;
      acc += tokens[i];
      bubble.innerHTML = acc + '<span class="ide-demo__chat-cursor" aria-hidden="true"></span>';
      i += 1;
      scrollChatToEnd();
      if (i < tokens.length) {
        window.setTimeout(step, CHAT_STREAM_WORD_MS);
      } else {
        bubble.innerHTML = html;
        scrollChatToEnd();
      }
    }
    step();
  }

  function scrollChatToEnd() {
    if (chatLog) chatLog.scrollTop = chatLog.scrollHeight;
  }

  function askChat(item, token) {
    if (!chatLog) return;
    var idle = chatLog.querySelector(".ide-demo__chat-idle");
    if (idle) idle.remove();

    var userMsg = document.createElement("div");
    userMsg.className = "ide-demo__chat-msg ide-demo__chat-msg--user";
    userMsg.innerHTML = '<span class="ide-demo__chat-bubble">' + escapeHtml(item.q) + "</span>";
    chatLog.appendChild(userMsg);

    var aiMsg = document.createElement("div");
    aiMsg.className = "ide-demo__chat-msg ide-demo__chat-msg--ai";
    var aiBubble = document.createElement("span");
    aiBubble.className = "ide-demo__chat-bubble";
    aiMsg.appendChild(aiBubble);
    chatLog.appendChild(aiMsg);
    scrollChatToEnd();

    streamChatAnswer(aiBubble, item.a, token);
  }

  function renderSuggestions() {
    if (!chatSuggestions) return;
    var scenario = getScenario();
    chatSuggestions.innerHTML = "";
    scenario.chat.forEach(function (item) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "ide-demo__chat-chip";
      chip.textContent = item.q;
      chip.addEventListener("click", function () {
        askChat(item, streamToken);
      });
      chatSuggestions.appendChild(chip);
    });
  }

  /* ----- Переключение сценариев (язык + трек) ----- */
  function loadScenario(key) {
    if (!SCENARIOS[key]) return;
    currentScenarioKey = key;
    /* Прерываем активные стримы предыдущего сценария */
    streamToken += 1;
    ideDemoLoading = false;

    var scenario = getScenario();
    if (editor) editor.value = scenario.code;
    if (inputTitle) inputTitle.textContent = "Ваш код — " + scenario.filename;
    if (tabPanel) tabPanel.setAttribute("aria-labelledby", "ide-demo-tab-" + key);

    if (output) {
      output.textContent = "";
      output.classList.remove("ide-demo__output--loading");
      output.removeAttribute("aria-busy");
    }
    if (explainBody) {
      explainBody.classList.remove("ide-demo__explain-content--loading");
      explainBody.innerHTML =
        '<p class="ide-demo__explain-idle">Здесь появится разбор после нажатия кнопки ниже.</p>';
    }
    if (explainBox) explainBox.removeAttribute("aria-busy");
    if (btnDemo) {
      btnDemo.disabled = false;
      btnDemo.removeAttribute("aria-busy");
    }
    resetChat();
    renderSuggestions();
  }

  function initTabs() {
    if (!tabsBox) return;
    var tabs = Array.prototype.slice.call(tabsBox.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    function activate(tab, focusTab) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute("aria-selected", selected ? "true" : "false");
        t.tabIndex = selected ? 0 : -1;
        t.classList.toggle("ide-demo__tab--active", selected);
      });
      if (focusTab) tab.focus();
      loadScenario(tab.getAttribute("data-scenario"));
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        activate(tab, false);
      });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          next = tabs[(index + 1) % tabs.length];
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          next = tabs[(index - 1 + tabs.length) % tabs.length];
        } else if (e.key === "Home") {
          next = tabs[0];
        } else if (e.key === "End") {
          next = tabs[tabs.length - 1];
        }
        if (next) {
          e.preventDefault();
          activate(next, true);
        }
      });
    });
  }

  initTabs();
  renderSuggestions();

  function setMenuOpen(open) {
    if (!header || !menuToggle || !nav) return;
    header.classList.toggle("site-header--nav-open", open);
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    menuToggle.setAttribute(
      "aria-label",
      open ? "Закрыть меню навигации" : "Открыть меню навигации"
    );
  }

  if (menuToggle && nav && header) {
    menuToggle.addEventListener("click", () => {
      var open = !header.classList.contains("site-header--nav-open");
      setMenuOpen(open);
    });

    nav.querySelectorAll("a[href^='#']").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.matchMedia("(max-width: 47.99rem)").matches) {
          setMenuOpen(false);
        }
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && header.classList.contains("site-header--nav-open")) {
        setMenuOpen(false);
        menuToggle.focus();
      }
    });
  }

  function initNavSpy() {
    var navLinks = document.querySelectorAll("[data-nav-section]");
    if (!navLinks.length) return;

    var sectionIds = ["intro", "audience", "ide-demo", "features", "roadmap", "team", "feedback"];
    var sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

    function clearActive() {
      navLinks.forEach((link) => {
        link.classList.remove("text-link--active");
        link.removeAttribute("aria-current");
      });
    }

    function setActiveSection(id) {
      clearActive();
      if (id === "features") return;
      var link = document.querySelector('[data-nav-section="' + id + '"]');
      if (link) {
        link.classList.add("text-link--active");
        link.setAttribute("aria-current", "page");
      }
    }

    function updateActiveNav() {
      var band = window.innerHeight * 0.33;
      var best = null;
      var bestDist = Infinity;
      sections.forEach((sec) => {
        var r = sec.getBoundingClientRect();
        if (r.bottom <= 0 || r.top >= window.innerHeight) return;
        var center = r.top + r.height / 2;
        var dist = Math.abs(center - band);
        if (dist < bestDist) {
          bestDist = dist;
          best = sec.id;
        }
      });
      if (best) setActiveSection(best);
    }

    var ticking = false;
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActiveNav();
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    updateActiveNav();
  }

  initNavSpy();

  function initRoadmapProgress() {
    var timeline = document.getElementById("roadmap-timeline");
    var section = document.getElementById("roadmap");
    if (!timeline || !section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timeline.style.setProperty("--roadmap-progress", "1");
      return;
    }

    function computeProgress() {
      var rect = section.getBoundingClientRect();
      var vh = window.innerHeight;
      var h = rect.height;
      var raw = (vh - rect.top) / (h + vh);
      if (raw < 0) raw = 0;
      if (raw > 1) raw = 1;
      /* Быстрее базового скролла; к видимому последнему пункту линия уже заполнена */
      var p = Math.min(1, raw * 1.46);
      var lastStep = section.querySelector(".roadmap__step:last-child");
      var lr;
      var tail;
      if (lastStep) {
        lr = lastStep.getBoundingClientRect();
        if (lr.top < vh && lr.bottom > 0) {
          tail = (vh - lr.top + lr.height * 0.12) / (lr.height + vh * 0.32);
          tail = Math.max(0, Math.min(1, tail));
          p = Math.max(p, tail);
        }
      }
      return Math.min(1, p);
    }

    var ticking = false;
    function update() {
      ticking = false;
      timeline.style.setProperty("--roadmap-progress", String(computeProgress()));
    }

    function onScrollOrResize() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    update();
  }

  initRoadmapProgress();
})();
