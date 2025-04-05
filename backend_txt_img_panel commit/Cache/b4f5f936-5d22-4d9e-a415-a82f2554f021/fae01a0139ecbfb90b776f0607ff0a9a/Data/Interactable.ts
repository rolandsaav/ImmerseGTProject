// button.js
// @input Component.ScriptComponent interactableScript

script.api.onButtonPinched = new global.SignalEvent();

function setup() {
    if (!script.interactableScript) {
        print("❌ Interactable script not assigned!");
        return;
    }
    
    // Connect to the interactable's trigger event
    if (script.interactableScript.api.onTriggerStart) {
        script.interactableScript.api.onTriggerStart.add(function(eventArgs) {
            print("Button triggered, firing onButtonPinched event");
            script.api.onButtonPinched.trigger();
        });
        print("✅ Successfully connected to interactable events");
    } else {
        print("❌ onTriggerStart not found on interactable");
    }
}

var startEvent = script.createEvent("OnStartEvent");
startEvent.bind(setup);