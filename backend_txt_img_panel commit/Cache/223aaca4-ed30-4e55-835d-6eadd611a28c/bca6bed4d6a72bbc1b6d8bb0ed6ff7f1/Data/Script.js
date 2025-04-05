//@input Asset.RemoteServiceModule remoteServiceModule
//@input Asset.RemoteMediaModule remoteMediaModule
//@input Component.Image notesImage
//@input SceneObject leftButton
//@input SceneObject rightButton

var imageUrls = [];
var currentIndex = 0;

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
        
        // Load the first image immediately
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

function setupButtons() {
    // Connect left button
    if (script.leftButton) {
        var leftScriptComp = script.leftButton.getComponent("Component.ScriptComponent");
        if (leftScriptComp && leftScriptComp.api && leftScriptComp.api.onButtonPinched) {
            print("✅ Left button wired!");
            leftScriptComp.api.onButtonPinched.add(function() {
                print("◀️ Left button pressed!");
                changeImage(-1);
            });
        } else {
            print("❌ Left button not wired properly. Make sure it has the button.js script with assigned interactable.");
        }
    } else {
        print("❌ Left button object not assigned");
    }

    // Connect right button
    if (script.rightButton) {
        var rightScriptComp = script.rightButton.getComponent("Component.ScriptComponent");
        if (rightScriptComp && rightScriptComp.api && rightScriptComp.api.onButtonPinched) {
            print("✅ Right button wired!");
            rightScriptComp.api.onButtonPinched.add(function() {
                print("▶️ Right button pressed!");
                changeImage(1);
            });
        } else {
            print("❌ Right button not wired properly. Make sure it has the button.js script with assigned interactable.");
        }
    } else {
        print("❌ Right button object not assigned");
    }
}

var startEvent = script.createEvent("OnStartEvent");
startEvent.bind(function() {
    print("🚀 Starting application...");
    setupButtons();
    fetchImageUrls();
});