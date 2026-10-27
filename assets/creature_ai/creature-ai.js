// Interactive figures for the "Inside the creature's mind" series.
// Each figure starts only when its container is on the page.
(function () {
  "use strict";

  const reduceMotion = (() => {
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  })();
  const $ = (id) => document.getElementById(id);
  const NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, text) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function svg(parent, w, h, label) {
    const s = el("svg", { viewBox: `0 0 ${w} ${h}`, role: "img", "aria-label": label });
    const defs = el("defs", {});
    const m = el("marker", { id: "cai-arrowhead", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" });
    m.appendChild(el("path", { d: "M0 0 L10 5 L0 10 z", fill: "#9aa3b2" }));
    defs.appendChild(m);
    s.appendChild(defs);
    parent.appendChild(s);
    return s;
  }
  function box(s, x, y, w, h, title, sub, cls) {
    s.appendChild(el("rect", { x, y, width: w, height: h, rx: 8, class: "s-box" + (cls ? " " + cls : "") }));
    s.appendChild(el("text", { x: x + w / 2, y: y + (sub ? h / 2 - 3 : h / 2 + 5), "text-anchor": "middle", class: "s-big" }, title));
    if (sub) s.appendChild(el("text", { x: x + w / 2, y: y + h / 2 + 14, "text-anchor": "middle", class: "s-txt" }, sub));
  }
  function arrow(s, x1, y1, x2, y2) {
    s.appendChild(el("line", { x1, y1, x2, y2, class: "s-arrow" }));
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // The game's 41-step sigmoid table. Index = trunc((value - threshold + 1) * 20.5), max 40.
  const SIG = [0, 3.6e-9, 1e-8, 2.8e-8, 7.78e-8, 2.163e-7, 6.018e-7, 1.674e-6, 4.6568e-6, 1.29542e-5, 3.60351e-5,
    1.002359e-4, 2.787865e-4, 7.751431e-4, 0.0021533191, 0.0059672082, 0.0164249446, 0.0443917401, 0.1144372821,
    0.2644243538, 0.5, 0.735575676, 0.8855627179, 0.9556082487, 0.9835750461, 0.9940328002, 0.997846663,
    0.9992248416, 0.9997212291, 0.999899745, 0.9999639392, 0.9999870658, 0.9999953508, 0.9999983311, 0.999999404,
    0.9999997616, 0.9999999404, 1, 1, 1, 1];
  // Per-species data from the game's tables: the five inborn traits that feed desires (kindness, aggression,
  // lethargy, friendliness, communicativeness) and the multiplier on the miracle sightings it needs.
  const SPECIES = [
    { n: "Ape", traits: [0.1, 0.05, 0.05, 0.1, 0.3], miracle: 1.03 },
    { n: "Cow", traits: [0.2, 0.01, 0.2, 0.3, 0.01], miracle: 2.2 },
    { n: "Tiger", traits: [0.02, 0.2, 0.05, 0.05, 0.01], miracle: 4.27 },
    { n: "Leopard", traits: [0.05, 0.1, 0.05, 0.05, 0.01], miracle: 3.88 },
    { n: "Wolf", traits: [0.01, 0.2, 0.05, 0.05, 0.01], miracle: 2.69 },
    { n: "Lion", traits: [0.05, 0.15, 0.05, 0.05, 0.1], miracle: 1.4 },
    { n: "Horse", traits: [0.1, 0.05, 0.05, 0.1, 0.01], miracle: 1.72 },
    { n: "Tortoise", traits: [0.1, 0.05, 0.2, 0.1, 0.01], miracle: 1.5 },
    { n: "Zebra", traits: [0.15, 0.05, 0.05, 0.1, 0.01], miracle: 1.72 },
    { n: "Bear", traits: [0.1, 0.05, 0.1, 0.1, 0.01], miracle: 3.37 },
    { n: "Polar bear", traits: [0.1, 0.1, 0.05, 0.1, 0.01], miracle: 3.31 },
    { n: "Sheep", traits: [0.2, 0.05, 0.25, 0.2, 0.01], miracle: 3.2 },
    { n: "Chimp", traits: [0.1, 0.1, 0.05, 0.1, 0.01], miracle: 1.3 },
    { n: "Ogre", traits: [0.2, 0.05, 0.25, 0.2, 0.01], miracle: 3.25 },
    { n: "Mandrill", traits: [0.2, 0.05, 0.25, 0.2, 0.01], miracle: 2.91 },
    { n: "Rhino", traits: [0.2, 0.05, 0.25, 0.2, 0.01], miracle: 3.87 },
    { n: "Gorilla", traits: [0.2, 0.05, 0.25, 0.2, 0.01], miracle: 3.2 },
  ];
  function sig(threshold, value) {
    if (value <= 0 || threshold === 1) return 0;
    const d = clamp(clamp(value, -1, 1) - threshold, -1, 1);
    return SIG[Math.min(40, Math.trunc((d + 1) * 20.5))];
  }

  // ---------- Part 1: the loop of thought ----------
  function loopFigure(root) {
    const s = svg(root, 640, 300, "The creature's loop: body and world, desires, plan, actions, your hand, and back again");
    const B = [
      [40, 30, "Body and world", "energy, night, damage"],
      [240, 30, "Desires", "40 feelings"],
      [440, 30, "Plan", "what to do, to what"],
      [440, 200, "Actions", "walk, eat, throw"],
      [240, 200, "Your hand", "slap or stroke"],
      [40, 200, "Lessons", "change desires, beliefs"],
    ];
    B.forEach((b) => box(s, b[0], b[1], 160, 64, b[2], b[3]));
    arrow(s, 200, 62, 238, 62); arrow(s, 400, 62, 438, 62); arrow(s, 520, 94, 520, 198);
    arrow(s, 440, 232, 402, 232); arrow(s, 240, 232, 202, 232); arrow(s, 120, 200, 120, 96);
    const path = "M120 62 L320 62 L520 62 L520 232 L320 232 L120 232 Z";
    s.appendChild(el("text", { x: 320, y: 150, "text-anchor": "middle", class: "s-txt" }, "about 10 times each second"));
    if (!reduceMotion) {
      const dot = el("circle", { r: 7, class: "loop-dot" });
      const am = el("animateMotion", { dur: "8s", repeatCount: "indefinite", path });
      dot.appendChild(am);
      s.appendChild(dot);
    }
  }

  // ---------- Part 1: the sigmoid ----------
  function sigmoidFigure(root) {
    const host = document.createElement("div");
    root.appendChild(host);
    const s = svg(host, 640, 270, "The creature's S-curve. The drive is near 0 below the threshold, 0.5 at it, and near 1 above it.");
    const L = 60, R = 500, T = 20, Bt = 220;
    const X = (d) => L + (d + 1) / 2 * (R - L);
    const Y = (v) => Bt - v * (Bt - T);
    [0, 0.5, 1].forEach((v) => {
      s.appendChild(el("line", { x1: L, x2: R, y1: Y(v), y2: Y(v), class: "s-grid" }));
      s.appendChild(el("text", { x: L - 8, y: Y(v) + 4, "text-anchor": "end", class: "s-txt" }, v.toFixed(1)));
    });
    [-1, -0.5, 0, 0.5, 1].forEach((d) => s.appendChild(el("text", { x: X(d), y: Bt + 18, "text-anchor": "middle", class: "s-txt" }, d)));
    s.appendChild(el("line", { x1: L, x2: R, y1: Bt, y2: Bt, class: "s-axis" }));
    s.appendChild(el("line", { x1: L, x2: L, y1: T, y2: Bt, class: "s-axis" }));
    s.appendChild(el("text", { x: (L + R) / 2, y: Bt + 40, "text-anchor": "middle", class: "s-txt" }, "how far the value is above (+) or below (−) its threshold"));
    s.appendChild(el("text", { x: 14, y: (T + Bt) / 2, "text-anchor": "middle", class: "s-txt", transform: `rotate(-90 14 ${(T + Bt) / 2})` }, "drive"));
    // A gentle S-curve for comparison.
    let soft = "";
    for (let i = 0; i <= 100; i++) {
      const d = -1 + i / 50;
      soft += (i ? "L" : "M") + X(d).toFixed(1) + " " + Y(1 / (1 + Math.exp(-5 * d))).toFixed(1) + " ";
    }
    s.appendChild(el("path", { d: soft, class: "s-soft" }));
    // The game's steps.
    let p = "";
    for (let i = 0; i <= 40; i++) {
      const d0 = i / 20.5 - 1, d1 = Math.min(1, (i + 1) / 20.5 - 1);
      p += (i ? "L" : "M") + X(d0).toFixed(1) + " " + Y(SIG[i]).toFixed(1) + " L" + X(d1).toFixed(1) + " " + Y(SIG[i]).toFixed(1) + " ";
    }
    s.appendChild(el("path", { d: p, class: "s-curve" }));
    s.appendChild(el("line", { x1: 520, x2: 545, y1: 40, y2: 40, class: "s-curve" }));
    s.appendChild(el("text", { x: 552, y: 44, class: "s-txt" }, "the game"));
    s.appendChild(el("line", { x1: 520, x2: 545, y1: 62, y2: 62, class: "s-soft" }));
    s.appendChild(el("text", { x: 552, y: 66, class: "s-txt" }, "a soft S-curve"));
    const pt = el("circle", { r: 6, fill: "#f2b84b" });
    s.appendChild(pt);
    // The lamp.
    s.appendChild(el("text", { x: 570, y: 120, "text-anchor": "middle", class: "s-txt" }, "the lamp"));
    const glow = el("circle", { cx: 570, cy: 170, r: 34, fill: "#f2b84b", opacity: 0 });
    s.appendChild(el("circle", { cx: 570, cy: 170, r: 34, fill: "#2a303b", stroke: "#444c5a" }));
    s.appendChild(glow);

    const row = document.createElement("div");
    row.className = "cai-row";
    row.innerHTML = '<label for="cai-sig-d">Value minus threshold</label><input id="cai-sig-d" type="range" min="-1" max="1" step="0.01" value="-0.2"><span class="cai-val" id="cai-sig-out"></span>';
    root.appendChild(row);
    const msg = document.createElement("p");
    msg.className = "cai-note";
    root.appendChild(msg);
    const input = row.querySelector("input");
    function update() {
      const d = +input.value;
      const v = SIG[Math.min(40, Math.trunc((d + 1) * 20.5))];
      pt.setAttribute("cx", X(d));
      pt.setAttribute("cy", Y(v));
      glow.setAttribute("opacity", v.toFixed(3));
      row.querySelector("#cai-sig-out").textContent = v < 0.001 && v > 0 ? v.toExponential(1) : v.toFixed(3);
      msg.textContent = d < -0.15 ? "Far below the threshold. The drive is almost zero, but not quite zero."
        : d < 0 ? "Just below the threshold. The drive starts to come on."
          : d < 0.15 ? "At or just over the threshold. The drive goes up fast."
            : "Well over the threshold. The drive is full. More does not help.";
    }
    input.addEventListener("input", update);
    update();
  }

  // ---------- Part 1: why a sigmoid ----------
  function whyFigure(root) {
    const s = svg(root, 640, 210, "Three ways to read the energy source: the raw value, an on/off switch, and the game's sigmoid");
    const panels = [
      ["Raw value", (u) => u, "#6fa8ff"],
      ["On/off switch", (u) => (u >= 0.4 ? 1 : 0), "#eb6b6b"],
      ["The game's sigmoid", (u) => sig(0.4, u), "#f2b84b"],
    ];
    panels.forEach((p, k) => {
      const L = 20 + k * 210, R = L + 180, T = 30, Bt = 160;
      const X = (u) => L + u * (R - L), Y = (v) => Bt - v * (Bt - T);
      s.appendChild(el("text", { x: (L + R) / 2, y: 18, "text-anchor": "middle", class: "s-big" }, p[0]));
      s.appendChild(el("line", { x1: L, x2: R, y1: Bt, y2: Bt, class: "s-axis" }));
      s.appendChild(el("line", { x1: L, x2: L, y1: T, y2: Bt, class: "s-axis" }));
      s.appendChild(el("line", { x1: X(0.4), x2: X(0.4), y1: T, y2: Bt, class: "s-grid" }));
      s.appendChild(el("text", { x: X(0.4), y: Bt + 14, "text-anchor": "middle", class: "s-txt" }, "0.4"));
      s.appendChild(el("text", { x: (L + R) / 2, y: Bt + 32, "text-anchor": "middle", class: "s-txt" }, "energy used →"));
      let d = "";
      for (let i = 0; i <= 200; i++) {
        const u = i / 200;
        d += (i ? "L" : "M") + X(u).toFixed(1) + " " + Y(p[1](u)).toFixed(1) + " ";
      }
      s.appendChild(el("path", { d, fill: "none", stroke: p[2], "stroke-width": 2.5 }));
    });
    s.appendChild(el("text", { x: 14, y: 95, "text-anchor": "middle", class: "s-txt", transform: "rotate(-90 14 95)" }, "drive"));
  }

  // ---------- Part 1: desire bars ----------
  function desireFigure(root) {
    root.insertAdjacentHTML("beforeend", `
      <div class="cai-row"><label for="cai-d-energy">Energy</label><input id="cai-d-energy" type="range" min="0" max="1" step="0.01" value="0.3"><span class="cai-val" id="cai-d-energy-o"></span></div>
      <div class="cai-row"><label for="cai-d-exh">Exhaustion</label><input id="cai-d-exh" type="range" min="0" max="1" step="0.01" value="0.2"><span class="cai-val" id="cai-d-exh-o"></span></div>
      <div class="cai-row"><label><input id="cai-d-night" type="checkbox"> It is night</label>
        <button id="cai-d-run">Pause</button><button id="cai-d-eat" class="good">Eat a meal</button><button id="cai-d-reset">Reset</button></div>
      <div id="cai-d-bars"></div>
      <p class="cai-note" id="cai-d-msg"></p>`);
    const D = [
      // name, max, growth time in seconds, sources: [threshold, read]
      { n: "Hunger", max: 2.0, t: 20, src: [[0.4, (i) => 1 - i.e]] },
      { n: "Tiredness", max: 2.0, t: 2, src: [[0.4, (i) => i.x], [0.95, (i) => i.n * 0.999]] },
      { n: "Fear", max: 0.92, t: 1, src: [[0.95, (i) => i.n * 0.9]] },
    ];
    const vals = [0, 0, 0];
    const bars = $("cai-d-bars");
    D.forEach((d, k) => bars.insertAdjacentHTML("beforeend", `<div class="bar-row" id="cai-d-r${k}"><span>${d.n}</span><div class="bar"><i></i></div><span>0.00</span></div>`));
    const inp = () => ({ e: +$("cai-d-energy").value, x: +$("cai-d-exh").value, n: $("cai-d-night").checked ? 1 : 0 });
    function step() {
      const i = inp();
      D.forEach((d, k) => {
        const inc = d.src.reduce((a, s) => a + sig(s[0], s[1](i)), 0) / (10 * d.t);
        vals[k] = clamp(inc > 0 ? vals[k] + inc : vals[k] * 0.9995, 0, d.max);
      });
    }
    function draw() {
      let best = 0;
      vals.forEach((v, k) => { if (v > vals[best]) best = k; });
      D.forEach((d, k) => {
        const r = $("cai-d-r" + k);
        r.querySelector("i").style.width = (vals[k] / 2 * 100) + "%";
        r.querySelector("span:last-child").textContent = vals[k].toFixed(2);
        r.classList.toggle("top", k === best && vals[k] > 0);
      });
      $("cai-d-energy-o").textContent = (+$("cai-d-energy").value).toFixed(2);
      $("cai-d-exh-o").textContent = (+$("cai-d-exh").value).toFixed(2);
      $("cai-d-msg").textContent = vals[best] > 0 ? `${D[best].n} is the strongest desire now.` : "No desire is active.";
    }
    let timer = null;
    const start = () => { timer = setInterval(() => { step(); draw(); }, 100); $("cai-d-run").textContent = "Pause"; };
    const stop = () => { clearInterval(timer); timer = null; $("cai-d-run").textContent = "Run"; };
    $("cai-d-run").addEventListener("click", () => (timer ? stop() : start()));
    $("cai-d-eat").addEventListener("click", () => { vals[0] *= 0.3; draw(); });
    $("cai-d-reset").addEventListener("click", () => { vals.fill(0); draw(); });
    ["cai-d-energy", "cai-d-exh", "cai-d-night"].forEach((id) => $(id).addEventListener("input", draw));
    draw();
    if (reduceMotion) stop(); else start();
  }

  // ---------- Part 2: the planning pipeline ----------
  function pipelineFigure(root) {
    const s = svg(root, 640, 330, "How a plan is made: desire, action, object, priority, then the double check");
    box(s, 20, 20, 180, 60, "1. A desire", "for example Hunger");
    box(s, 230, 20, 180, 60, "2. Choose an action", "liked and not done lately");
    box(s, 440, 20, 180, 60, "3. Choose an object", "useful and near");
    box(s, 230, 130, 180, 60, "4. Priority", "desire × object score");
    box(s, 230, 240, 180, 60, "5. Twice as urgent?", "than the current plan", "hot");
    box(s, 20, 240, 170, 60, "No", "keep the current plan");
    box(s, 450, 240, 170, 60, "Yes", "start the new agenda");
    arrow(s, 200, 50, 228, 50); arrow(s, 410, 50, 438, 50);
    s.appendChild(el("path", { d: "M530 80 L530 110 L320 110 L320 128", class: "s-arrow" }));
    arrow(s, 320, 190, 320, 238); arrow(s, 230, 270, 192, 270); arrow(s, 410, 270, 448, 270);
  }

  // ---------- Part 2: distance ----------
  function distanceFigure(root) {
    root.insertAdjacentHTML("beforeend", `
      <div class="cai-row"><label for="cai-dist">Distance to the object</label><input id="cai-dist" type="range" min="0" max="250" step="1" value="60"><span class="cai-val" id="cai-dist-o"></span></div>
      <div class="bar-row"><span>Hunger</span><div class="bar"><i id="cai-dist-h"></i></div><span id="cai-dist-hv"></span></div>
      <div class="bar-row"><span>Curiosity</span><div class="bar"><i id="cai-dist-c"></i></div><span id="cai-dist-cv"></span></div>
      <p class="cai-note">The bar is the distance score. 1.00 means "no cost for distance". Past 200 m, distance does not count more.</p>`);
    const f = (w, d) => 1 - w * Math.min(d, 200) / 200;
    function upd() {
      const d = +$("cai-dist").value;
      $("cai-dist-o").textContent = d + " m";
      const h = f(0.05, d), c = f(0.4, d);
      $("cai-dist-h").style.width = h * 100 + "%"; $("cai-dist-hv").textContent = h.toFixed(2);
      $("cai-dist-c").style.width = c * 100 + "%"; $("cai-dist-cv").textContent = c.toFixed(2);
    }
    $("cai-dist").addEventListener("input", upd);
    upd();
  }

  // ---------- Part 2: the double rule ----------
  function switchFigure(root) {
    const host = document.createElement("div");
    root.appendChild(host);
    const s = svg(host, 640, 260, "Two plan priorities over one minute, and when the creature changes plan");
    const L = 50, R = 620, T = 15, Bt = 210, TMAX = 60, VMAX = 0.9;
    const X = (t) => L + t / TMAX * (R - L), Y = (v) => Bt - v / VMAX * (Bt - T);
    [0, 0.3, 0.6, 0.9].forEach((v) => {
      s.appendChild(el("line", { x1: L, x2: R, y1: Y(v), y2: Y(v), class: "s-grid" }));
      s.appendChild(el("text", { x: L - 6, y: Y(v) + 4, "text-anchor": "end", class: "s-txt" }, v.toFixed(1)));
    });
    [0, 15, 30, 45, 60].forEach((t) => s.appendChild(el("text", { x: X(t), y: Bt + 16, "text-anchor": "middle", class: "s-txt" }, t + " s")));
    s.appendChild(el("line", { x1: L, x2: R, y1: Bt, y2: Bt, class: "s-axis" }));
    const look = (t) => 0.3 + 0.04 * Math.sin(t * 1.3);
    const eat = (t) => Math.max(0, 0.012 * t + 0.03 * Math.sin(t * 2.1));
    const pLook = el("path", { fill: "none", stroke: "#6fa8ff", "stroke-width": 2.5 });
    const pEat = el("path", { fill: "none", stroke: "#f2b84b", "stroke-width": 2.5 });
    const pBar = el("path", { fill: "none", stroke: "#eb6b6b", "stroke-width": 1.5, "stroke-dasharray": "5 4" });
    const marks = el("g", {});
    [pBar, pLook, pEat, marks].forEach((p) => s.appendChild(p));
    s.appendChild(el("text", { x: L + 6, y: Bt + 38, fill: "#6fa8ff", class: "s-txt", style: "fill:#6fa8ff" }, "— Look around plan"));
    s.appendChild(el("text", { x: L + 170, y: Bt + 38, style: "fill:#f2b84b", class: "s-txt" }, "— Eat plan"));
    s.appendChild(el("text", { x: L + 290, y: Bt + 38, style: "fill:#eb6b6b", class: "s-txt" }, "- - the bar to beat"));
    root.insertAdjacentHTML("beforeend", `<div class="cai-row"><label><input type="checkbox" id="cai-sw-rule" checked> Use the double rule</label><button id="cai-sw-play">Replay</button></div><p class="cai-note" id="cai-sw-msg"></p>`);
    let t = 0, timer = null;
    function run() {
      const rule = $("cai-sw-rule").checked;
      let cur = "look", a = "", b = "", c = "", switches = 0;
      while (marks.firstChild) marks.removeChild(marks.firstChild);
      for (let u = 0; u <= t + 1e-9; u += 0.25) {
        const lv = look(u), ev = eat(u);
        const curV = cur === "look" ? lv : ev, other = cur === "look" ? ev : lv;
        const bar = rule ? 2 * curV : curV;
        if (other > bar) {
          cur = cur === "look" ? "eat" : "look";
          switches++;
          marks.appendChild(el("line", { x1: X(u), x2: X(u), y1: T, y2: Bt, stroke: "#6fcf97", "stroke-width": 1 }));
        }
        const cv = cur === "look" ? lv : ev;
        a += (a ? "L" : "M") + X(u).toFixed(1) + " " + Y(lv).toFixed(1);
        b += (b ? "L" : "M") + X(u).toFixed(1) + " " + Y(ev).toFixed(1);
        c += (c ? "L" : "M") + X(u).toFixed(1) + " " + Y(Math.min(VMAX, rule ? 2 * cv : cv)).toFixed(1);
      }
      pLook.setAttribute("d", a); pEat.setAttribute("d", b); pBar.setAttribute("d", c);
      $("cai-sw-msg").textContent = `Time ${t.toFixed(0)} s. Doing: ${cur === "look" ? "Look around" : "Eat"}. Changes of plan: ${switches}.`;
    }
    function play() {
      clearInterval(timer);
      t = reduceMotion ? TMAX : 0;
      run();
      if (reduceMotion) return;
      timer = setInterval(() => { t = Math.min(TMAX, t + 0.5); run(); if (t >= TMAX) clearInterval(timer); }, 50);
    }
    $("cai-sw-play").addEventListener("click", play);
    $("cai-sw-rule").addEventListener("change", play);
    play();
  }

  // ---------- Part 2: an agenda ----------
  function agendaFigure(root) {
    const host = document.createElement("div");
    root.appendChild(host);
    const s = svg(host, 640, 120, "The creature walks to the storage pit and eats");
    s.appendChild(el("line", { x1: 30, x2: 610, y1: 95, y2: 95, class: "s-axis" }));
    s.appendChild(el("rect", { x: 515, y: 75, width: 90, height: 20, rx: 3, fill: "#6b5a3a", stroke: "#9aa3b2" }));
    s.appendChild(el("text", { x: 560, y: 66, "text-anchor": "middle", class: "s-txt" }, "storage pit"));
    const cre = el("g", {});
    cre.appendChild(el("circle", { cx: 0, cy: 73, r: 22, fill: "#c98b4a" }));
    const food = el("circle", { cx: 28, cy: 70, r: 6, fill: "#6fcf97", opacity: 0 });
    cre.appendChild(food);
    s.appendChild(cre);
    root.insertAdjacentHTML("beforeend", `<ol class="steps" id="cai-ag-steps">
      <li>Walk to the storage pit.</li><li>Turn to face it.</li><li>Take a bundle of food.</li><li>Eat the food.</li>
      <li>Plan complete. Hunger goes down to 30% of its value.</li></ol>
      <div class="cai-row"><button id="cai-ag-play">Play</button><span class="cai-val" id="cai-ag-h"></span></div>`);
    const steps = [...root.querySelectorAll("#cai-ag-steps li")];
    let i = -1, timer = null;
    function draw() {
      steps.forEach((li, j) => { li.classList.toggle("on", j === i); li.classList.toggle("done", j < i); });
      const x = i < 0 ? 60 : 490;
      cre.style.transition = reduceMotion ? "none" : "transform 1.5s ease-in-out";
      cre.style.transform = `translate(${x}px,0)`;
      food.setAttribute("opacity", i === 2 || i === 3 ? 1 : 0);
      food.setAttribute("cy", i === 3 ? 60 : 70);
      $("cai-ag-h").textContent = "Hunger " + (i >= 4 ? "0.30" : "1.00");
    }
    function next() { i++; if (i > 4) { clearInterval(timer); timer = null; $("cai-ag-play").textContent = "Play"; i = 4; } draw(); }
    $("cai-ag-play").addEventListener("click", () => {
      if (timer) { clearInterval(timer); timer = null; $("cai-ag-play").textContent = "Play"; return; }
      if (i >= 4) i = -1;
      next(); timer = setInterval(next, 1700); $("cai-ag-play").textContent = "Pause";
    });
    draw();
  }

  // ---------- Part 3: the hand ----------
  function handFigure(root) {
    root.insertAdjacentHTML("beforeend", `
      <div class="cai-row"><button class="good" data-h="stroke">Stroke (+0.1)</button><button class="bad" data-h="gentle">Gentle slap (−0.1)</button><button class="bad" data-h="hard">Hard slap (−0.2)</button><button id="cai-h-go">Let go</button></div>
      <div class="cai-row"><span>Running total</span><span class="cai-val" id="cai-h-v">0.00</span><span class="cai-note">(slap on the left, stroke on the right)</span></div>
      <svg viewBox="0 0 640 30" aria-hidden="true"><rect x="20" y="5" width="600" height="20" rx="4" fill="#2a303b"></rect><rect id="cai-h-fill" x="320" y="5" width="0" height="20" rx="4" fill="#6fcf97"></rect><line x1="320" x2="320" y1="0" y2="30" stroke="#9aa3b2"></line></svg>
      <p class="cai-note" id="cai-h-msg">Touch the creature. Then let go.</p>`);
    let sum = 0;
    function draw() {
      const f = root.querySelector("#cai-h-fill");
      const w = Math.abs(sum) * 300;
      f.setAttribute("x", sum >= 0 ? 320 : 320 - w);
      f.setAttribute("width", w);
      f.setAttribute("fill", sum >= 0 ? "#6fcf97" : "#eb6b6b");
      $("cai-h-v").textContent = (sum >= 0 ? "+" : "") + sum.toFixed(2);
    }
    root.querySelectorAll("button[data-h]").forEach((b) => b.addEventListener("click", () => {
      const k = b.getAttribute("data-h");
      if (k === "stroke") sum = Math.min(1, sum + 0.1);
      else {
        let d = k === "hard" ? 0.2 : 0.1;
        if (sum > 0.25) d *= 2;
        sum = Math.max(-1, sum - d);
      }
      sum = Math.round(sum * 100) / 100;
      $("cai-h-msg").textContent = "Keep going, or let go to send the lesson.";
      draw();
    }));
    $("cai-h-go").addEventListener("click", () => {
      const f = sum;
      let txt;
      if (Math.abs(f) <= 0.01) txt = "The total is about zero. The creature only looks at you. It learns nothing.";
      else {
        const used = Math.abs(f) < 0.5 ? Math.sign(f) * 0.5 : f;
        txt = `You sent ${f >= 0 ? "+" : ""}${f.toFixed(2)}. The creature learns from ${used >= 0 ? "+" : ""}${used.toFixed(2)}.` +
          (Math.abs(f) < 0.5 ? " A small touch counts as half strength." : "");
      }
      $("cai-h-msg").textContent = txt;
      sum = 0;
      draw();
    });
    draw();
  }

  // ---------- Part 3: which plan gets the credit ----------
  function creditFigure(root) {
    root.insertAdjacentHTML("beforeend", `
      <div class="cai-row"><label for="cai-c-t">Seconds from the end of the meal to your slap</label><input id="cai-c-t" type="range" min="0" max="25" step="0.5" value="3.5"><span class="cai-val" id="cai-c-to"></span></div>
      <div class="cai-row"><label><input type="checkbox" id="cai-c-run"> The creature does something now (it looks around)</label></div>
      <div id="cai-c-bars"></div><p class="cai-note" id="cai-c-msg"></p>`);
    function upd() {
      const t = +$("cai-c-t").value;
      $("cai-c-to").textContent = t + " s";
      const rows = [];
      if ($("cai-c-run").checked) rows.push({ n: "Look around (now)", p: 1 });
      if (t >= 3) rows.push({ n: "Throw a rock (5 s memory)", p: 1 - (t - 3) / 5 });
      rows.push({ n: "Eat a villager (20 s memory)", p: 1 - t / 20 });
      let best = null;
      rows.forEach((r) => { if (r.p > 0 && (!best || r.p > best.p)) best = r; });
      $("cai-c-bars").innerHTML = rows.map((r) => `<div class="bar-row${r === best ? " top" : ""}"><span>${r.n}</span><div class="bar"><i style="width:${clamp(r.p, 0, 1) * 100}%"></i></div><span>${clamp(r.p, 0, 1).toFixed(2)}</span></div>`).join("");
      $("cai-c-msg").textContent = best ? `The slap teaches about: ${best.n.replace(/ \(.*\)/, "")}.` : "No plan is recent enough. Only the creature's view of you changes.";
    }
    $("cai-c-t").addEventListener("input", upd);
    $("cai-c-run").addEventListener("change", upd);
    upd();
  }

  // ---------- Part 3: the decision tree, shared by two figures ----------
  // The game's method: entropy mixes "good or bad" and an 11-step scale, questions are ranked by gain ratio,
  // every question gets one branch for each possible answer, and the tree is built again from all examples.
  const DT = (() => {
    const SCALE = [-1, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1];
    const ATTR = {
      ALLEGIANCE: { r: 3, q: "Is it mine?", names: ["mine", "not mine", "other"] },
      ANIMATE: { r: 2, q: "Is it alive?", names: ["no", "yes"] },
      TYPE: { r: 24, q: "What kind of thing?", names: { 0: "villager", 1: "animal", 2: "storage pit", 3: "food pile" } },
      TRIBE: { r: 9, q: "Which tribe?", names: { 0: "Celtic", 1: "Norse" } },
      SEX: { r: 2, q: "Man or woman?", names: ["man", "woman"] },
    };
    const ROOT = ["ALLEGIANCE", "ANIMATE", "TYPE"];
    const EXTRA = { 0: ["TRIBE", "SEX"] };
    const OBJS = [
      { n: "Food from your storage pit", s: "storage pit", a: { ALLEGIANCE: 0, ANIMATE: 0, TYPE: 2 } },
      { n: "A wild food pile", s: "food pile", a: { ALLEGIANCE: 1, ANIMATE: 0, TYPE: 3 } },
      { n: "A sheep from your town", s: "your sheep", a: { ALLEGIANCE: 0, ANIMATE: 1, TYPE: 1 } },
      { n: "A wild wolf", s: "wolf", a: { ALLEGIANCE: 1, ANIMATE: 1, TYPE: 1 } },
      { n: "Your villager, a Celtic man", s: "your man", a: { ALLEGIANCE: 0, ANIMATE: 1, TYPE: 0, TRIBE: 0, SEX: 0 } },
      { n: "Your villager, a Celtic woman", s: "your woman", a: { ALLEGIANCE: 0, ANIMATE: 1, TYPE: 0, TRIBE: 0, SEX: 1 } },
      { n: "A rival villager, a Norse man", s: "rival man", a: { ALLEGIANCE: 1, ANIMATE: 1, TYPE: 0, TRIBE: 1, SEX: 0 } },
    ];
    const stepIdx = (f) => { for (let k = 0; k < 11; k++) if (Math.abs(f - SCALE[k]) <= 0.25 + 1e-9) return k; return 5; };
    const log2 = (x) => Math.log(x) / Math.LN2;
    const H = (ps) => ps.reduce((a, p) => (p > 0 ? a - p * log2(p) : a), 0);
    function ent(list) {
      if (!list.length) return 0;
      const n = list.length, cnt = {};
      let pos = 0;
      list.forEach((e) => { if (e.f >= 0) pos++; const k = stepIdx(e.f); cnt[k] = (cnt[k] || 0) + 1; });
      return (2 * H([pos / n, (n - pos) / n]) + H(Object.values(cnt).map((c) => c / n))) / 3;
    }
    // The parts of the gain ratio, also shown by the step-by-step figure.
    function score(list, at) {
      const n = list.length, h0 = ent(list);
      if (list.some((e) => e.o.a[at] === undefined)) return { groups: [], rem: h0, split: 0, ratio: 0 };
      let rem = 0, split = 0;
      const groups = [];
      for (let v = 0; v < ATTR[at].r; v++) {
        const sub = list.filter((e) => e.o.a[at] === v);
        if (!sub.length) continue;
        const p = sub.length / n;
        groups.push({ v, sub, h: ent(sub) });
        rem += p * ent(sub);
        split -= p * log2(p);
      }
      return { groups, rem, split, ratio: (h0 - rem) / Math.max(split, 1) };
    }
    const mean = (l) => l.reduce((a, e) => a + e.f, 0) / l.length;
    function build(list, cands, parent) {
      const own = list.length ? list : parent;
      const node = { list, val: own && own.length ? SCALE[stepIdx(mean(own))] : 0 };
      if (!list.length || !cands.length || ent(list) < 0.01) { node.leaf = true; return node; }
      let best = null, bg = 0;
      cands.forEach((a) => { const g = score(list, a).ratio; if (g > bg + 1e-12) { bg = g; best = a; } });
      if (!best) { node.leaf = true; return node; }
      node.attr = best;
      node.kids = [];
      for (let v = 0; v < ATTR[best].r; v++) {
        let nc = cands.filter((a) => a !== best);
        if (best === "TYPE" && EXTRA[v]) nc = nc.concat(EXTRA[v]);
        const k = build(list.filter((e) => e.o.a[best] === v), nc, own);
        k.v = v;
        node.kids.push(k);
      }
      return node;
    }
    function evalTree(n, o) { while (n && !n.leaf) { const k = n.kids[o.a[n.attr]]; if (!k) break; n = k; } return n ? n.val : 0; }
    const leaf = (v) => `<span class="leaf ${v > 0 ? "pos" : v < 0 ? "neg" : "zero"}">${v > 0 ? "good " : v < 0 ? "bad " : ""}${v >= 0 ? "+" : ""}${v.toFixed(1)}</span>`;
    const vname = (at, v) => (ATTR[at].names[v] !== undefined ? ATTR[at].names[v] : "value " + v);
    function html(n) {
      if (n.leaf) return leaf(n.val);
      let out = `<span class="q">${ATTR[n.attr].q}</span><ul>`;
      let empty = 0;
      n.kids.forEach((k) => {
        if (!k.list.length) { empty++; return; }
        out += `<li><span class="a">${vname(n.attr, k.v)} →</span> ${html(k)}</li>`;
      });
      if (empty) out += `<li><span class="a">anything not seen yet →</span> ${leaf(n.val)}</li>`;
      return out + "</ul>";
    }
    const chip = (e) => `<span class="${e.f >= 0 ? "pos" : "neg"}">${e.o.s} ${e.f >= 0 ? "+" : ""}${e.f.toFixed(1)}</span>`;
    return { ATTR, ROOT, OBJS, ent, score, build, evalTree, html, vname, chip };
  })();

  function treeFigure(root) {
    const { ROOT, OBJS, build, evalTree, html, chip } = DT;
    root.insertAdjacentHTML("beforeend", `
      <div class="cai-row"><label for="cai-t-obj">The creature ate</label><select id="cai-t-obj"></select></div>
      <div class="cai-row"><button class="good" data-f="0.5">Stroke</button><button class="good" data-f="1">Stroke a lot</button><button class="bad" data-f="-0.5">Slap</button><button class="bad" data-f="-1">Slap a lot</button><button id="cai-t-reset">Forget all</button></div>
      <p><b>Examples it keeps</b> <span class="cai-note">(newest first, 16 at most)</span></p><div class="chips" id="cai-t-ex"></div>
      <div class="grid2"><div><p><b>The tree</b></p><div class="tree" id="cai-t-tree"></div></div>
      <div><p><b>How good each food looks</b></p><div id="cai-t-use"></div></div></div>`);
    const sel = $("cai-t-obj");
    OBJS.forEach((o, i) => sel.insertAdjacentHTML("beforeend", `<option value="${i}">${o.n}</option>`));
    let ex = [];
    const useful = (u) => clamp(u >= 0 ? 0.1 + 0.9 * u : 0.1 * (u + 1), 0, 0.125);
    function redraw() {
      const tree = ex.length ? build(ex, ROOT.slice(), null) : null;
      $("cai-t-tree").innerHTML = tree ? "<ul><li>" + html(tree) + "</li></ul>" : '<span class="cai-note">No examples. Every food looks the same: 0.100.</span>';
      $("cai-t-ex").innerHTML = ex.length ? ex.map(chip).join("") : "<span>none yet</span>";
      $("cai-t-use").innerHTML = OBJS.map((o) => {
        const u = useful(tree ? evalTree(tree, o) : 0);
        const col = u < 0.1 ? "#eb6b6b" : u > 0.1 ? "#6fcf97" : "#f2b84b";
        return `<div class="bar-row"><span>${o.s}</span><div class="bar"><i style="width:${u / 0.125 * 100}%;background:${col}"></i></div><span>${u.toFixed(3)}</span></div>`;
      }).join("");
    }
    root.querySelectorAll("button[data-f]").forEach((b) => b.addEventListener("click", () => {
      // When the list is full, the newest example before this one goes.
      if (ex.length > 15) ex.shift();
      ex.unshift({ o: OBJS[+sel.value], f: +b.getAttribute("data-f") });
      redraw();
    }));
    $("cai-t-reset").addEventListener("click", () => { ex = []; redraw(); });
    redraw();
  }

  // ---------- Part 3: building a tree, step by step ----------
  function buildFigure(root) {
    const { ROOT, OBJS, ATTR, ent, score, build, html, chip, vname } = DT;
    const ex = [
      { o: OBJS[0], f: -0.5 },
      { o: OBJS[2], f: 0.5 },
      { o: OBJS[3], f: 0.5 },
      { o: OBJS[4], f: -1 },
    ];
    const tree = build(ex, ROOT.slice(), null);
    const h0 = ent(ex);
    const scores = ROOT.map((a) => ({ a, ...score(ex, a) }));
    const best = scores.reduce((b, s) => (s.ratio > b.ratio + 1e-12 ? s : b));
    const groupTxt = (s) => s.groups.map((g) => `<b>${vname(s.a, g.v)}:</b> <span class="chips">${g.sub.map(chip).join("")}</span> <span class="cai-note">mix ${g.h.toFixed(2)}</span>`).join("<br>");
    const steps = [
      `<p><b>Step 1. Start with all the examples.</b></p><div class="chips">${ex.map(chip).join("")}</div>
       <p>Two are good and two are bad. How mixed is this group? Its entropy is <span class="cai-val">${h0.toFixed(2)}</span>. "Good or bad" counts for two thirds of this number. "How good or how bad" counts for one third.</p>`,
      ...scores.map((s, k) => `<p><b>Step ${k + 2}. Try the question "${ATTR[s.a].q}"</b></p><p>${groupTxt(s)}</p>
       <p>The average mix after the question is <span class="cai-val">${s.rem.toFixed(2)}</span>. So the question removes ${(h0 - s.rem).toFixed(2)} of the mix.
       ${s.split > 1 ? `It makes ${s.groups.length} groups, so the game divides by ${s.split.toFixed(2)} as a penalty.` : "It makes only two groups, so there is no penalty."}
       Score: <span class="cai-val">${s.ratio.toFixed(3)}</span>.</p>`),
      `<p><b>Step ${scores.length + 2}. Choose the best question.</b></p><p>${scores.map((s) => `${ATTR[s.a].q} <span class="cai-val">${s.ratio.toFixed(3)}</span>`).join("<br>")}</p>
       <p>"${ATTR[best.a].q}" has the highest score. It becomes the first question. Then the game does the same again inside each branch that is still mixed. A branch that is not mixed becomes an answer: the average lesson of its examples, rounded to a step of 0.2.</p>`,
      `<p><b>Step ${scores.length + 3}. The finished tree.</b></p><div class="tree"><ul><li>${html(tree)}</li></ul></div>
       <p>A new object goes down the tree in the same way. If it comes to a branch with no examples, it gets the average answer of the question above that branch.</p>`,
    ];
    root.insertAdjacentHTML("beforeend", `<div id="cai-b-body"></div><div class="cai-row"><button id="cai-b-prev">Back</button><button id="cai-b-next">Next step</button><span class="cai-note" id="cai-b-pos"></span></div>`);
    let i = 0;
    const draw = () => { $("cai-b-body").innerHTML = steps[i]; $("cai-b-pos").textContent = `${i + 1} of ${steps.length}`; };
    $("cai-b-next").addEventListener("click", () => { i = Math.min(steps.length - 1, i + 1); draw(); });
    $("cai-b-prev").addEventListener("click", () => { i = Math.max(0, i - 1); draw(); });
    draw();
  }

  // ---------- Part 3: usefulness ----------
  function usefulFigure(root) {
    const s = svg(root, 640, 250, "How the tree's verdict turns into a score. Unknown is 0.100. Good stops at 0.125. Bad goes down to 0.");
    const L = 60, R = 600, T = 20, Bt = 200;
    const X = (u) => L + (u + 1) / 2 * (R - L), Y = (v) => Bt - v / 0.14 * (Bt - T);
    [0, 0.05, 0.1, 0.125].forEach((v) => {
      s.appendChild(el("line", { x1: L, x2: R, y1: Y(v), y2: Y(v), class: "s-grid" }));
      s.appendChild(el("text", { x: L - 6, y: Y(v) + 4, "text-anchor": "end", class: "s-txt" }, v.toFixed(3)));
    });
    [-1, -0.5, 0, 0.5, 1].forEach((u) => s.appendChild(el("text", { x: X(u), y: Bt + 18, "text-anchor": "middle", class: "s-txt" }, u)));
    s.appendChild(el("line", { x1: L, x2: R, y1: Bt, y2: Bt, class: "s-axis" }));
    let p = "";
    for (let i = 0; i <= 200; i++) {
      const u = -1 + i / 100;
      const v = clamp(u >= 0 ? 0.1 + 0.9 * u : 0.1 * (u + 1), 0, 0.125);
      p += (i ? "L" : "M") + X(u).toFixed(1) + " " + Y(v).toFixed(1) + " ";
    }
    s.appendChild(el("path", { d: p, class: "s-curve" }));
    s.appendChild(el("circle", { cx: X(0), cy: Y(0.1), r: 5, fill: "#6fa8ff" }));
    s.appendChild(el("text", { x: X(0) + 12, y: Y(0.1) + 20, class: "s-txt" }, "not known yet: 0.100"));
    s.appendChild(el("text", { x: X(0.6), y: Y(0.125) - 8, "text-anchor": "middle", class: "s-txt" }, "good: never more than 0.125"));
    s.appendChild(el("text", { x: X(-0.45), y: Y(0.055) + 26, class: "s-txt" }, "bad: down to 0"));
    s.appendChild(el("text", { x: (L + R) / 2, y: Bt + 40, "text-anchor": "middle", class: "s-txt" }, "what the tree says (−1 bad, +1 good)"));
  }

  // ---------- Part 3: miracle sightings ----------
  function miracleFigure(root) {
    const rows = SPECIES.map((s) => [s.n, s.miracle]).sort((a, b) => a[1] - b[1]);
    root.insertAdjacentHTML("beforeend", rows.map((r) => `<div class="bar-row"><span>${r[0]}</span><div class="bar"><i style="width:${r[1] / 4.27 * 100}%"></i></div><span>×${r[1]}</span></div>`).join(""));
  }

  // ---------- Part 3: the kind of creature ----------
  function speciesFigure(root) {
    const TRAITS = [
      // name, desire it pushes, threshold, growth time in seconds, desire maximum
      { n: "Kindness", d: "Compassion", th: 0.5, t: 5, max: 0.8 },
      { n: "Aggression", d: null },
      { n: "Lethargy", d: "Tiredness", th: 0.95, t: 2, max: 2.0 },
      { n: "Friendliness", d: "Desire to be friends", th: 0.5, t: 15, max: 0.85 },
      { n: "Communicativeness", d: "Desire to show feelings", th: 0.5, t: 8, max: 0.45 },
    ];
    root.insertAdjacentHTML("beforeend", `
      <div class="cai-row"><label for="cai-sp-sel">Species</label><select id="cai-sp-sel"></select>
        <button id="cai-sp-born">A new creature is born</button><button id="cai-sp-base">Species values</button></div>
      <div id="cai-sp-bars"></div>
      <p><b>With only its trait to push it, how long until the desire is full?</b></p>
      <div id="cai-sp-times"></div>
      <p class="cai-note" id="cai-sp-msg"></p>`);
    const sel = $("cai-sp-sel");
    SPECIES.forEach((s, i) => sel.insertAdjacentHTML("beforeend", `<option value="${i}">${s.n}</option>`));
    sel.value = 2;
    // The game clamps each trait with a macro that draws a new random number each time it reads the value.
    function draw(base) {
      const x = () => base + Math.random() * 0.2 - 0.1;
      if (x() > 0 && x() >= 1) return 1;
      if (x() <= 0) return 0;
      return x();
    }
    const fmt = (min) => (!isFinite(min) ? "never" : min < 90 ? `${Math.round(min)} min` : `${(min / 60).toFixed(min < 600 ? 1 : 0)} hours`);
    function show(vals, born) {
      $("cai-sp-bars").innerHTML = TRAITS.map((t, k) => `<div class="bar-row"><span>${t.n}</span><div class="bar"><i style="width:${clamp(vals[k], 0, 1) / 0.35 * 100}%"></i></div><span>${vals[k].toFixed(2)}</span></div>`).join("");
      $("cai-sp-times").innerHTML = TRAITS.filter((t) => t.d && t.n !== "Lethargy").map((t) => {
        const k = TRAITS.indexOf(t);
        const perTurn = sig(t.th, vals[k]) / (10 * t.t);
        const min = perTurn > 0 ? t.max / perTurn / 10 / 60 : Infinity;
        const w = isFinite(min) ? clamp(1 - Math.log10(Math.max(min, 1)) / Math.log10(3000), 0.02, 1) : 0;
        return `<div class="bar-row"><span>${t.d}</span><div class="bar"><i style="width:${w * 100}%"></i></div><span>${fmt(min)}</span></div>`;
      }).join("");
      $("cai-sp-msg").textContent = born
        ? "Each new creature gets its species' values plus a small random change. Click again for another creature."
        : "These are the species' values. A longer bar means a faster desire.";
    }
    const base = () => SPECIES[+sel.value].traits;
    sel.addEventListener("change", () => show(base(), false));
    $("cai-sp-base").addEventListener("click", () => show(base(), false));
    $("cai-sp-born").addEventListener("click", () => show(base().map(draw), true));
    show(base(), false);
  }

  const figures = {
    "cai-loop": loopFigure, "cai-sigmoid": sigmoidFigure, "cai-why": whyFigure,"cai-desires": desireFigure,
    "cai-pipeline": pipelineFigure, "cai-distance": distanceFigure, "cai-switch": switchFigure, "cai-agenda": agendaFigure,
    "cai-hand": handFigure, "cai-credit": creditFigure, "cai-tree": treeFigure, "cai-build": buildFigure, "cai-useful": usefulFigure, "cai-miracle": miracleFigure, "cai-species": speciesFigure,
  };
  function init() { for (const id in figures) { const r = $(id); if (r) figures[id](r); } }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
