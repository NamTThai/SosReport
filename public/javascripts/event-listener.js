document.addEventListener("WebComponentsReady", function() {
  var eventListener = document.querySelector(".event-listener");

  eventListener.route = route;

  eventListener.eDrawerItemClick = function(event) {
    var drawer = document.querySelector(".drawer-panel");
    if (drawer.narrow) {
      drawer.closeDrawer();
    }

    var route = event.target.getAttribute("data-route");
    window.history.pushState("", "", "/" + route);
  };

  eventListener.eHeaderTransform = function(event) {
    var appName = document.querySelector('#mainToolbar .app-name');
    var middleContainer = document.querySelector('#mainToolbar .middle-container');
    var bottomContainer = document.querySelector('#mainToolbar .bottom-container');
    var heightDiff = event.detail.height - event.detail.condensedHeight;
    var yRatio = Math.min(1, event.detail.y / heightDiff);
    var maxMiddleScale = 0.50;
    var scaleMiddle = Math.max(maxMiddleScale, (heightDiff - event.detail.y) / (heightDiff / (1 - maxMiddleScale)) + maxMiddleScale);
    var scaleBottom = 1 - yRatio;

    Polymer.Base.transform('translate3d(0,' + yRatio * 100 + '%,0)', middleContainer);
    Polymer.Base.transform('scale(' + scaleBottom + ') translateZ(0)', bottomContainer);
    Polymer.Base.transform('scale(' + scaleMiddle + ') translateZ(0)', appName);
  };
});
