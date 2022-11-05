import { createInlineLlamaIcon, getStorage, getAccountTags, logImage } from "@src/pages/libs/helpers";
import gib from "@src/assets/img/memes/gib-128.png";

export async function injectTags() {
  const tagsInjector = await getStorage("local", "settings:tagsInjector", true);
  if (!tagsInjector) {
    return;
  }

  const urlType = window.location.pathname.split("/")[1];
  const account = window.location.pathname.split("/")[2];

  switch (urlType) {
    case "address":
      renderTagsOnAccountsPage();
      break;
    default:
      break;
  }

  async function renderTagsOnAccountsPage() {
    const tags = (await getAccountTags(account))?.tags ?? [];
    console.log(tags);
    if (tags.length === 0) {
      return;
    }

    logImage(gib, `Llama Power knows a lot about ${account}`);

    const tagsContainer = document.createElement("div");
    tagsContainer.className = "d-flex align-items-center";
    tagsContainer.style.marginBottom = "10px";

    const tagsText = document.createElement("span");
    tagsText.className = "text-muted";
    tagsText.style.marginRight = "10px";
    tagsText.innerText = "Tags:";
    tagsContainer.appendChild(tagsText);

    const tagsList = document.createElement("span");
    tagsList.className = "text-muted";
    tagsList.style.marginRight = "10px";
    tagsList.innerText = tags.join(", ");
    tagsContainer.appendChild(tagsList);

    // const tagsButton = document.createElement("button");
    // tagsButton.className = "btn btn-sm btn-outline-primary";
    // tagsButton.innerText = "Edit";
    // tagsButton.onclick = () => {
    //   window.open(`https://llama.fi/tags/${account}`, "_blank");
    // };
    // tagsContainer.appendChild(tagsButton);

    const container = document.querySelector("#content > div.container.py-3");
    container.appendChild(tagsContainer);
  }
}
