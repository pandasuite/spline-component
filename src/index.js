import PandaBridge from "pandasuite-bridge";
import { Application } from "@splinetool/runtime";

import map from "lodash/map";
import flatten from "lodash/flatten";
import keyBy from "lodash/keyBy";
import find from "lodash/find";
import each from "lodash/each";

import "./index.css";

let spline = null;
let properties = null;

function getMarkersFromSplineEvents() {
  const splineObjects = keyBy(spline.getAllObjects(), "uuid");
  const splineEvents = spline.getSplineEvents();

  return flatten(
    map(splineEvents, (value, eventName) => {
      return map(value, (_event, uid) => {
        return {
          id: `${eventName}_${uid}`,
          event: eventName,
          uid,
          name: splineObjects[uid].name,
          type: "event",
        };
      });
    }),
  );
}

function getPropertiesFromSplineVariables() {
  const splineVariables = spline.getVariables();
  let i = 0;

  const getType = (value) => {
    if (typeof value === "number") {
      return "Float";
    }
    if (typeof value === "boolean") {
      return "Boolean";
    }
    return "String";
  };

  return map(splineVariables, (value, key) => ({
    id: key,
    name: key,
    type: getType(value),
    value,
    separator: i++ === 0,
    bindable: true,
    __ps_create: true,
  }));
}

function setupSplineEventsListeners() {
  each(spline.getSplineEvents(), (_value, eventName) => {
    spline.addEventListener(eventName, (e) => {
      PandaBridge.send(
        PandaBridge.TRIGGER_MARKER,
        `${eventName}_${e.target.id}`,
      );
    });
  });
}

function updateSplineVariablesFromProperties() {
  const splineVariables = spline.getVariables();

  each(properties, (value, key) => {
    if (splineVariables[key] && splineVariables[key] !== value) {
      spline.setVariable(key, value);
    }
  });
}

function initSpline() {
  const sceneUrl = `${PandaBridge.resolvePath("assets.zip", "./")}${
    properties.path
  }`;

  const canvas = document.getElementById("canvas3d");

  spline = new Application(canvas);
  spline
    .load(sceneUrl)
    .then(() => {
      setupSplineEventsListeners();
      updateSplineVariablesFromProperties();

      if (PandaBridge.isStudio) {
        PandaBridge.unlisten(PandaBridge.GET_SCREENSHOT);
        PandaBridge.getScreenshot((resultCallback) => {
          resultCallback(canvas.toDataURL());
        });

        PandaBridge.send(PandaBridge.UPDATED, {
          properties: getPropertiesFromSplineVariables(),
          markers: getMarkersFromSplineEvents(),
        });
      }

      PandaBridge.send(PandaBridge.INITIALIZED);
      PandaBridge.send("sceneLoaded");
    })
    .catch((error) => {
      console.error(error);
      PandaBridge.send("sceneError");
    });
}

PandaBridge.init(() => {
  PandaBridge.onLoad((pandaData) => {
    properties = pandaData.properties;

    if (document.readyState === "complete") {
      initSpline();
    } else {
      document.addEventListener("DOMContentLoaded", initSpline, false);
    }
  });

  PandaBridge.onUpdate((pandaData) => {
    properties = pandaData.properties;
    updateSplineVariablesFromProperties();
  });

  /* Markers */

  PandaBridge.getSnapshotData(() => null);

  PandaBridge.setSnapshotData(({ data, params }) => {
    if (spline && data?.type === "event") {
      const splineObject = find(
        spline.getAllObjects(),
        (obj) => obj.uuid === data.uid,
      );
      if (splineObject) {
        if (params?.reverse) {
          splineObject.emitEventReverse(data.event);
        } else {
          splineObject.emitEvent(data.event);
        }
      }
    }
  });

  /* Actions */

  PandaBridge.listen("play", () => {
    if (spline) {
      spline.play();
    }
  });

  PandaBridge.listen("stop", () => {
    if (spline) {
      spline.stop();
    }
  });

  /* Synchronization */

  PandaBridge.synchronize("first", (percent) => {
    if (spline) {
      spline.setVariable("__ps_sync_first", percent / 100);
    }
  });

  PandaBridge.synchronize("second", (percent) => {
    if (spline) {
      spline.setVariable("__ps_sync_second", percent / 100);
    }
  });

  PandaBridge.synchronize("third", (percent) => {
    if (spline) {
      spline.setVariable("__ps_sync_third", percent / 100);
    }
  });
});
