//@input Asset.RemoteServiceModule remoteServiceModule
//@input Asset.RemoteMediaModule remoteMediaModule
//@input Component.Image notesImage
//@input SceneObject leftButton
//@input SceneObject rightButton

var imageUrls = [];
var currentIndex = 0;



// Check button components
function inspectButtons() {
    print("=== Inspecting Left Button ===");
    if (!script.leftButton) {
        print("Left button object is not assigned");
        return;
    }
    print("Left button exists: " + script.leftButton.name);
    
    // Get script component
    var leftScript = script.leftButton.getComponent("Component.ScriptComponent");
    if (leftScript) {
        print("Found script component on left button");
       
    } else {
        print("No script component found on left button");
    }
    
    print("=== Inspecting Right Button ===");
    if (!script.rightButton) {
        print("Right button object is not assigned");
        return;
    }
    print("Right button exists: " + script.rightButton.name);
    
    // Get script component
    var rightScript = script.rightButton.getComponent("Component.ScriptComponent");
    if (rightScript) {
        print("Found script component on right button");
        
    } else {
        print("No script component found on right button");
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

        var textBlocks = json.texts;
print("📝 Loaded " + textBlocks.length + " text blocks");

textBlocks.forEach(function(text, index) {
    var textObject = global.scene.createSceneObject("TextPanel_" + index);
    var textComponent = textObject.createComponent("Component.Text");
    
    textComponent.text = text;
    textComponent.fontSize = 24;
    textComponent.textFill.color = new vec4(1, 1, 1, 1); // white text

    // Random initial position (you can update this logic later)
    textObject.getTransform().setLocalPosition(new vec3(Math.random() * 0.5, Math.random() * 0.5, 0));

    // Optional: Add touch drag/move component if needed
    print("📌 Created text panel for block " + index);
});

        
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
        print("🧪 Trying to load image from URL: " + url);
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
    // Try to connect to left button
    var leftScript = script.leftButton.getComponent("Component.ScriptComponent");
    var leftConnected = false;
    
    if (leftScript && leftScript.api) {
        // Try onButtonPinched first
        if (leftScript.api.onButtonPinched && typeof leftScript.api.onButtonPinched.add === "function") {
            print("✅ Found onButtonPinched on left button");
            leftScript.api.onButtonPinched.add(function() {
                print("◀️ Left button pressed!");
                changeImage(-1);
            });
            leftConnected = true;
        } 
        // Try onTriggerStart next
        else if (leftScript.api.onTriggerStart && typeof leftScript.api.onTriggerStart.add === "function") {
            print("✅ Found onTriggerStart on left button");
            leftScript.api.onTriggerStart.add(function() {
                print("◀️ Left button pressed via onTriggerStart!");
                changeImage(-1);
            });
            leftConnected = true;
        }
        // Check for any suitable event
        else {
            for (var prop in leftScript.api) {
                if (typeof leftScript.api[prop] === "object" && 
                    leftScript.api[prop] !== null && 
                    typeof leftScript.api[prop].add === "function") {
                    
                    print("Found potential event on left button: " + prop);
                    
                    if (prop.toLowerCase().includes("trigger") || 
                        prop.toLowerCase().includes("button") ||
                        prop.toLowerCase().includes("pinch") ||
                        prop.toLowerCase().includes("touch")) {
                        
                        print("✅ Connecting to left button via " + prop);
                        
                        leftScript.api[prop].add(function() {
                            print("◀️ Left button pressed via " + prop + "!");
                            changeImage(-1);
                        });
                        
                        leftConnected = true;
                        break;
                    }
                }
            }
        }
    }
    
    // If no events found, use a touch event fallback
    if (!leftConnected) {
        print("⚠️ No events found on left button, using touch fallback");
        var touchEvent = script.createEvent("TouchStartEvent");
        touchEvent.bind(function(eventData) {
            var touch = eventData.getTouchPosition();
            if (touch.x < 0.5) {  // Left half of screen
                print("◀️ Left touch detected");
                changeImage(-1);
            } else {  // Right half of screen
                print("▶️ Right touch detected");
                changeImage(1);
            }
        });
        return;  // If we're using touch fallback, no need to set up right button separately
    }
    
    // Try to connect to right button 
    var rightScript = script.rightButton.getComponent("Component.ScriptComponent");
    var rightConnected = false;
    
    if (rightScript && rightScript.api) {
        // Try onButtonPinched first
        if (rightScript.api.onButtonPinched && typeof rightScript.api.onButtonPinched.add === "function") {
            print("✅ Found onButtonPinched on right button");
            rightScript.api.onButtonPinched.add(function() {
                print("▶️ Right button pressed!");
                changeImage(1);
            });
            rightConnected = true;
        } 
        // Try onTriggerStart next
        else if (rightScript.api.onTriggerStart && typeof rightScript.api.onTriggerStart.add === "function") {
            print("✅ Found onTriggerStart on right button");
            rightScript.api.onTriggerStart.add(function() {
                print("▶️ Right button pressed via onTriggerStart!");
                changeImage(1);
            });
            rightConnected = true;
        }
        // Check for any suitable event
        else {
            for (var prop in rightScript.api) {
                if (typeof rightScript.api[prop] === "object" && 
                    rightScript.api[prop] !== null && 
                    typeof rightScript.api[prop].add === "function") {
                    
                    print("Found potential event on right button: " + prop);
                    
                    if (prop.toLowerCase().includes("trigger") || 
                        prop.toLowerCase().includes("button") ||
                        prop.toLowerCase().includes("pinch") ||
                        prop.toLowerCase().includes("touch")) {
                        
                        print("✅ Connecting to right button via " + prop);
                        
                        rightScript.api[prop].add(function() {
                            print("▶️ Right button pressed via " + prop + "!");
                            changeImage(1);
                        });
                        
                        rightConnected = true;
                        break;
                    }
                }
            }
        }
    }
    
    // If right button has no events, add a touch handler if we haven't already
    if (!rightConnected && leftConnected) {
        print("⚠️ No events found on right button, using touch fallback");
        var touchEvent = script.createEvent("TouchStartEvent");
        touchEvent.bind(function(eventData) {
            var touch = eventData.getTouchPosition();
            if (touch.x >= 0.5) {  // Right half of screen
                print("▶️ Right touch detected");
                changeImage(1);
            }
        });
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