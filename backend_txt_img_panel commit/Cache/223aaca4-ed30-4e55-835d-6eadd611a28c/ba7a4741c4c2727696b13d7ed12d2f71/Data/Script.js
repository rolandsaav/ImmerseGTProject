//@input Asset.RemoteServiceModule remoteServiceModule
//@input Asset.RemoteMediaModule remoteMediaModule
//@input Component.Image notesImage
//@input SceneObject leftButton
//@input SceneObject rightButton

var imageUrls = [];
var currentIndex = 0;

// Deep inspection function to help us debug
function inspectObject(obj, prefix) {
    print(prefix + " type: " + typeof obj);
    
    if (obj === null || obj === undefined) {
        print(prefix + " is null or undefined");
        return;
    }
    
    if (typeof obj === "object") {
        // Print direct properties
        print(prefix + " properties: ");
        for (var prop in obj) {
            try {
                print(prefix + "." + prop + " (" + typeof obj[prop] + ")");
            } catch (e) {
                print(prefix + "." + prop + " (error accessing)");
            }
        }
        
        // Look for api property
        if (obj.api) {
            print(prefix + ".api properties: ");
            for (var apiProp in obj.api) {
                try {
                    print(prefix + ".api." + apiProp + " (" + typeof obj.api[apiProp] + ")");
                } catch (e) {
                    print(prefix + ".api." + apiProp + " (error accessing)");
                }
            }
        }
    }
}

// Check button components
function inspectButtons() {
    print("=== Inspecting Left Button ===");
    if (!script.leftButton) {
        print("Left button object is not assigned");
        return;
    }
    print("Left button exists: " + script.leftButton.name);
    
    // List all components
    var components = script.leftButton.getComponents();
    print("Left button has " + components.length + " components");
    
    for (var i = 0; i < components.length; i++) {
        var comp = components[i];
        print("Component " + i + ": " + comp.getTypeName());
        
        if (comp.getTypeName() === "Component.ScriptComponent") {
            inspectObject(comp, "LeftScript");
        }
    }
    
    print("=== Inspecting Right Button ===");
    if (!script.rightButton) {
        print("Right button object is not assigned");
        return;
    }
    print("Right button exists: " + script.rightButton.name);
    
    // List all components
    components = script.rightButton.getComponents();
    print("Right button has " + components.length + " components");
    
    for (var i = 0; i < components.length; i++) {
        var comp = components[i];
        print("Component " + i + ": " + comp.getTypeName());
        
        if (comp.getTypeName() === "Component.ScriptComponent") {
            inspectObject(comp, "RightScript");
        }
    }
}

async function fetchImageUrls() {
    var url = "https://ar-notes-backend-immersegt-eddf3c030982.herokuapp.com/upload_notes_result";

    var request = new Request(url, {
        method: "GET"
    });

    try {
        var response = await script.remoteServiceModule.fetch(request);
        if (response.status != 200) {
            print("Failed to fetch image URLs, status: " + response.status);
            return;
        }

        var contentType = response.headers.get("Content-Type");
        if (!contentType || !contentType.includes("application/json")) {
            print("Unexpected content type: " + contentType);
            return;
        }

        var json = await response.json();
        imageUrls = json.images;
        print("✅ Loaded " + imageUrls.length + " image URLs");
        
        loadImage(currentIndex);
    } catch (e) {
        print("Error fetching image URLs: " + e);
    }
}

function loadImage(index) {
    if (!imageUrls || imageUrls.length === 0) {
        print("No images available to load");
        return;
    }

    print("Loading image " + (index + 1) + " of " + imageUrls.length);
    var url = imageUrls[index];
    var resource = script.remoteServiceModule.makeResourceFromUrl(url);

    script.remoteMediaModule.loadResourceAsImageTexture(
        resource,
        function(texture) {
            script.notesImage.mainPass.baseTex = texture;
            print("✅ Image loaded successfully");
        },
        function(errorMessage) {
            print("❌ Error loading image: " + errorMessage);
        }
    );
}

function changeImage(direction) {
    print("🔄 Changing image, direction: " + direction);
    
    if (!imageUrls || imageUrls.length === 0) {
        print("No images available to navigate");
        return;
    }
    
    currentIndex += direction;
    if (currentIndex < 0) currentIndex = imageUrls.length - 1;
    if (currentIndex >= imageUrls.length) currentIndex = 0;
    
    print("New index: " + currentIndex);
    loadImage(currentIndex);
}

// Find and connect to buttons using different approaches
function setupButtons() {
    // Approach 1: Try direct component access
    var leftScripts = script.leftButton.getComponents("Component.ScriptComponent");
    print("Found " + leftScripts.length + " script components on left button");
    
    var connected = false;
    
    // Try each script component
    for (var i = 0; i < leftScripts.length; i++) {
        var scriptComp = leftScripts[i];
        try {
            if (scriptComp.api) {
                // Try every property that might be an event
                for (var prop in scriptComp.api) {
                    if (typeof scriptComp.api[prop] === "object" && 
                        scriptComp.api[prop] !== null && 
                        typeof scriptComp.api[prop].add === "function") {
                        
                        print("Found potential event: " + prop);
                        
                        if (prop.toLowerCase().includes("trigger") || 
                            prop.toLowerCase().includes("button") ||
                            prop.toLowerCase().includes("pinch") ||
                            prop.toLowerCase().includes("touch")) {
                            
                            print("✅ Connecting to left button via " + prop);
                            
                            scriptComp.api[prop].add(function() {
                                print("◀️ Left button pressed!");
                                changeImage(-1);
                            });
                            
                            connected = true;
                        }
                    }
                }
            }
        } catch (e) {
            print("Error inspecting left script: " + e);
        }
    }
    
    // Fallback approach: Create our own touch handler
    if (!connected) {
        print("⚠️ Could not find button events, creating touch handler for left button");
        
        // Create a TouchStartEvent on the button
        var touchEvent = script.createEvent("TouchStartEvent");
        touchEvent.bind(function(eventData) {
            // Check if the touch is on the left button
            var target = eventData.getTouchPosition();
            // This is a simplistic approach - in a real app, you'd check screen bounds
            if (target.x < 0.5) {  // If touch is on left side of screen
                print("◀️ Left button touch detected");
                changeImage(-1);
            }
        });
    }
    
    // Repeat for right button with similar approach
    var rightScripts = script.rightButton.getComponents("Component.ScriptComponent");
    print("Found " + rightScripts.length + " script components on right button");
    
    connected = false;
    
    for (var i = 0; i < rightScripts.length; i++) {
        var scriptComp = rightScripts[i];
        try {
            if (scriptComp.api) {
                for (var prop in scriptComp.api) {
                    if (typeof scriptComp.api[prop] === "object" && 
                        scriptComp.api[prop] !== null && 
                        typeof scriptComp.api[prop].add === "function") {
                        
                        print("Found potential event: " + prop);
                        
                        if (prop.toLowerCase().includes("trigger") || 
                            prop.toLowerCase().includes("button") ||
                            prop.toLowerCase().includes("pinch") ||
                            prop.toLowerCase().includes("touch")) {
                            
                            print("✅ Connecting to right button via " + prop);
                            
                            scriptComp.api[prop].add(function() {
                                print("▶️ Right button pressed!");
                                changeImage(1);
                            });
                            
                            connected = true;
                        }
                    }
                }
            }
        } catch (e) {
            print("Error inspecting right script: " + e);
        }
    }
    
    // Fallback for right button
    if (!connected) {
        print("⚠️ Could not find button events, creating touch handler for right button");
        
        // If we already created a touch event for left button, we'll update that logic
        // Otherwise create a new touch event
        var touchExists = false;
        
        for (var i = 0; i < script.getAllEvents().length; i++) {
            var evt = script.getAllEvents()[i];
            if (evt.getEventType() === "TouchStartEvent") {
                touchExists = true;
                break;
            }
        }
        
        if (!touchExists) {
            var touchEvent = script.createEvent("TouchStartEvent");
            touchEvent.bind(function(eventData) {
                var target = eventData.getTouchPosition();
                if (target.x >= 0.5) {  // If touch is on right side of screen
                    print("▶️ Right button touch detected");
                    changeImage(1);
                }
            });
        }
    }
}

var startEvent = script.createEvent("OnStartEvent");
startEvent.bind(function() {
    print("🚀 Starting application...");
    
    // First inspect what we have
    inspectButtons();
    
    // Then try to set up the buttons
    setupButtons();
    
    // Finally fetch the image URLs
    fetchImageUrls();
});