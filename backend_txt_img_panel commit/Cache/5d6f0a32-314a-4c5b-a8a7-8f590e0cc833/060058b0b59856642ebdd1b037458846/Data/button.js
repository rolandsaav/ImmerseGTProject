// button.js
// @input Component.ScriptComponent interactableComponent

// Create our simplified event system
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

function setup() {
    print("Setting up button...");
    
    if (!script.interactableComponent) {
        print("❌ Interactable component not assigned!");
        return;
    }
    
    // Check what's available on the interactable component
    print("Interactable properties: " + Object.keys(script.interactableComponent).join(", "));
    
    // Try to access the API directly
    if (script.interactableComponent.api) {
        print("API properties: " + Object.keys(script.interactableComponent.api).join(", "));
    }
    
    // Try different approaches to connect to the trigger event
    
    // Approach 1: Direct event binding if possible
    try {
        // This is typically how events are accessed in Lens Studio
        script.interactableComponent.createEvent("OnTriggerStartEvent").bind(function() {
            print("Button triggered via OnTriggerStartEvent");
            script.api.onButtonPinched.trigger();
        });
        print("✅ Connected via createEvent");
    } catch (e) {
        print("Could not connect via createEvent: " + e);
        
        // Approach 2: Try to use the exposed API events from your TypeScript component
        try {
            // Different possible event names based on your TypeScript file
            var possibleEvents = [
                "onTriggerStart", 
                "onInteractorTriggerStart", 
                "OnTriggerStart",
                "OnInteractorTriggerStart"
            ];
            
            var connected = false;
            for (var i = 0; i < possibleEvents.length; i++) {
                var eventName = possibleEvents[i];
                if (script.interactableComponent.api && 
                    script.interactableComponent.api[eventName]) {
                    script.interactableComponent.api[eventName].add(function() {
                        print("Button triggered via " + eventName);
                        script.api.onButtonPinched.trigger();
                    });
                    print("✅ Connected via " + eventName);
                    connected = true;
                    break;
                }
            }
            
            if (!connected) {
                // Approach 3: Last resort - check for events directly on the component
                for (var i = 0; i < possibleEvents.length; i++) {
                    var eventName = possibleEvents[i];
                    if (script.interactableComponent[eventName]) {
                        script.interactableComponent[eventName].add(function() {
                            print("Button triggered via direct " + eventName);
                            script.api.onButtonPinched.trigger();
                        });
                        print("✅ Connected via direct " + eventName);
                        connected = true;
                        break;
                    }
                }
            }
            
            if (!connected) {
                print("❌ Could not find any trigger events to connect to");
            }
        } catch (e2) {
            print("Could not connect via API: " + e2);
        }
    }
}

// Add a TouchEvent as a fallback method to trigger the button
var touchEvent = script.createEvent("TouchStartEvent");
touchEvent.bind(function() {
    print("Button triggered via touch");
    script.api.onButtonPinched.trigger();
});

// Wait until the script is fully initialized
var delayedEvent = script.createEvent("DelayedCallbackEvent");
delayedEvent.bind(function() {
    setup();
});
delayedEvent.reset(0.5); // Wait half a second to make sure everything is loaded