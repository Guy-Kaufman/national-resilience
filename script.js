/* ============================================================
   National Resilience — interactions
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Nav: scrolled state + mobile toggle ---------- */
  var nav = document.getElementById("nav");
  var toggle = document.getElementById("navToggle");
  var mobile = document.getElementById("navMobile");

  function onScroll() {
    if (window.scrollY > 40) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toggle && mobile) {
    toggle.addEventListener("click", function () {
      var open = mobile.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    mobile.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mobile.classList.remove("is-open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            if (e.target.classList.contains("stat-strip")) runStatCount();
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Countdown to 17 September 2026, 17:00 Dubai (GST, UTC+4) ---------- */
  // 17:00 GST == 13:00 UTC
  var target = Date.UTC(2026, 8, 17, 13, 0, 0);
  var elDays = document.getElementById("cd-days");
  var elHours = document.getElementById("cd-hours");
  var elMin = document.getElementById("cd-min");
  var elSec = document.getElementById("cd-sec");

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function tick() {
    if (!elDays) return;
    var diff = target - Date.now();
    if (diff <= 0) {
      elDays.textContent = "00"; elHours.textContent = "00";
      elMin.textContent = "00"; elSec.textContent = "00";
      return;
    }
    var s = Math.floor(diff / 1000);
    var days = Math.floor(s / 86400);
    var hours = Math.floor((s % 86400) / 3600);
    var mins = Math.floor((s % 3600) / 60);
    var secs = s % 60;
    elDays.textContent = days;
    elHours.textContent = pad(hours);
    elMin.textContent = pad(mins);
    elSec.textContent = pad(secs);
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- Count-up animation for the stat strip ---------- */
  function animateCount(el) {
    if (!el || el.dataset.counted) return;     // run once per number
    el.dataset.counted = "1";
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduce) { el.textContent = target + suffix; return; }
    var dur = 1600, start = null;
    el.textContent = "0" + suffix;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(step);
  }
  function runStatCount() {
    document.querySelectorAll(".stat__num[data-count]").forEach(animateCount);
  }
  // Triggers: the reveal observer above calls runStatCount; plus an observer
  // and a scroll-position fallback so it fires reliably across browsers.
  (function () {
    var strip = document.querySelector(".stat-strip");
    if (!strip) return;
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { runStatCount(); io.disconnect(); }
          });
        },
        { threshold: 0.25 }
      );
      io.observe(strip);
    }
    function check() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var r = strip.getBoundingClientRect();
      if (r.top < vh * 0.9 && r.bottom > 0) {
        runStatCount();
        window.removeEventListener("scroll", check);
      }
    }
    check();
    window.addEventListener("scroll", check, { passive: true });
  })();

  /* ---------- Subtle network-grid animation ---------- */
  function NetworkGrid(canvas) {
    if (!canvas || reduce) return;
    var ctx = canvas.getContext("2d");
    var points = [];
    var w, h, dpr;
    var COUNT, MAXDIST;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      COUNT = Math.max(28, Math.floor((w * h) / 26000));
      MAXDIST = Math.min(180, w / 7);
      points = [];
      for (var i = 0; i < COUNT; i++) {
        points.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      for (var a = 0; a < points.length; a++) {
        for (var b = a + 1; b < points.length; b++) {
          var dx = points[a].x - points[b].x;
          var dy = points[a].y - points[b].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAXDIST) {
            var alpha = (1 - dist / MAXDIST) * 0.16;
            ctx.strokeStyle = "rgba(200,200,194," + alpha + ")";
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(points[a].x, points[a].y);
            ctx.lineTo(points[b].x, points[b].y);
            ctx.stroke();
          }
        }
      }
      for (var k = 0; k < points.length; k++) {
        ctx.fillStyle = "rgba(202,198,189,0.42)";
        ctx.beginPath();
        ctx.arc(points[k].x, points[k].y, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }

    var raf;
    resize();
    draw();
    window.addEventListener("resize", function () {
      cancelAnimationFrame(raf);
      resize();
      draw();
    });
  }

  NetworkGrid(document.getElementById("gridCanvas"));
  NetworkGrid(document.getElementById("gridCanvas2"));

  /* ---------- Hero background video (YouTube) ---------- */
  (function heroVideo() {
    var mount = document.getElementById("heroVideo");
    if (!mount) return;

    var VIDEO_ID = "giq-11R9Igs";

    // Respect reduced-motion: keep the static gradient + grid instead of autoplay.
    if (reduce) {
      mount.parentNode.removeChild(mount);
      return;
    }

    function createPlayer() {
      new YT.Player("heroVideo", {
        videoId: VIDEO_ID,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          loop: 1,
          playlist: VIDEO_ID,   // required for loop on a single video
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          fs: 0,
          disablekb: 1,
          iv_load_policy: 3,
        },
        events: {
          onReady: function (e) {
            e.target.mute();
            e.target.playVideo();
            // Watchdog: if the video ever stops playing (pause/end/throttle),
            // resume it so YouTube's big play-button overlay never lingers.
            setInterval(function () {
              try {
                var s = e.target.getPlayerState();
                // 1 = PLAYING, 3 = BUFFERING
                if (s !== 1 && s !== 3) {
                  e.target.mute();
                  e.target.playVideo();
                }
              } catch (err) {}
            }, 1200);
          },
          onStateChange: function (e) {
            // ENDED(0), PAUSED(2), CUED(5) -> immediately resume
            if (e.data === YT.PlayerState.ENDED) {
              e.target.seekTo(0);
              e.target.playVideo();
            } else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.CUED) {
              e.target.playVideo();
            }
          },
        },
      });
    }

    // Load the IFrame API once, then build the player.
    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof prev === "function") prev();
        createPlayer();
      };
      if (!document.getElementById("yt-iframe-api")) {
        var tag = document.createElement("script");
        tag.id = "yt-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    }
  })();

  /* ---------- Partner inquiry modal ---------- */
  (function partnerModal() {
    var modal = document.getElementById("partnerModal");
    if (!modal) return;

    /* ====================================================================
       PASTE YOUR GOOGLE APPS SCRIPT WEB-APP URL BETWEEN THE QUOTES BELOW.
       (Setup steps are in the project notes — deploy the Sheet's Apps
       Script as a Web App, "Anyone" access, and paste its /exec URL here.)
       Until it's set, the form still works as a demo but won't record data.
       ==================================================================== */
    var FORM_ENDPOINT = "";

    var dialog = modal.querySelector(".modal__dialog");
    var form = document.getElementById("partnerForm");
    var statusEl = document.getElementById("pfStatus");
    var submitBtn = document.getElementById("pfSubmit");
    var successEl = document.getElementById("pfSuccess");
    var lastFocused = null;

    function isPartnerLink(a) {
      return a.textContent.trim().toLowerCase() === "become a partner";
    }

    function openModal(e) {
      if (e) e.preventDefault();
      lastFocused = document.activeElement;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      var first = form.querySelector("input:not(.modal__hp)");
      if (first) setTimeout(function () { first.focus(); }, 60);
    }

    function closeModal() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    /* Open from every "Become a Partner" link on the page */
    document.querySelectorAll("a").forEach(function (a) {
      if (isPartnerLink(a)) a.addEventListener("click", openModal);
    });

    /* Close: X button, backdrop, any [data-modal-close], Escape */
    modal.querySelectorAll("[data-modal-close]").forEach(function (el) {
      el.addEventListener("click", closeModal);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
    });

    /* Submit */
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var telegram = form.telegram.value.trim();
      var phone = form.phone.value.trim();
      var email = form.email.value.trim();

      // honeypot — silently accept (and drop) bot submissions
      if (form.company_url && form.company_url.value) { showSuccess(); return; }

      // required validation
      var ok = true;
      [form.telegram, form.phone].forEach(function (inp) {
        if (!inp.value.trim()) { inp.classList.add("is-error"); ok = false; }
        else inp.classList.remove("is-error");
      });
      if (!ok) {
        statusEl.textContent = "Please add your Telegram handle and phone.";
        statusEl.classList.add("is-error");
        return;
      }
      statusEl.textContent = "";
      statusEl.classList.remove("is-error");

      submitBtn.disabled = true;
      var origLabel = submitBtn.textContent;
      submitBtn.textContent = "Sending…";

      var payload = new URLSearchParams({
        telegram: telegram,
        phone: phone,
        email: email,
        page: location.href,
        submitted_at: new Date().toISOString()
      });

      function done() {
        submitBtn.disabled = false;
        submitBtn.textContent = origLabel;
        showSuccess();
      }

      if (FORM_ENDPOINT) {
        fetch(FORM_ENDPOINT, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: payload.toString()
        }).then(done).catch(function () {
          // no-cors gives an opaque response; treat reachable as success
          done();
        });
      } else {
        console.warn("[partner form] FORM_ENDPOINT is not set — submission not recorded.");
        setTimeout(done, 500);
      }
    });

    function showSuccess() {
      form.hidden = true;
      successEl.hidden = false;
      form.reset();
    }
  })();
})();
