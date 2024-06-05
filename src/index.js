import PandaBridge from "pandasuite-bridge";
import { Application } from "@splinetool/runtime";
import "./index.css";

let properties = null;
let markers = null;

function myInit() {
  const sceneUrl = `${PandaBridge.resolvePath("assets.zip", "./")}${
    properties.path
  }`;

  const canvas = document.getElementById("canvas3d");
  const spline = new Application(canvas);
  spline.load(sceneUrl).then(() => {
    console.log(spline.getAllObjects());
    console.log(spline.getSplineEvents());
  });
}

PandaBridge.init(() => {
  PandaBridge.onLoad((pandaData) => {
    properties = pandaData.properties;
    markers = pandaData.markers;

    if (document.readyState === "complete") {
      myInit();
    } else {
      document.addEventListener("DOMContentLoaded", myInit, false);
    }
  });

  PandaBridge.onUpdate((pandaData) => {
    properties = pandaData.properties;
    markers = pandaData.markers;
  });

  /* Markers */

  PandaBridge.getSnapshotData(() => null);

  PandaBridge.setSnapshotData((pandaData) => {
    // pandaData.data.id
  });

  /* Actions */

  PandaBridge.listen("changeColor", (args) => {});

  PandaBridge.synchronize("synchroImages", (percent) => {});
});
