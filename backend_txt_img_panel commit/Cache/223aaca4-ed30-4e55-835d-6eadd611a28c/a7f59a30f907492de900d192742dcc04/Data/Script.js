//@input Asset.RemoteServiceModule remoteServiceModule
//@input Asset.RemoteMediaModule remoteMediaModule
//@input Component.Image notesImage
//@input SceneObject leftButton
//@input SceneObject rightButton


var imageUrls = [];
var currentIndex = 0;

async function fetchImageUrls() {
    var url = "https://ar-notes-backend-immersegt-eddf3c030982.herokuapp.com/upload_notes_result"; // Replace with your endpoint

    var request = new Request(url, {
        method: "GET"
    });

    var response = await script.remoteServiceModule.fetch(request);
    if (response.status != 200) {
        print("Failed to fetch image URLs");
        return;
    }

    var contentType = response.headers.get("Content-Type");
    if (!contentType || !contentType.includes("application/json")) {
        print("Unexpected content type: " + contentType);
        return;
    }

    var json = await response.json();
    imageUrls = json.images; // Make sure your API returns { "images": [ ... ] }
}

function loadImage(index) {
    if (!imageUrls || imageUrls.length === 0) return;
    
    var url = imageUrls[index];
    var resource = script.remoteServiceModule.makeResourceFromUrl(url);

    script.remoteMediaModule.loadResourceAsImageTexture(
        resource,
        function(texture) {
            script.notesImage.mainPass.baseTex = texture;
        },
        function(errorMessage) {
            print("Error loading image: " + errorMessage);
        }
    );
}

function changeImage(direction) {
    print("🟡 Button pressed! Changing image.");
    currentIndex += direction;
    if (currentIndex < 0) currentIndex = imageUrls.length - 1;
    if (currentIndex >= imageUrls.length) currentIndex = 0;
    loadImage(currentIndex);
}


var leftScriptComp = script.leftButton.getComponent("Component.ScriptComponent");
if (leftScriptComp && leftScriptComp.api && leftScriptComp.api.onButtonPinched) {
    print("✅ Left button wired!");
    leftScriptComp.api.onButtonPinched.add(function () {
        print("🟡 Left button pressed!");
        changeImage(-1);
    });
} else {
    print("❌ Left button not wired. ScriptComponent or onButtonPinched missing.");
}

var rightScriptComp = script.rightButton.getComponent("Component.ScriptComponent");
if (rightScriptComp && rightScriptComp.api && rightScriptComp.api.onButtonPinched) {
    print("✅ Right button wired!");
    rightScriptComp.api.onButtonPinched.add(function () {
        print("🟡 Right button pressed!");
        changeImage(1);
    });
} else {
    print("❌ Right button not wired. ScriptComponent or onButtonPinched missing.");
}



var startEvent = script.createEvent("OnStartEvent");
startEvent.bind(async function () {
    await fetchImageUrls();
    loadImage(currentIndex);
});



