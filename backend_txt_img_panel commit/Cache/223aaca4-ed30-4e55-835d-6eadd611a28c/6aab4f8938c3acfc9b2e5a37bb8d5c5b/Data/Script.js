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
        print("📦 Raw image data: " + JSON.stringify(json.images));

        var textBlocks = json.texts;
        print("📝 Loaded " + textBlocks.length + " text blocks");

        textBlocks.forEach(function(text, index) {
            var textObject = global.scene.createSceneObject("TextPanel_" + index);
            var textComponent = textObject.createComponent("Component.Text");

            textComponent.text = text;
            textComponent.fontSize = 24;
            textComponent.textFill.color = new vec4(1, 1, 1, 1); // white text

            // Random initial position (just for quick testing)
            textObject.getTransform().setLocalPosition(new vec3(Math.random() * 0.5, Math.random() * 0.5, 0));

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

    if (index < 0 || index >= imageUrls.length) {
        print("❌ Invalid image index: " + index);
        return;
    }

    var url = imageUrls[index];
    print("🧪 Trying to load image from URL: " + url);

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
    var leftScript = script.leftButton.getComponent("Component.ScriptComponent");
    if (leftScript && leftScript.api && leftScript.api.onTriggerStart) {
        leftScript.api.onTriggerStart.add(function() {
            print("◀️ Left button pressed");
            changeImage(-1);
        });
    }

    var rightScript = script.rightButton.getComponent("Component.ScriptComponent");
    if (rightScript && rightScript.api && rightScript.api.onTriggerStart) {
        rightScript.api.onTriggerStart.add(function() {
            print("▶️ Right button pressed");
            changeImage(1);
        });
    }
}

var startEvent = script.createEvent("OnStartEvent");
startEvent.bind(function() {
    print("🚀 Starting application...");
    setupButtons();
    fetchImageUrls();
});
