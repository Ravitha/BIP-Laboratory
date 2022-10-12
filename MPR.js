import "vtk.js/Sources/favicon";
// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import "vtk.js/Sources/Rendering/Profiles/All";
import vtkActor from "vtk.js/Sources/Rendering/Core/Actor";
import vtkAnnotatedCubeActor from "vtk.js/Sources/Rendering/Core/AnnotatedCubeActor";
import vtkDataArray from "vtk.js/Sources/Common/Core/DataArray";
import vtkHttpDataSetReader from "vtk.js/Sources/IO/Core/HttpDataSetReader";
import vtkGenericRenderWindow from "vtk.js/Sources/Rendering/Misc/GenericRenderWindow";
import vtkImageData from "vtk.js/Sources/Common/DataModel/ImageData";
import vtkImageMapper from "vtk.js/Sources/Rendering/Core/ImageMapper";
import vtkImageReslice from "vtk.js/Sources/Imaging/Core/ImageReslice";
import vtkImageSlice from "vtk.js/Sources/Rendering/Core/ImageSlice";
import vtkInteractorStyleImage from "vtk.js/Sources/Interaction/Style/InteractorStyleImage";
import vtkInteractorStyleTrackballCamera from "vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera";
import vtkMapper from "vtk.js/Sources/Rendering/Core/Mapper";
import vtkOutlineFilter from "vtk.js/Sources/Filters/General/OutlineFilter";
import vtkOrientationMarkerWidget from "vtk.js/Sources/Interaction/Widgets/OrientationMarkerWidget";
import vtkResliceCursorWidget from "vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget";
import vtkWidgetManager from "vtk.js/Sources/Widgets/Core/WidgetManager";
import vtkLineWidget from "vtk.js/Sources/Widgets/Widgets3D/LineWidget";

import vtkSphereSource from "vtk.js/Sources/Filters/Sources/SphereSource";
import {
  CaptureOn,
  ViewTypes
} from "vtk.js/Sources/Widgets/Core/WidgetManager/Constants";

import { vec3 } from "gl-matrix";
import { SlabMode } from "vtk.js/Sources/Imaging/Core/ImageReslice/Constants";

import { xyzToViewType } from "vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/Constants";
import "vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper";


const containers = ['#axial', '#sagittal', '#coronal']
const viewColors = [
  [1, 0, 0], // sagittal
  [0, 1, 0], // coronal
  [0, 0, 1], // axial
  [0.5, 0.5, 0.5] // 3D
];

let view3D = null;
const objArr = [];
var showDebugActors = true
const viewAttributes = [];

/******************Create Widget*******************/
const widget = vtkResliceCursorWidget.newInstance();
const widgetState = widget.getWidgetState();
widgetState.setKeepOrthogonality(false);
widgetState.setOpacity(0.6); 
widgetState.setSphereRadius(10); 
widgetState.setLineThickness(5);
/**************************************************/

/******Function to Create Synthetic Data**********/
function createSyntheticImageData(dims) {
    const imageData = vtkImageData.newInstance();
    const newArray = new Uint8Array(dims[0] * dims[1] * dims[2]);
    const s = 1;
    imageData.setSpacing(s, s, s);
    imageData.setExtent(0, 127, 0, 127, 0, 127);
    let i = 0;
    
    for (let z = 0; z < dims[2]; z++) {
        for (let y = 0; y < dims[1]; y++) {
            for (let x = 0; x < dims[0]; x++) {
                newArray[i++] = (256 * (i % (dims[0] * dims[1]))) / (dims[0] * dims[1]);
            }
        }
    }

    const da = vtkDataArray.newInstance({
            numberOfComponents: 1,
            values: newArray
    });
    da.setName("scalars");

    imageData.getPointData().setScalars(da);
    return imageData;
}
/****************************************************************************/
for (let i = 0; i < 3; i++) {
  const element = document.querySelector(containers[i]);
  

  const grw = vtkGenericRenderWindow.newInstance();
  grw.setContainer(element);
  grw.resize();
  const obj = {
    renderWindow: grw.getRenderWindow(),
    renderer: grw.getRenderer(),
    GLWindow: grw.getOpenGLRenderWindow(),
    interactor: grw.getInteractor(),
    widgetManager: vtkWidgetManager.newInstance()
  };
  objArr.push(obj);

  obj.renderer.getActiveCamera().setParallelProjection(true);
  obj.renderer.setBackground(...viewColors[i]);
  obj.renderWindow.addRenderer(obj.renderer);
  obj.renderWindow.addView(obj.GLWindow);
  obj.renderWindow.setInteractor(obj.interactor);
  obj.interactor.setView(obj.GLWindow);
  obj.interactor.initialize();
  obj.interactor.bindEvents(element);
  obj.widgetManager.setRenderer(obj.renderer);


    obj.interactor.setInteractorStyle(vtkInteractorStyleImage.newInstance());
    obj.widgetInstance = obj.widgetManager.addWidget(widget, xyzToViewType[i]);
    obj.widgetInstance.setScaleInPixels(true);
    obj.widgetInstance.setRotationHandlePosition(0.75);
    obj.widgetManager.enablePicking();
    // Use to update all renderers buffer when actors are moved
    obj.widgetManager.setCaptureOn(CaptureOn.MOUSE_MOVE);
  
  

  obj.reslice = vtkImageReslice.newInstance();
  obj.reslice.setSlabMode(SlabMode.MEAN);
  obj.reslice.setSlabNumberOfSlices(1);
  obj.reslice.setTransformInputSampling(false);
  obj.reslice.setAutoCropOutput(true);
  obj.reslice.setOutputDimensionality(2);
  obj.resliceMapper = vtkImageMapper.newInstance();
  obj.resliceMapper.setInputConnection(obj.reslice.getOutputPort());
  obj.resliceActor = vtkImageSlice.newInstance();
  obj.resliceActor.setMapper(obj.resliceMapper);
  obj.sphereActors = [];
  obj.sphereSources = [];

  // Create sphere for each 2D views which will be displayed in 3D
  // Define origin, point1 and point2 of the plane used to reslice the volume
  for (let j = 0; j < 3; j++) {
    const sphere = vtkSphereSource.newInstance();
    sphere.setRadius(10);
    const mapper = vtkMapper.newInstance();
    mapper.setInputConnection(sphere.getOutputPort());
    const actor = vtkActor.newInstance();
    actor.setMapper(mapper);
    actor.getProperty().setColor(...viewColors[i]);
    actor.setVisibility(showDebugActors);
    obj.sphereActors.push(actor);
    obj.sphereSources.push(sphere);
  }

 
    viewAttributes.push(obj);
  
}



function updateReslice(
  interactionContext = {
    viewType: "",
    reslice: null,
    actor: null,
    renderer: null,
    resetFocalPoint: false, // Reset the focal point to the center of the display image
    keepFocalPointPosition: false, // Defines if the focal point position is kepts (same display distance from reslice cursor center)
    computeFocalPointOffset: false, // Defines if the display offset between reslice center and focal point has to be
    // computed. If so, then this offset will be used to keep the focal point position during rotation.
    spheres: null
  }
) {
  const obj = widget.updateReslicePlane(
    interactionContext.reslice,
    interactionContext.viewType
  );
  console.log("hello", obj.modified);
  if (obj.modified) {
    // Get returned modified from setter to know if we have to render
    interactionContext.actor.setUserMatrix(
      interactionContext.reslice.getResliceAxes()
    );
    interactionContext.sphereSources[0].setCenter(...obj.origin);
    interactionContext.sphereSources[1].setCenter(...obj.point1);
    interactionContext.sphereSources[2].setCenter(...obj.point2);
  }

  widget.updateCameraPoints(
    interactionContext.renderer,
    interactionContext.viewType,
    interactionContext.resetFocalPoint,
    interactionContext.keepFocalPointPosition,
    interactionContext.computeFocalPointOffset
  );

  return obj.modified;
}

      const image = createSyntheticImageData([256,256,256]);
      widget.setImage(image);
      viewAttributes.forEach((obj, i) => {
        obj.reslice.setInputData(image);
        obj.renderer.addActor(obj.resliceActor);
        

        obj.sphereActors.forEach((actor) => {
          obj.renderer.addActor(actor);
        });

        const reslice = obj.reslice;
        const viewType = xyzToViewType[i];
        
        viewAttributes
          .forEach((v) => {
            v.widgetInstance.onInteractionEvent(
              ({ computeFocalPointOffset, canUpdateFocalPoint }) => {
                const activeViewType = widget
                  .getWidgetState()
                  .getActiveViewType();
                const keepFocalPointPosition =
                  activeViewType !== viewType && canUpdateFocalPoint;
                updateReslice({
                  viewType,
                  reslice,
                  actor: obj.resliceActor,
                  renderer: obj.renderer,
                  resetFocalPoint: false,
                  keepFocalPointPosition,
                  computeFocalPointOffset,
                  sphereSources: obj.sphereSources
                });
              }
            );
          });
          
        updateReslice({
          viewType,
          reslice,
          actor: obj.resliceActor,
          renderer: obj.renderer,
          resetFocalPoint: true, // At first initilization, center the focal point to the image center
          keepFocalPointPosition: false, // Don't update the focal point as we already set it to the center of the image
          computeFocalPointOffset: true, // Allow to compute the current offset between display reslice center and display focal point
          sphereSources: obj.sphereSources
        });
        obj.renderWindow.render();
      });
