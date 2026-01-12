let map;
let markers = [];
const mapElement = document.getElementById("google_map");

async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  const cards = document.querySelectorAll(".store-locator-card" );

  const storeLongitude = Array.from(document.querySelectorAll(".store-locator-card__longitude")).map(item => item.textContent);
  const storeLatitude = Array.from(document.querySelectorAll(".store-locator-card__latitude")).map(item => item.textContent);
  const coordinateTitle = Array.from(document.querySelectorAll(".store-locator-card__coordinate-title"))
    .map(item => item.textContent)
    .map(item => item.replace(/([A-Z])/g, ' $1').trim());

  const coordinateAddress = Array.from(document.querySelectorAll(".store-locator-card__address")).map(item => item.textContent);
  const coordinateHours = Array.from(document.querySelectorAll(".store-locator-card__opening-hour")).map(item => item.innerHTML);
  const coordinateButtons = Array.from(document.querySelectorAll(".store-locator-card__actions")).map(item => item.innerHTML);
  const storeCountry = Array.from(document.querySelectorAll(".store-locator-card__content--country")).map(item => item.innerHTML);
  const storeCity = Array.from(document.querySelectorAll(".store-locator-card__content--city")).map(item => item.innerHTML);
  const storeAddress = Array.from(document.querySelectorAll(".store-locator-card__address")).map(item => item.innerHTML);
  const storePhone = Array.from(document.querySelectorAll(".store-locator-card__phone")).map(item => item.innerHTML);
  const storeMail = Array.from(document.querySelectorAll(".store-locator-card__mail")).map(item => item.innerHTML);

  const mapZoomLevel = Number(document.getElementById("google_map").dataset.mapZoomLevel) || 4;
  const mapZoomLevelUnit = mapZoomLevel <= 18 ? 3 : 0;

  const locations = [];

  for (let i = 0; i < storeLongitude.length; i++) {
    const coordinateIndex = i;
    const coordinatLatitude = Number(storeLatitude[coordinateIndex]);
    const coordinateT = coordinateTitle[coordinateIndex];
    const coordinateA = coordinateAddress[coordinateIndex];
    const tooltipContent =
      coordinateA && !coordinateT ? coordinateA : coordinateT;

    if (coordinatLatitude && (tooltipContent || "n/a")) {
      locations.push([
        `<b>${tooltipContent}</b><br/><a href="https://maps.google.com/?q=${coordinatLatitude},${Number(
          storeLongitude[i]
        )}" target="_blank" style="text-decoration: underline;">Location</a>`,
        coordinatLatitude,
        Number(storeLongitude[i])
      ]);
    }
  }

  const minLongitude = Math.min(...storeLongitude);
  const minLatitude = Math.min(...storeLatitude);
  const maxLongitude = Math.max(...storeLongitude);
  const maxLatitude = Math.max(...storeLatitude);

  const centerLatitude = (minLatitude + maxLatitude) / 2;
  const centerLongitude = (minLongitude + maxLongitude) / 2;

  if (
    typeof google === "undefined" ||
    typeof google.maps === "undefined"
  ) {
    return;
  }

  map = new Map(mapElement, {
    zoom: mapZoomLevel,
    center: { lat: centerLatitude, lng: centerLongitude },
    scrollwheel: true,
    gestureHandling: "greedy",
    disableDefaultUI: true,
    backgroundColor: "#89b4f8",
    mapId: "4504f8b37365c3d0"
  });

  const pinIcon = {
    url: mapElement.dataset.mapPinIcon
  };

  const infowindow = new google.maps.InfoWindow({
    maxWidth: 200
  });

  const setMapClickHandler = (item, i) => {
    item.addEventListener("click", function () {
      map.panTo(
        new google.maps.LatLng(locations[i][1], locations[i][2])
      );
      map.setZoom(mapZoomLevel + mapZoomLevelUnit);
    });
  };

  for (let i = 0; i < locations.length; i++) {
    setMapClickHandler(cards[i], i);

    const customMarker = document.createElement("div");
    const customMarkerLabel = document.createElement("div");
    const customMarkerPoint = document.createElement("div");
    const openingHoursLabel = document.createElement("div");
    const storeCountryLabel = document.createElement("div");
    const storeCityLabel = document.createElement("div");
    const buttonsLabel = document.createElement("div");
    const addressLabel = document.createElement("div");
    const phoneLabel = document.createElement("div");
    const mailLabel = document.createElement("div");
    const closeBtn = document.createElement("div");

    customMarker.className = "store-locator__map--custom-marker";
    customMarker.setAttribute(
      "id",
      `store-locator__map--custom-marker--${i}`
    );

    customMarkerLabel.className = "store-locator__map--custom-marker--label";
    customMarkerLabel.textContent = coordinateTitle[i];

    customMarkerPoint.className = "store-locator__map--custom-marker--point";
    customMarkerPoint.innerHTML = "&nbsp;";

    storeCountryLabel.className = "store-locator__map--custom-marker--country";
    storeCountryLabel.innerHTML = storeCountry[i];

    storeCityLabel.className = "store-locator__map--custom-marker--city";
    storeCityLabel.innerHTML = storeCity[i];

    openingHoursLabel.className = "store-locator__map--custom-marker--hours";
    openingHoursLabel.innerHTML = `
      ${coordinateHours[i]}
    `;

    addressLabel.className = "store-locator__map--custom-marker--address";
    addressLabel.insertAdjacentHTML(
      "afterbegin",
      `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6.0026 9.30123C3.57851 9.63803 1.83594 10.5699 1.83594 11.6668C1.83594 13.0476 4.59685 14.1668 8.0026 14.1668C11.4083 14.1668 14.1693 13.0476 14.1693 11.6668C14.1693 10.5699 12.4267 9.63803 10.0026 9.30123M8.0026 6.16683V11.5002M9.53447 2.468C10.3809 3.31442 10.3809 4.68674 9.53447 5.53233C8.68814 6.37792 7.31594 6.37874 6.47039 5.53233C5.62486 4.68591 5.62404 3.31359 6.47039 2.468C7.31674 1.62241 8.68814 1.62158 9.53447 2.468Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <div class="store-locator__map--custom-marker--address-text">
        ${storeAddress[i]}
      </div>
    `
    );

    phoneLabel.className = "store-locator__map--custom-marker--phone";
    phoneLabel.insertAdjacentHTML(
      "afterbegin",
      `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6.61161 4.57851L6.28179 3.45711C6.11489 2.88967 5.59411 2.5 5.00263 2.5H4.66853H3.81492C3.08638 2.5 2.48424 3.08678 2.56136 3.81123C2.72155 5.31593 3.19489 6.78253 3.95654 8.09533C4.90533 9.73067 6.26963 11.0949 7.90495 12.0437C9.22462 12.8094 10.6722 13.2615 12.1696 13.4273C12.9015 13.5083 13.5003 12.9031 13.5003 12.1667V10.9977C13.5003 10.4062 13.1106 9.8854 12.5432 9.71847L11.4218 9.38867C10.958 9.25227 10.4569 9.38553 10.1221 9.73427C9.72922 10.1435 9.10995 10.2575 8.63362 9.94947C7.60062 9.28147 6.71882 8.39967 6.05083 7.36667C5.74277 6.89033 5.85681 6.27107 6.26604 5.87821C6.61477 5.54343 6.74802 5.04229 6.61161 4.57851Z" stroke="black" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
      <a href="tel:${storePhone[i]}" class="store-locator__map--custom-marker--phone-text">
        ${storePhone[i]}
      </a>
    `
    );
    if (storeMail[i]) {
      mailLabel.className = "store-locator__map--custom-marker--mail";
      mailLabel.insertAdjacentHTML(
        "afterbegin",
        `
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
          <path d="M14.1673 4.73334V12.2667H15.1673V4.73334H14.1673ZM13.6007 12.8333H3.40065V13.8333H13.6007V12.8333ZM2.83399 12.2667V4.73334H1.83399V12.2667H2.83399ZM3.40065 4.16667H13.6007V3.16667H3.40065V4.16667ZM3.40065 12.8333C3.20572 12.8333 3.08959 12.8329 3.00351 12.8259C2.92325 12.8193 2.91406 12.8096 2.92499 12.8152L2.471 13.7062C2.62453 13.7844 2.77999 13.811 2.92207 13.8226C3.05833 13.8337 3.22222 13.8333 3.40065 13.8333V12.8333ZM1.83399 12.2667C1.83399 12.4451 1.8336 12.609 1.84473 12.7453C1.85634 12.8873 1.88291 13.0428 1.96115 13.1963L2.85215 12.7423C2.85772 12.7533 2.84797 12.7441 2.84141 12.6638C2.83437 12.5777 2.83399 12.4616 2.83399 12.2667H1.83399ZM2.92499 12.8152C2.89363 12.7992 2.86813 12.7737 2.85215 12.7423L1.96115 13.1963C2.073 13.4159 2.25147 13.5943 2.471 13.7062L2.92499 12.8152ZM14.1673 12.2667C14.1673 12.4616 14.1669 12.5777 14.1599 12.6638C14.1533 12.7441 14.1436 12.7533 14.1492 12.7423L15.0402 13.1963C15.1184 13.0428 15.145 12.8873 15.1566 12.7453C15.1677 12.609 15.1673 12.4451 15.1673 12.2667H14.1673ZM13.6007 13.8333C13.7791 13.8333 13.943 13.8337 14.0793 13.8226C14.2213 13.811 14.3768 13.7844 14.5303 13.7062L14.0763 12.8152C14.0873 12.8096 14.0781 12.8193 13.9978 12.8259C13.9117 12.8329 13.7956 12.8333 13.6007 12.8333V13.8333ZM14.1492 12.7423C14.1332 12.7737 14.1077 12.7992 14.0763 12.8152L14.5303 13.7062C14.7499 13.5943 14.9283 13.4159 15.0402 13.1963L14.1492 12.7423ZM15.1673 4.73334C15.1673 4.55491 15.1677 4.39101 15.1566 4.25476C15.145 4.11267 15.1184 3.95722 15.0402 3.80369L14.1492 4.25767C14.1436 4.24675 14.1533 4.25594 14.1599 4.33619C14.1669 4.42227 14.1673 4.53841 14.1673 4.73334H15.1673ZM13.6007 4.16667C13.7956 4.16667 13.9117 4.16706 13.9978 4.17409C14.0781 4.18065 14.0873 4.19041 14.0763 4.18484L14.5303 3.29383C14.3768 3.2156 14.2213 3.18903 14.0793 3.17742C13.943 3.16629 13.7791 3.16667 13.6007 3.16667V4.16667ZM15.0402 3.80369C14.9283 3.58416 14.7499 3.40569 14.5303 3.29383L14.0763 4.18484C14.1077 4.20082 14.1332 4.22631 14.1492 4.25767L15.0402 3.80369ZM2.83399 4.73334C2.83399 4.53841 2.83437 4.42227 2.84141 4.33619C2.84797 4.25594 2.85772 4.24675 2.85215 4.25767L1.96115 3.80369C1.88291 3.95722 1.85634 4.11267 1.84473 4.25476C1.8336 4.39101 1.83399 4.55491 1.83399 4.73334H2.83399ZM3.40065 3.16667C3.22222 3.16667 3.05833 3.16629 2.92207 3.17742C2.77999 3.18903 2.62453 3.2156 2.471 3.29383L2.92499 4.18484C2.91406 4.19041 2.92325 4.18065 3.00351 4.17409C3.08959 4.16706 3.20572 4.16667 3.40065 4.16667V3.16667ZM2.85215 4.25767C2.86813 4.22631 2.89363 4.20082 2.92499 4.18484L2.471 3.29383C2.25147 3.40569 2.073 3.58416 1.96115 3.80369L2.85215 4.25767ZM8.39512 8.43427L2.81727 3.87061L2.18403 4.64457L7.76185 9.20827L8.39512 8.43427ZM14.1841 3.87061L8.60619 8.43427L9.23945 9.20827L14.8173 4.64457L14.1841 3.87061ZM7.76185 9.20827C8.19165 9.55987 8.80965 9.55987 9.23945 9.20827L8.60619 8.43427C8.54479 8.48454 8.45652 8.48454 8.39512 8.43427L7.76185 9.20827Z" stroke="black" stroke-width="1" stroke-linejoin="round"/>
        </svg>
        <a href="mailto:${storeMail[i]}" class="store-locator__map--custom-marker--mail-text">
          ${storeMail[i]}
        </a>
      `
      );
    }

    closeBtn.className = "custom-marker-close-btn";
    closeBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M17.25 6.75L6.75 17.25" stroke="#111111" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="round"/>
        <path d="M6.75 6.75L17.25 17.25" stroke="#111111" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="round"/>
      </svg>
    `;

    closeBtn.addEventListener("click", e => {
      e.stopPropagation();
      e.currentTarget.parentElement.parentElement.classList.remove("store-locator__map--custom-marker--active");
      const markerElement = e.currentTarget.closest(".store-locator__map--custom-marker");
      markerElement.classList.remove("store-locator__map--custom-marker--active");

      document.querySelectorAll(".store-locator__map--custom-marker--point").forEach(point => {
        point.classList.remove("hidden");
      });
      showPin();
    });

    buttonsLabel.className = "store-locator__map--custom-marker--buttons";
    buttonsLabel.innerHTML = coordinateButtons[i];

    customMarker.appendChild(customMarkerLabel);
    customMarker.appendChild(customMarkerPoint);
    customMarkerLabel.appendChild(storeCountryLabel);
    customMarkerLabel.appendChild(storeCityLabel);
    customMarkerLabel.appendChild(openingHoursLabel);
    customMarkerLabel.appendChild(addressLabel);
    customMarkerLabel.appendChild(phoneLabel);
    customMarkerLabel.appendChild(mailLabel);
    customMarkerLabel.appendChild(buttonsLabel);
    customMarkerLabel.appendChild(closeBtn);

    const marker = new AdvancedMarkerElement({
      position: new google.maps.LatLng(
        locations[i][1],
        locations[i][2]
      ),
      map,
      content: customMarker
    });

    markers = [...markers, marker];

    google.maps.event.addListener(
      marker,
      "click",
      (function (marker, count) {
        return function () {
          let newLatLng;
          if (DeviceDetector.isMobile()) {
            newLatLng = new google.maps.LatLng(
              locations[i][1] - 1, // Adjust the latitude offset as needed
              locations[i][2]
            );
          } else {
            newLatLng = new google.maps.LatLng(
              locations[i][1] + 1, // Adjust the latitude offset as needed
              locations[i][2]
            );
          }
          map.panTo(newLatLng);

          document.querySelectorAll(".store-locator__map--custom-marker")
          .forEach(item => item.classList.remove("store-locator__map--custom-marker--active"));

          const clickedMarker = document.getElementById(`store-locator__map--custom-marker--${count}`);
          clickedMarker.classList.add("store-locator__map--custom-marker--active");

          document.querySelectorAll(".store-locator__map--custom-marker--label").forEach(label => {
            if (label.parentElement === clickedMarker) {
              label.style.display = "flex";
            } else {
              label.style.display = "none";
            }
          });

          document.querySelectorAll(".store-locator__map--custom-marker--point").forEach(point => {
            if (point.parentElement === clickedMarker) {
              point.style.display = "flex";
            } else {
              point.classList.add('hidden');
            }
          });

          /** display active marker styles */
          document.querySelectorAll(".store-locator__map--custom-marker")
            .forEach(item => item.classList.remove("store-locator__map--custom-marker--active"));
          document.getElementById(`store-locator__map--custom-marker--${count}`)
            .classList.add("store-locator__map--custom-marker--active");

          /** display selected marker's pin card */
          const mapWithSearch = document
            .querySelector(".store-locator__map-layout")
            .classList.contains(
              "store-locator__map-layout--with-search"
            );
          if (!mapWithSearch || DeviceDetector.isMobile()) {
            document
              .querySelectorAll(".store-locator-card")
              .forEach(card => (card.style.display = "none"));
            const markerEl = document.querySelector(`[data-marker-index="${count}"]`);
            if (markerEl) {
              markerEl.style.display = "block";
            }
          }
        };
      })(marker, i)
    );

    function showPin () {
      const showPin = document.querySelector('.store-locator').getAttribute('data-show-pin')

      if (showPin === 'true') {
        document
          .querySelectorAll(".store-locator__map--custom-marker--label")
          .forEach(label => (label.style.display = "flex"));
      } else {
        document
          .querySelectorAll(".store-locator__map--custom-marker--label")
          .forEach(label => (label.style.display = "none"));
      }
    }
    function removeMarkers () {
      /** remove active from all markers */
      const detailsEl = openingHoursLabel.querySelector("details");
      const summaryEl = detailsEl.querySelector("summary");

      if (summaryEl && DeviceDetector.isMobile()) {
        summaryEl.addEventListener("click", e => {
          e.stopPropagation();
        });
      } else {
        document
          .querySelectorAll(".store-locator__map--custom-marker")
          .forEach(item =>
            item.classList.remove(
              "store-locator__map--custom-marker--active"
            )
          );

        showPin();

        document
          .querySelectorAll(
            ".store-locator__map--custom-marker--point"
          )
          .forEach(point => {
            if (point.classList.contains("hidden")) {
              point.classList.remove("hidden");
            }
          });

        /** remove selected marker's pin card */
        document
          .querySelectorAll(".store-locator-card")
          .forEach(card => card.removeAttribute("style"));
      }
    }

    map.addListener("click", () => {
      removeMarkers();
    });

    const crossButtons = document.querySelectorAll(
      ".store-locator-card__cross"
    );

    crossButtons.forEach(button => {
      button.addEventListener("click", () => {
        removeMarkers();
      });
    });

  }
}

initMap();

