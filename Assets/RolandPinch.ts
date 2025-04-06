import { PinchButton} from "SpectaclesInteractionKit/Components/UI/PinchButton/PinchButton";

@component
export class NewScript extends BaseScriptComponent {
    onAwake() {
        this.createEvent("OnStartEvent").bind(() => {
            this.onStart();
        })
    }
    
    onStart() {
        print("Button Script")
        let pinchButton = this.sceneObject.getComponent(
            PinchButton.getTypeName()
        );
        
        let onButtonPinchedCallback = () => {
            print("Button pinched");
        }
        
        pinchButton.onButtonPinched.add(onButtonPinchedCallback);
    }
}
