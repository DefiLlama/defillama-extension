import { getStorage, getAccountTags, logImage, getImageUrl } from "@src/pages/libs/helpers";
import gib from "@src/assets/img/memes/gib-128.png";
import takeNote from "@src/assets/img/memes/take-note-128.png";
import { makeDisplayTags } from "@src/pages/libs/tagging-helpers";

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
    const accountData = await getAccountTags(account);
    console.log(accountData);
    const rawTags = accountData.tags;
    const entity = accountData.entity;
    if (rawTags.length === 0 && !entity) {
      return;
    }

    const displayTags = makeDisplayTags(rawTags);

    logImage(takeNote, `Llama knows a lot about ${account}`);

    // make a new card for tags
    const card = document.createElement("div");
    card.className = "card my-3";
    card.innerHTML = `
      <div class="card-body">
        <div class="row">
          <div class="col-md-12">
            <div class="d-flex flex-wrap flex align-items-center">
              <img src="${getImageUrl(
                takeNote,
              )}" width="24" height="24" class="d-inline-block align-top mr-2" alt="Llama Tagging logo" title="Llama Tagging">
              ${entity ? `<span class="badge badge-warning m-1" style="font-size: smaller;">${entity}</span>` : ""}
              ${displayTags
                .map((tag) => {
                  if (tag.link) {
                    return `
                    <a href="${tag.link(account)}">
                    <span class="badge badge-pill badge-light m-1" style="font-size: smaller;">${
                      tag.icon
                        ? `<img src="${getImageUrl(
                            tag.icon,
                          )}" width="12" height="12" class="d-inline-block align-top mr-1" alt="${tag.name} icon">`
                        : ""
                    }${tag.name}</span>
                    </a>`;
                  } else {
                    return `<span class="badge badge-pill badge-secondary m-1" style="font-size: smaller;">${tag.name}</span>`;
                  }
                })
                .join("")}
            </div>
          </div>
        </div>
      </div>
    `;

    const container = document.querySelector("#content > div.container.py-3");
    container.appendChild(card);
  }
}
