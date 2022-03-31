// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBPlEX6qzjkX5Qty52mAo0XXXTsDYuiMmU",
  authDomain: "personal-website-801cc.firebaseapp.com",
  projectId: "personal-website-801cc",
  storageBucket: "personal-website-801cc.appspot.com",
  messagingSenderId: "893137998155",
  appId: "1:893137998155:web:a0c7f06109c5e6994bd8ce",
  measurementId: "G-J3PKX2Y5C0"
};

// Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
//
firebase.initializeApp(firebaseConfig);
firebase.analytics();
db = firebase.firestore();

//Get password
function getPassword() {
  var docRef = db.collection("password").doc("code");

  docRef.get().then((doc) => {
      if (doc.exists) {
          console.log("Document data:", doc.data());
      } else {
          // doc.data() will be undefined in this case
          console.log("No such document!");
      }
  }).catch((error) => {
      console.log("Error getting document:", error);
  });
}

getPassword()


var granimInstance = new Granim({
    element: '#canvas-image-blending',
    direction: 'top-bottom',
    isPausedWhenNotInView: true,
    image : {
        source: 'assets/snow.jpg',
        blendingMode: 'multiply',
    },
    states : {
        "default-state": {
            gradients: [
                ['#29323c', '#485563'],
                ['#FF6B6B', '#556270'],
                ['#80d3fe', '#7ea0c4'],
                ['#f0ab51', '#eceba3']
            ],
            transitionSpeed: 8000
        }
    }
});

//MODAL MIJNMEDICIJN
var modalMijnMedicijn = document.getElementById("modalMijnMedicijn");

// Get the button that opens the modal
var btnMijnMedicijn = document.getElementById("modalMijnMedicijnButton");

// Get the <span> element that closes the modal
var spanMijnMedicijn = document.getElementsByClassName("closeMijnMedicijn")[0];

// When the user clicks on the button, open the modal
btnMijnMedicijn.onclick = function() {
  modalMijnMedicijn.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
spanMijnMedicijn.onclick = function() {
  modalMijnMedicijn.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modalMijnMedicijn) {
    modalMijnMedicijn.style.display = "none";
  }
}

//MODAL BYTECAMPS
var modalBytecamps = document.getElementById("modalBytecamps");

// Get the button that opens the modal
var btnBytecamps = document.getElementById("modalBytecampsButton");

// Get the <span> element that closes the modal
var spanBytecamps = document.getElementsByClassName("closeBytecamps")[0];

// When the user clicks on the button, open the modal
btnBytecamps.onclick = function() {
  modalBytecamps.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
spanBytecamps.onclick = function() {
  modalBytecamps.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modalBytecamps) {
    modalBytecamps.style.display = "none";
  }
}

//MODAL TECH CLUB
var modalTechClub = document.getElementById("modalTechClub");

// Get the button that opens the modal
var btnTechClub = document.getElementById("modalTechClubButton");

// Get the <span> element that closes the modal
var spanTechClub = document.getElementsByClassName("closeTechClub")[0];

// When the user clicks on the button, open the modal
btnTechClub.onclick = function() {
  modalTechClub.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
spanTechClub.onclick = function() {
  modalTechClub.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modalTechClub) {
    modalTechClub.style.display = "none";
  }
}

//ROSACODES LINK
var btnRosaCodes = document.getElementById("rosacodesButton");
btnRosaCodes.onclick = function() {
  window.open("https://instagram.com/rosacodes", "_blank")
}

//SPLANNER LINK
var btnSplanner = document.getElementById("splannerButton");
btnSplanner.onclick = function() {
  window.open("https://devpost.com/software/splanner-your-personal-school-schedule-w-notifications", "_blank")
}

//MODAL AMBI ROBOTICS
var modalAmbi = document.getElementById("modalAmbi");

// Get the button that opens the modal
var btnAmbi = document.getElementById("modalAmbiButton");

// Get the <span> element that closes the modal
var spanAmbi = document.getElementsByClassName("closeAmbi")[0];

// When the user clicks on the button, open the modal
btnAmbi.onclick = function() {
  modalAmbi.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
spanAmbi.onclick = function() {
  modalAmbi.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modalAmbi) {
    modalAmbi.style.display = "none";
  }
}

//EASYACCESS LINK
var btnEasyAccess = document.getElementById("easyAccessButton");
btnEasyAccess.onclick = function () {
  window.open("https://devpost.com/software/easyaccess-the-accessible-password-manager", "_blank")
}

//MODAL TECHNOVATION
var modalTechnovation = document.getElementById("modalTechnovation");

// Get the button that opens the modal
var btnTechnovation = document.getElementById("technovationButton");

// Get the <span> element that closes the modal
var spanTechnovation = document.getElementsByClassName("closeTechnovation")[0];

// When the user clicks on the button, open the modal
btnTechnovation.onclick = function() {
  modalTechnovation.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
spanTechnovation.onclick = function() {
  modalTechnovation.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modalTechnovation) {
    modalTechnovation.style.display = "none";
  }
}

//MODAL DIGIVITA
var modalDigivita = document.getElementById("modalDigivita");

// Get the button that opens the modal
var btnDigivita = document.getElementById("DigivitaButton");

// Get the <span> element that closes the modal
var spanDigivita = document.getElementsByClassName("closeDigivita")[0];

// When the user clicks on the button, open the modal
btnDigivita.onclick = function() {
  modalDigivita.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
spanDigivita.onclick = function() {
  modalDigivita.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modalDigivita) {
    modalDigivita.style.display = "none";
  }
}

//SCRATCH LINK
var btnEasyAccess = document.getElementById("ScratchButton");
btnEasyAccess.onclick = function () {
  window.open("https://scratch.mit.edu/users/Rosaliew/", "_blank")
}

//MODAL TENNIS
var modalTennis = document.getElementById("modalTennis");

// Get the button that opens the modal
var btnTennis = document.getElementById("TennisButton");

// Get the <span> element that closes the modal
var spanTennis = document.getElementsByClassName("closeTennis")[0];

// When the user clicks on the button, open the modal
btnTennis.onclick = function() {
  modalTennis.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
spanTennis.onclick = function() {
  modalTennis.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modalTennis) {
    modalTennis.style.display = "none";
  }
}

//MODAL BASKETBALL
var modalBasketball = document.getElementById("modalBasketball");

// Get the button that opens the modal
var btnBasketball = document.getElementById("BasketballButton");

// Get the <span> element that closes the modal
var spanBasketball = document.getElementsByClassName("closeBasketball")[0];

// When the user clicks on the button, open the modal
btnBasketball.onclick = function() {
  modalBasketball.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
spanBasketball.onclick = function() {
  modalBasketball.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modalBasketball) {
    modalBasketball.style.display = "none";
  }
}

//MODAL RACING
var modalRacing = document.getElementById("modalRacing");

// Get the button that opens the modal
var btnRacing = document.getElementById("RacingButton");

// Get the <span> element that closes the modal
var spanRacing = document.getElementsByClassName("closeRacing")[0];

// When the user clicks on the button, open the modal
btnRacing.onclick = function() {
  modalRacing.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
spanRacing.onclick = function() {
  modalRacing.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modalRacing) {
    modalRacing.style.display = "none";
  }
}

//MODAL SKIINg
var modalSkiing = document.getElementById("modalAap");

// Get the button that opens the modal
var btnSkiing = document.getElementById("SkiingButton");

// Get the <span> element that closes the modal
var spanSkiing = document.getElementsByClassName("closeAap")[0];

// When the user clicks on the button, open the modal
btnSkiing.onclick = function() {
  modalSkiing.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
spanSkiing.onclick = function() {
  modalSkiing.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modalSkiing) {
    modalSkiing.style.display = "none";
  }
}

//MODAL WINDSURFING
var modalWindsurfing = document.getElementById("modalNoot");

// Get the button that opens the modal
var btnWindsurfing = document.getElementById("WindsurfingButton");

// Get the <span> element that closes the modal
var spanWindsurfing = document.getElementsByClassName("closeNoot")[0];

// When the user clicks on the button, open the modal
btnWindsurfing.onclick = function() {
  console.log("windsutfing butting clicked");
  console.log("before", modalWindsurfing.style.display);
  modalWindsurfing.style.display = "block";
  console.log("after", modalWindsurfing.style.display);
}

// When the user clicks on <span> (x), close the modal
spanWindsurfing.onclick = function() {
  modalWindsurfing.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modalWindsurfing) {
    modalWindsurfing.style.display = "none";
  }
}