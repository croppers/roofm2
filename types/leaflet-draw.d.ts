import 'leaflet';

declare module 'leaflet' {
  namespace Draw {
    namespace Event {
      const CREATED: string;
      const DELETED: string;
      const EDITED: string;
    }
  }

  namespace DrawEvents {
    interface Created extends LeafletEvent {
      layer: Layer;
      layerType: string;
    }
  }

  namespace Control {
    class Draw extends Control {
      constructor(options?: DrawConstructorOptions);
    }
  }

  interface DrawConstructorOptions {
    position?: string;
    draw?: DrawOptions;
    edit?: EditOptions;
  }

  interface DrawOptions {
    polygon?: DrawPolygonOptions | false;
    polyline?: DrawPolylineOptions | false;
    rectangle?: DrawRectangleOptions | false;
    circle?: DrawCircleOptions | false;
    circlemarker?: DrawCircleMarkerOptions | false;
    marker?: DrawMarkerOptions | false;
  }

  interface DrawPolygonOptions {
    shapeOptions?: PathOptions;
    allowIntersection?: boolean;
  }

  interface DrawPolylineOptions {
    shapeOptions?: PathOptions;
  }

  interface DrawRectangleOptions {
    shapeOptions?: PathOptions;
  }

  interface DrawCircleOptions {
    shapeOptions?: PathOptions;
  }

  interface DrawCircleMarkerOptions {
    shapeOptions?: PathOptions;
  }

  interface DrawMarkerOptions {
    icon?: Icon;
  }

  interface EditOptions {
    featureGroup: FeatureGroup;
    remove?: boolean;
    edit?: boolean;
  }
}
