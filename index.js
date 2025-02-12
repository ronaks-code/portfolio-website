// Typewriter effect
var app = document.getElementById("app");

var typewriter = new Typewriter(app, {
  loop: true,
  delay: 20,
});

typewriter
  .pauseFor(500)
  .typeString(
    "Coding, breaking stuff, fixing it, and pretending it worked on the first try."
  )
  .pauseFor(2000)
  .start();

// Background gradient animation
var granimInstance = new Granim({
  element: "#canvas-image-blending",
  direction: "top-bottom",
  isPausedWhenNotInView: true,
  image: {
    source: "assets/snow.jpg", // Change image for intro section if desired
    blendingMode: "multiply",
  },
  states: {
    "default-state": {
      gradients: [
        ["#29323c", "#485563"],
        ["#FF6B6B", "#556270"],
        ["#80d3fe", "#7ea0c4"],
        ["#f0ab51", "#eceba3"],
      ],
      transitionSpeed: 8000,
    },
  },
});

// Modal Data Import
import modalData from "./modalData.js";

// Function to open modal dynamically
function openModal(modalId) {
  const modalInfo = modalData[modalId];
  if (!modalInfo) {
    console.error(`❌ No modal data found for ID: ${modalId}`);
    return;
  }

  console.log(`▶️ Opening modal for ID: ${modalId}`);

  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modal-title");
  const modalDescription = document.getElementById("modal-description");
  const skillsUsedList = document.getElementById("modal-skills-used");
  const skillsLearnedList = document.getElementById("modal-skills-learned");
  const nextStepsList = document.getElementById("modal-next-steps");
  const linksList = document.getElementById("modal-links"); // 🔹 Added reference to links container
  const carouselInner = document.getElementById("modal-carousel-inner");
  const carouselIndicators = document.getElementById(
    "modal-carousel-indicators"
  );

  if (
    !modal ||
    !modalTitle ||
    !modalDescription ||
    !skillsUsedList ||
    !skillsLearnedList ||
    !nextStepsList ||
    !carouselInner ||
    !carouselIndicators
  ) {
    console.error("❌ Some modal elements are missing in the DOM.");
    return;
  }

  // Populate modal content
  modalTitle.innerText = modalInfo.title;
  modalDescription.innerText = modalInfo.description;
  skillsUsedList.innerHTML = modalInfo.skillsUsed
    .map((skill) => `<li>${skill}</li>`)
    .join("");
  skillsLearnedList.innerHTML = modalInfo.skillsLearned
    .map((skill) => `<li>${skill}</li>`)
    .join("");
  nextStepsList.innerHTML =
    modalInfo.nextSteps.length > 0
      ? modalInfo.nextSteps.map((step) => `<li>${step}</li>`).join("")
      : "<li>No upcoming steps listed.</li>";

  // 🔹 Populate links section dynamically
  if (modalInfo.links && Object.keys(modalInfo.links).length > 0) {
    linksList.innerHTML = Object.entries(modalInfo.links)
      .map(
        ([name, url]) =>
          `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${name}</a></li>`
      )
      .join("");
  } else {
    linksList.innerHTML = "<li>Under construction!</li>";
  }

  // Populate carousel
  carouselInner.innerHTML = "";
  carouselIndicators.innerHTML = "";

  modalInfo.images.forEach((imageSrc, index) => {
    // Create an indicator button
    const indicator = document.createElement("button");
    indicator.setAttribute("type", "button");
    indicator.setAttribute("data-bs-target", "#modal-carousel");
    indicator.setAttribute("data-bs-slide-to", index);
    if (index === 0) indicator.classList.add("active");
    carouselIndicators.appendChild(indicator);

    // Create a carousel item
    const carouselItem = document.createElement("div");
    carouselItem.classList.add("carousel-item");
    if (index === 0) carouselItem.classList.add("active");

    const img = document.createElement("img");
    img.src = imageSrc;
    img.classList.add("d-block", "w-100");
    img.alt = modalInfo.title;

    carouselItem.appendChild(img);
    carouselInner.appendChild(carouselItem);
  });

  // ✅ Show modal with proper centering
  modal.classList.add("active");

  // ✅ Adjust modal heights dynamically after rendering
  setTimeout(adjustModalHeights, 200);
}

// ✅ Function to adjust modal heights dynamically
function adjustModalHeights() {
  const fullBoxes = document.querySelectorAll(".grid-item.full-box");
  const halfBoxes = document.querySelectorAll(".grid-item.half-box");

  if (fullBoxes.length > 0 && halfBoxes.length > 0) {
    const fullHeight = fullBoxes[0].offsetHeight;
    const halfHeight = (fullHeight - 20) / 2; // Split into two equal parts with margin

    halfBoxes.forEach((box) => {
      box.style.height = `${halfHeight}px`;
    });
  }
}

// ✅ Function to close modal
function closeModal() {
  const modal = document.getElementById("modal");
  if (modal) {
    modal.classList.remove("active");
  }
}

// ✅ Close modal when clicking close button
document.addEventListener("click", function (event) {
  if (event.target.classList.contains("closeModal")) {
    console.log("❌ Closing modal");
    closeModal();
  }
});

// ✅ Close modal when clicking outside modal content
window.addEventListener("click", function (event) {
  const modal = document.getElementById("modal");
  if (modal && event.target === modal) {
    console.log("🔲 Closing modal due to outside click");
    closeModal();
  }
});

// ✅ Ensure all buttons attach properly
document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ Modal script loaded");
  for (let i = 1; i <= 7; i++) {
    const button = document.getElementById(`btn${i}`);
    if (button) {
      console.log(`🎯 Button btn${i} found`);
      button.addEventListener("click", function () {
        console.log(`🟢 Button btn${i} clicked`);
        openModal(i);
      });
    } else {
      console.warn(`⚠️ Button btn${i} not found`);
    }
  }

  // ✅ Adjust modal heights when DOM is loaded
  adjustModalHeights();
});

// ✅ Re-adjust heights on window resize
window.addEventListener("resize", adjustModalHeights);

document.addEventListener("DOMContentLoaded", function () {
  const navLinks = document.querySelectorAll(".vertical-nav li");

  navLinks.forEach((link) => {
    link.addEventListener("click", function () {
      const targetId = this.getAttribute("data-target");
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 50, // Adjust offset if needed
          behavior: "smooth",
        });
      }
    });
  });
});

export { openModal };
