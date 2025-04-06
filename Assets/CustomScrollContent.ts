/**
 * This class is responsible for creating and positioning grid content items based on a specified prefab and item count. It instantiates the items and arranges them vertically with a specified offset.
 */
@component
export class CustomScrollContent extends BaseScriptComponent {
  @input
  itemPrefab!: ObjectPrefab
  @input
  itemsCount: number = 10
  @input
  remoteServiceModule: RemoteServiceModule

  async fetchImageUrls() {
    var url = "https://ar-notes-backend-immersegt-eddf3c030982.herokuapp.com/upload_notes_result";

    var request = new Request(url, {
      method: "GET"
    });

    try {
      const response = await this.remoteServiceModule.fetch(request);
      if (response.status != 200) {
        print("Failed to fetch image URLs, status: " + response.status);
        return;
      }

      const contentType = response.headers.get("Content-Type");
      if (!contentType || !contentType.includes("application/json")) {
        print("Unexpected content type: " + contentType);
        return;
      }

      const json = await response.json();
      const imageUrls = json.images;
      print("📦 Raw image data: " + JSON.stringify(json.images));


      var textBlocks = json.texts;
      print("📝 Loaded " + textBlocks.length + " text blocks");

      textBlocks.forEach((text, index) => {
        const item = this.itemPrefab.instantiate(this.getSceneObject());
        const textObject = item.getChild(0);
        const screenTransform = item.getComponent("Component.ScreenTransform")
        const textComponent = textObject.createComponent("Component.Text");
        textComponent.text = text;
        textComponent.size = 80;
        print("doing stuff");
        textComponent.textFill.color = new vec4(0, 0, 1, 1);
        const textBounds = textComponent.worldSpaceRect;
        const textHeight = textBounds.getSize().y
        screenTransform.offsets.setCenter(new vec2(0, 50 * index));
      });


      print("✅ Loaded " + imageUrls.length + " image URLs");

      //loadImage(currentIndex);
    } catch (e) {
      print("Error fetching image URLs: " + e);
    }
  }

  onAwake(): void {
    const yStart = 0
    const yOffset = -5.4

    const call = async () => {
      const res = await this.fetchImageUrls();
    }

    call();

    for (let i = 0; i < this.itemsCount; i++) {
      const item = this.itemPrefab.instantiate(this.getSceneObject())
      const screenTransform = item.getComponent("Component.ScreenTransform")
      screenTransform.offsets.setCenter(new vec2(0, yStart + yOffset * i))
      item.enabled = true
    }
  }
}

