var imageUrls = [];
var textBlocks = [];
var currentPageIndex = 0;

// 🎯 Clear old content and display new page
function displayPage(index) {
    if (!imageUrls || imageUrls.length === 0) {
        print("❌ No image URLs loaded");
        return;
    }

    if (index < 0 || index >= imageUrls.length) {
        print("⚠️ Invalid index: " + index);
        return;
    }

    // Clear previous children
    var children = script.assetPanelParent.getChildren();
    children.forEach(function(child) {
        child.enabled = false;
        child.destroy();
    });

    // Display image
    var imgUrl = imageUrls[index];
    print("🧪 Loading image: " + imgUrl);
    var imgResource = script.remoteServiceModule.makeResourceFromUrl(imgUrl);

    script.remoteMediaModule.loadResourceAsImageTexture(
        imgResource,
        function(texture) {
            var imgObj = global.scene.createSceneObject("ImagePanel_" + index);
            var imgComp = imgObj.createComponent("Component.Image");
            imgComp.mainPass.baseTex = texture;
            imgObj.getTransform().setLocalPosition(new vec3(0, 0.25, 0));  // Adjust position as needed
            imgObj.setParent(script.assetPanelParent);
            print("✅ Image loaded and displayed");
        },
        function(err) {
            print("❌ Failed to load image: " + err);
        }
    );

    // Display text (if exists)
    var textContent = textBlocks[index];
    if (textContent && textContent.length > 0) {
        var textObj = global.scene.createSceneObject("TextPanel_" + index);
        var textComp = textObj.createComponent("Component.Text");
        textComp.text = textContent;
        textComp.fontSize = 24;
        textComp.textFill.color = new vec4(1, 1, 1, 1);  // White
        textObj.getTransform().setLocalPosition(new vec3(0, -0.25, 0));
        textObj.setParent(script.assetPanelParent);
        print("📝 Displayed text for page " + index);
    } else {
        print("⚠️ No text for page " + index);
    }
}

// 🔁 Change page
function changePage(direction) {
    currentPageIndex += direction;
    if (currentPageIndex < 0) currentPageIndex = imageUrls.length - 1;
    if (currentPageIndex >= imageUrls.length) currentPageIndex = 0;

    print("🔄 Changing to page " + currentPageIndex);
    displayPage(currentPageIndex);
}

// 📦 Fetch from API
async function fetchAssets() {
    var url = "https://ar-notes-backend-immersegt-eddf3c030982.herokuapp.com/upload_notes_result";

    var request = new Request(url, {
        method: "GET"
    });

    try {
        var response = await script.remoteServiceModule.fetch(request);
        if (response.status !== 200) {
            print("❌ Failed to fetch assets, status: " + response.status);
            return;
        }

        var json = await response.json();
        imageUrls = json.images || [];
        textBlocks = json.texts || [];

        print("✅ Assets received — Pages: " + imageUrls.length);
        displayPage(currentPageIndex);
    } catch (e) {
        print("❌ Error fetching assets: " + e);
    }
}

// ⬅️ Setup Left Button
var leftComp = script.leftButton.getComponent("Component.ScriptComponent");
if (leftComp && leftComp.api.onTriggerStart) {
    leftComp.api.onTriggerStart.add(function() {
        print("⬅️ Previous page");
        changePage(-1);
    });
}

// ➡️ Setup Right Button
var rightComp = script.rightButton.getComponent("Component.ScriptComponent");
if (rightComp && rightComp.api.onTriggerStart) {
    rightComp.api.onTriggerStart.add(function() {
        print("➡️ Next page");
        changePage(1);
    });
}

// 🚀 Start Fetching
var startEvent = script.createEvent("OnStartEvent");
startEvent.bind(function() {
    print("🚀 Initializing AR Asset Panel");
    fetchAssets();
});
