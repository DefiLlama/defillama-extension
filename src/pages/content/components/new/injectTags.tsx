import { getStorage, getAccountTags, logImage, getImageUrl, getAccountTagsV1 } from "@src/pages/libs/helpers";
import takeNote from "@src/assets/img/memes/take-note-128.png";
import { makeDisplayTags } from "@src/pages/libs/tagging-helpers";

export const injectTags = async () => {
  const tagsInjector = await getStorage("local", "settings:tagsInjector", true);
  if (!tagsInjector) {
    return;
  }

  const urlType = window.location.pathname.split("/")[1];
  const account = document.querySelector("span#mainaddress")?.textContent?.trim()?.toLowerCase();

  switch (urlType) {
    case "address":
      renderTagsOnAccountsPage();
      break;
    default:
      break;
  }

  async function renderTagsOnAccountsPage() {
    const accountData = await getAccountTagsV1(account);
    console.log(accountData);

    // add a section .container-xxl under the first .container-xxl that can be found on the page
    const container = document.querySelector("section.container-xxl");
    const container2 = document.createElement("section");
    container2.className = "container-xxl";
    container?.parentNode?.insertBefore(container2, container.nextSibling);

    // insert a div with .card.h-100 into the new section
    const card = document.createElement("div");
    card.className = "card h-100 mt-3";
    container2.appendChild(card);

    // containers n stuff reeeeeee
    const cardBody = document.createElement("div");
    cardBody.className = "card-body d-flex flex-row gap-5";
    card.appendChild(cardBody);

    // insert a takeNote image into the card
    const takeNoteImage = document.createElement("img");
    takeNoteImage.src = getImageUrl(takeNote);
    takeNoteImage.width = 24;
    takeNoteImage.height = 24;
    takeNoteImage.className = "d-inline-block align-top mr-2";
    takeNoteImage.alt = "Llama Tagging logo";
    takeNoteImage.title = "Llama Tagging";
    cardBody.appendChild(takeNoteImage);
  }
};
