const wall = document.getElementById("monkey-wall");

const monkeyGif = "monkey.gif";
const maxMonkeys = 100;
const delay = 50;

let count = 0;

function addMonkey() {
  if (count >= maxMonkeys) return;

  const img = document.createElement("img");
  img.src = monkeyGif;
  img.alt = "Monkey typing";
  img.className = "monkey";

  wall.appendChild(img);
  count++;

  setTimeout(addMonkey, delay);
}

addMonkey();