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
    currentIndex += direction;
    if (currentIndex < 0) currentIndex = imageUrls.length - 1;
    if (currentIndex >= imageUrls.length) currentIndex = 0;
    loadImage(currentIndex);
}

var leftInteractable = script.leftButton.getComponent("Component.Interactable");
if (leftInteractable) {
    leftInteractable.onPress.add(function () {
        changeImage(-1);
    });
}

var rightInteractable = script.rightButton.getComponent("Component.Interactable");
if (rightInteractable) {
    rightInteractable.onPress.add(function () {
        changeImage(1);
    });
}

var startEvent = script.createEvent("OnStartEvent");
startEvent.bind(async function () {
    await fetchImageUrls();
    loadImage(currentIndex);
});



