window.addEventListener("message", (e) => {
  if (e.source !== window) return;
  if (e.data?.type === "rustboom-ext-ping") {
    window.postMessage({ type: "rustboom-ext-pong" }, "*");
  }
});
