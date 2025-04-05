/**
 * ## Anchors
 * Define and track poses in world space.
 */

import {
  SpatialPersistence,
  AreaDeactivatedEvent,
} from "./SpatialPersistence/SpatialPersistence";
import { AnchorSession, AnchorSessionOptions } from "./AnchorSession";
/**
 * Create, scan for, save and delete Anchors.
 */
@component
export class AnchorModule extends BaseScriptComponent {
  /**
   * Storage context for anchors.
   */
  @input storage: LocationCloudStorageModule;

  // temporary
  @input connectedLensModule: ConnectedLensModule;
  @input useLocalStorage: boolean = true;
  @input debug: boolean = true;

  private _spatialPersistence: SpatialPersistence;
  private _session?: AnchorSession;

  static theSpatialPersistenceFactory?: () => SpatialPersistence; // for mocking dependency injection

  /**
   * Open a session for scanning for anchors in the area.
   */
  async openSession(options: AnchorSessionOptions): Promise<AnchorSession> {
    await this._haveInitialized;

    if (this._session) {
      throw new Error("Only one session may be active at a time.");
    }
    this._spatialPersistence.selectArea(null);

    this._session = new AnchorSession(
      options,
      this._spatialPersistence,
      async (session: AnchorSession): Promise<void> => {
        await this.onClosed(session);
      },
    );

    return this._session;
  }

  // implementation details
  onAwake() {
    this._spatialPersistence =
      AnchorModule.theSpatialPersistenceFactory !== undefined
        ? AnchorModule.theSpatialPersistenceFactory()
        : new SpatialPersistence(
            this.storage,
            this.connectedLensModule,
            this.useLocalStorage,
            20, // mappingInterval
            0.5, // resetDelayInS
            this.debug,
            true, // incrementalMapping
            false, // enableLoggingPoseSettling
          );

    this._spatialPersistence.awake(this.sceneObject, this);
  }

  private async onClosed(session: AnchorSession) {
    return await new Promise<void>((resolve, reject) => {
      let registration = this._spatialPersistence.onAreaDeactivated.add(
        (areaDeactivatedEvent: AreaDeactivatedEvent) => {
          this._spatialPersistence.onAreaDeactivated.remove(registration);
          resolve();
        },
      );
      this._spatialPersistence.selectArea(null);
      this._session = undefined;
    });
  }
    
  //Updating the anchors logic
  

  _initialized?: Promise<void>;
  private get _haveInitialized(): Promise<void> {
    if (!this._initialized) {
      const waitForInitialization = async (): Promise<void> => {
        await this._spatialPersistence.initialize();
      };
      this._initialized = waitForInitialization();
    }
    return this._initialized;
  }
}
