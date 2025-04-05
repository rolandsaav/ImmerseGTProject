// button.js
// @input Component.ScriptComponent interactableScript

// Create our own event system if global.SignalEvent is not available
if (typeof global.SignalEvent === "undefined") {
    script.api.onButtonPinched = {
        _callbacks: [],
        add: function(callback) {
            this._callbacks.push(callback);
        },
        trigger: function() {
            for (var i = 0; i < this._callbacks.length; i++) {
                this._callbacks[i]();
            }
        }
    };
} else {
    script.api.onButtonPinched = new global.SignalEvent();
}

function setup() {
    if (!script.interactableScript) {
        print("❌ Interactable script not assigned!");
        return;
    }
    
    // Connect to the interactable's trigger event
    if (script.interactableScript.api && script.interactableScript.api.onTriggerStart) {
        script.interactableScript.api.onTriggerStart.add(function(eventArgs) {
            print("Button triggered, firing onButtonPinched event");
            script.api.onButtonPinched.trigger();
        });
        print("✅ Successfully connected to interactable events");
    } else {
        print("❌ onTriggerStart not found on interactable");
        print("Available API: " + Object.keys(script.interactableScript.api || {}).join(", "));
    }
}

// Wait until the script is fully initialized
var delayedEvent = script.createEvent("DelayedCallbackEvent");
delayedEvent.bind(function() {
    setup();
});
delayedEvent.reset(0.1);