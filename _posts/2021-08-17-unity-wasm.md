---
layout: single
title:  "Unity web assembly test"
date:   2021-08-17 18:34:18 +0100
categories: jekyll update
---

Unity web support is pretty good

<div id="unity-container" class="unity-desktop">
  <canvas id="unity-canvas"></canvas>
  <div id="unity-loading-bar">
	<div id="unity-logo"></div>
	<div id="unity-progress-bar-empty">
	  <div id="unity-progress-bar-full"></div>
	</div>
  </div>
</div>
<script>
  var buildUrl = "/assets/unity/creature_sim/build";
  var loaderUrl = buildUrl + "/build.loader.js";
  var config = {
	dataUrl: buildUrl + "/build.data",
	frameworkUrl: buildUrl + "/build.framework.js",
	codeUrl: buildUrl + "/build.wasm",
	streamingAssetsUrl: "StreamingAssets",
	companyName: "AAB",
	productName: "Creature Sim",
	productVersion: "0.1",
  };

  var container = document.querySelector("#unity-container");
  var canvas = document.querySelector("#unity-canvas");
  var loadingBar = document.querySelector("#unity-loading-bar");
  var progressBarFull = document.querySelector("#unity-progress-bar-full");
  var fullscreenButton = document.querySelector("#unity-fullscreen-button");
  var mobileWarning = document.querySelector("#unity-mobile-warning");

  // By default Unity keeps WebGL canvas render target size matched with
  // the DOM size of the canvas element (scaled by window.devicePixelRatio)
  // Set this to false if you want to decouple this synchronization from
  // happening inside the engine, and you would instead like to size up
  // the canvas DOM size and WebGL render target sizes yourself.
  // config.matchWebGLToCanvasSize = false;

  canvas.style.width = "960px";
  canvas.style.height = "600px";
  var script = document.createElement("script");
  script.src = loaderUrl;
  script.onload = () => {
	createUnityInstance(canvas, config, (progress) => {
	  progressBarFull.style.width = 100 * progress + "%";
	}).then((unityInstance) => {
	  loadingBar.style.display = "none";
	}).catch((message) => {
	  alert(message);
	});
  };
  document.body.appendChild(script);
</script>
