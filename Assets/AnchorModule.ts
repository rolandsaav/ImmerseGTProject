import {
  AnchorSession,
  AnchorSessionOptions,
} from './Spatial Anchors/AnchorSession';

import { Anchor } from './Spatial Anchors/Anchor';
import { AnchorComponent } from './Spatial Anchors/AnchorComponent';
import { AnchorModule } from './Spatial Anchors/AnchorModule';
import { PinchButton } from './SpectaclesInteractionKit/Components/UI/PinchButton/PinchButton';

@component
export class AnchorPlacementController extends BaseScriptComponent {
  @input anchorModule: AnchorModule;
  @input createAnchorButton: PinchButton;

  @input camera: SceneObject;
  @input prefab: ObjectPrefab;

  private anchorSession?: AnchorSession;

  async onAwake() {
    this.createEvent('OnStartEvent').bind(() => {
      this.onStart();
    });
  }

  async onStart() {
    this.createAnchorButton.onButtonPinched.add(() => {
      this.createAnchor();
    });

    // Set up the AnchorSession options to scan for World Anchors
    const anchorSessionOptions = new AnchorSessionOptions();
    anchorSessionOptions.scanForWorldAnchors = true;

    // Start scanning for anchors
    this.anchorSession =
      await this.anchorModule.openSession(anchorSessionOptions);

    // Listen for nearby anchors
    this.anchorSession.onAnchorNearby.add(this.onAnchorNearby.bind(this));
  }

  public onAnchorNearby(anchor: Anchor) {
    print('Anchor found: ' + anchor.id);
    this.attachNewObjectToAnchor(anchor);
  }

  private async createAnchor() {
    // Compute the anchor position 5 units in front of user
    let toWorldFromDevice = this.camera.getTransform().getWorldTransform();
    let anchorPosition = toWorldFromDevice.mult(
      mat4.fromTranslation(new vec3(0, 0, -5))
    );

    // Create the anchor
    let anchor = await this.anchorSession.createWorldAnchor(anchorPosition);

    // Create the object and attach it to the anchor
    this.attachNewObjectToAnchor(anchor);

    // Save the anchor so it's loaded in future sessions
    try {
      this.anchorSession.saveAnchor(anchor);
    } catch (error) {
      print('Error saving anchor: ' + error);
    }
  }

  private attachNewObjectToAnchor(anchor: Anchor) {
    // Create a new object from the prefab
    let object: SceneObject = this.prefab.instantiate(this.getSceneObject());
    object.setParent(this.getSceneObject());

    // Associate the anchor with the object by adding an AnchorComponent to the
    // object and setting the anchor in the AnchorComponent.
    let anchorComponent = object.createComponent(
      AnchorComponent.getTypeName()
    ) as AnchorComponent;
    anchorComponent.anchor = anchor;
  }
}
